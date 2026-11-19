"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadTrialNotification } from "@/lib/email/trial";

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function timezoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  return asUtc - date.getTime();
}

function ukLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  const provisional = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), 0));
  const firstOffset = timezoneOffsetMs(provisional, "Europe/London");
  let resolved = new Date(provisional.getTime() - firstOffset);
  const secondOffset = timezoneOffsetMs(resolved, "Europe/London");
  if (secondOffset !== firstOffset) resolved = new Date(provisional.getTime() - secondOffset);
  return Number.isNaN(resolved.getTime()) ? null : resolved.toISOString();
}

async function activity(args: {
  supabase: ReturnType<typeof createAdminClient>;
  leadId: string;
  eventType: string;
  note: string;
  userId: string;
  userEmail: string | null;
}) {
  const { error } = await args.supabase.from("lead_activity").insert({
    lead_id: args.leadId,
    event_type: args.eventType,
    note: args.note,
    created_by: args.userId,
    created_by_email: args.userEmail,
  });
  if (error) throw new Error(error.message);
}

function revalidateLead(leadId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/analytics");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function setLeadFollowUp(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = text(formData, "leadId", 100);
  const rawAt = text(formData, "followUpAt", 40);
  const note = text(formData, "followUpNote", 1500);
  const followUpAt = ukLocalToIso(rawAt);
  if (!leadId || !followUpAt) return;

  const { error } = await supabase.from("tutoring_leads").update({
    next_follow_up_at: followUpAt,
    follow_up_note: note || null,
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) throw new Error(error.message);

  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(followUpAt));
  await activity({
    supabase,
    leadId,
    eventType: "follow_up_scheduled",
    note: `Follow-up scheduled for ${when}.${note ? ` ${note}` : ""}`,
    userId: session.user.id,
    userEmail: session.user.email || null,
  });
  revalidateLead(leadId);
}

export async function clearLeadFollowUp(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = text(formData, "leadId", 100);
  if (!leadId) return;

  const { error } = await supabase.from("tutoring_leads").update({
    next_follow_up_at: null,
    follow_up_note: null,
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) throw new Error(error.message);

  await activity({
    supabase,
    leadId,
    eventType: "follow_up_cleared",
    note: "Follow-up reminder cleared.",
    userId: session.user.id,
    userEmail: session.user.email || null,
  });
  revalidateLead(leadId);
}

export async function scheduleLeadTrial(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = text(formData, "leadId", 100);
  const rawScheduled = text(formData, "trialScheduledFor", 40);
  const scheduledFor = ukLocalToIso(rawScheduled);
  const duration = Number(text(formData, "trialDuration", 10) || "30");
  const meetingUrl = text(formData, "trialMeetingUrl", 1000) || null;
  const notes = text(formData, "trialNotes", 2000) || null;
  const notifyStudent = formData.get("notifyStudent") === "on";
  if (!leadId || !scheduledFor || !Number.isFinite(duration) || duration < 15 || duration > 180) return;

  const { data: lead, error: leadError } = await supabase
    .from("tutoring_leads")
    .select("id,name,email,subject,assigned_tutor_id")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) throw new Error(leadError?.message || "Lead not found.");

  let tutorName: string | null = null;
  if (lead.assigned_tutor_id) {
    const { data: tutor } = await supabase.from("tutors").select("name").eq("id", lead.assigned_tutor_id).maybeSingle();
    tutorName = tutor?.name || null;
  }

  const { error } = await supabase.from("tutoring_leads").update({
    trial_status: "scheduled",
    trial_scheduled_for: scheduledFor,
    trial_duration_minutes: duration,
    trial_meeting_url: meetingUrl,
    trial_notes: notes,
    trial_outcome: null,
    trial_completed_at: null,
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) throw new Error(error.message);

  const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(scheduledFor));
  await activity({
    supabase,
    leadId,
    eventType: "trial_scheduled",
    note: `Trial scheduled for ${when} (${duration} minutes)${tutorName ? ` with ${tutorName}` : ""}.${notes ? ` ${notes}` : ""}`,
    userId: session.user.id,
    userEmail: session.user.email || null,
  });

  if (notifyStudent) {
    const result = await sendLeadTrialNotification({
      leadId,
      name: lead.name,
      email: lead.email,
      subject: lead.subject,
      scheduledFor,
      durationMinutes: duration,
      tutorName,
      meetingUrl,
    });
    await activity({
      supabase,
      leadId,
      eventType: result.ok ? "trial_email_sent" : result.skipped ? "trial_email_skipped" : "trial_email_failed",
      note: result.ok ? `Trial confirmation emailed to ${lead.email}.` : `Trial confirmation email not sent: ${result.error || "Unknown email error"}`,
      userId: session.user.id,
      userEmail: session.user.email || null,
    });
  }

  revalidateLead(leadId);
}

const trialOutcomes = ["completed_proceed", "completed_follow_up", "no_show", "cancelled", "declined"] as const;
type TrialOutcomeAction = (typeof trialOutcomes)[number];

export async function updateLeadTrialOutcome(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = text(formData, "leadId", 100);
  const outcome = text(formData, "trialOutcome", 50) as TrialOutcomeAction;
  const notes = text(formData, "outcomeNotes", 2500) || null;
  const rawFollowUp = text(formData, "nextFollowUpAt", 40);
  const nextFollowUpAt = rawFollowUp ? ukLocalToIso(rawFollowUp) : null;
  if (!leadId || !trialOutcomes.includes(outcome)) return;

  const now = new Date().toISOString();
  const update: Record<string, string | number | null> = {
    trial_notes: notes,
    updated_at: now,
  };
  let activityNote = "Trial updated.";

  if (outcome === "completed_proceed") {
    update.trial_status = "completed";
    update.trial_outcome = "Proceed with tutoring";
    update.trial_completed_at = now;
    update.status = "booked";
    update.next_follow_up_at = null;
    update.follow_up_note = null;
    activityNote = "Trial completed — student is proceeding with tutoring. Lead moved to Booked.";
  } else if (outcome === "completed_follow_up") {
    update.trial_status = "completed";
    update.trial_outcome = "Follow-up required";
    update.trial_completed_at = now;
    if (nextFollowUpAt) update.next_follow_up_at = nextFollowUpAt;
    activityNote = "Trial completed — follow-up required.";
  } else if (outcome === "no_show") {
    update.trial_status = "no_show";
    update.trial_outcome = "Student did not attend";
    if (nextFollowUpAt) update.next_follow_up_at = nextFollowUpAt;
    activityNote = "Trial marked as no-show.";
  } else if (outcome === "cancelled") {
    update.trial_status = "cancelled";
    update.trial_outcome = "Trial cancelled";
    if (nextFollowUpAt) update.next_follow_up_at = nextFollowUpAt;
    activityNote = "Trial cancelled.";
  } else if (outcome === "declined") {
    update.trial_status = "completed";
    update.trial_outcome = "Not proceeding";
    update.trial_completed_at = now;
    update.status = "lost";
    update.next_follow_up_at = null;
    update.follow_up_note = null;
    activityNote = "Trial completed — student is not proceeding. Lead moved to Lost.";
  }

  const { error } = await supabase.from("tutoring_leads").update(update).eq("id", leadId);
  if (error) throw new Error(error.message);

  await activity({
    supabase,
    leadId,
    eventType: "trial_outcome",
    note: `${activityNote}${notes ? ` ${notes}` : ""}`,
    userId: session.user.id,
    userEmail: session.user.email || null,
  });
  revalidateLead(leadId);
}
