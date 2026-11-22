"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionStatuses, type SessionStatus } from "@/lib/delivery-data";

import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "@/lib/time-zone";
function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}
function nullableText(formData: FormData, key: string, max = 5000) {
  const value = text(formData, key, max);
  return value || null;
}
function nullableNumber(formData: FormData, key: string) {
  const raw = text(formData, key, 50);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
function safeUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch { return null; }
}
async function tutorContext() {
  const session = await getTutorSession();
  if (!session) redirect("/tutor/login?unauthorized=1");
  return { session, supabase: createAdminClient() };
}

export async function updateTutorAvailabilityFromPortal(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const availabilityDays = formData.getAll("availabilityDays").map(String).filter(Boolean);
  const availabilityPeriods = formData.getAll("availabilityPeriods").map(String).filter(Boolean);
  const capacity = nullableNumber(formData, "weeklyCapacityHours");
  const maxStudents = nullableNumber(formData, "maxActiveStudents");
  const timezone =
    normalizeTimeZone(
      text(
        formData,
        "timezone",
        120,
      ),
      DEFAULT_TIME_ZONE,
    );

  const { error } = await supabase.from("tutors").update({
    timezone,
    availability_notes: nullableText(formData, "availabilityNotes", 2000),
    availability_days: availabilityDays,
    availability_periods: availabilityPeriods,
    weekly_capacity_hours: capacity !== null ? Math.max(0, Math.min(80, capacity)) : null,
    max_active_students: maxStudents !== null ? Math.max(0, Math.min(100, Math.round(maxStudents))) : null,
    accepts_trials: formData.get("acceptsTrials") === "yes",
    updated_at: new Date().toISOString(),
  }).eq("id", session.tutor.id);
  if (error) throw new Error(error.message);
  revalidatePath("/tutor");
  revalidatePath("/tutor/availability");
  redirect("/tutor/availability?saved=1");
}

export async function updateTutorSessionRecord(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const sessionId = text(formData, "sessionId", 100);
  const status = text(formData, "status", 30) as SessionStatus;
  if (!sessionId || !sessionStatuses.includes(status)) return;

  const { data: row, error: rowError } = await supabase
    .from("tutoring_sessions")
    .select("id,tutor_id,completed_at,engagement_id,tutoring_engagements(tutor_id)")
    .eq("id", sessionId)
    .single();
  if (rowError || !row) throw new Error(rowError?.message || "Session not found.");
  const engagement = row.tutoring_engagements as unknown as { tutor_id: string | null } | null;
  if (row.tutor_id !== session.tutor.id && engagement?.tutor_id !== session.tutor.id) throw new Error("You do not have access to this session.");

  const rating = nullableNumber(formData, "understandingRating");
  const meetingUrl = safeUrl(nullableText(formData, "meetingUrl", 1000));
  const completedAt = status === "completed" ? (row.completed_at || new Date().toISOString()) : null;
  const { error } = await supabase.from("tutoring_sessions").update({
    status,
    completed_at: completedAt,
    lesson_notes: nullableText(formData, "lessonNotes", 8000),
    understanding_rating: rating !== null && rating >= 1 && rating <= 5 ? Math.round(rating) : null,
    next_topic: nullableText(formData, "nextTopic", 1000),
    homework_summary: nullableText(formData, "homeworkSummary", 3000),
    meeting_url: meetingUrl,
    updated_at: new Date().toISOString(),
  }).eq("id", sessionId);
  if (error) throw new Error(error.message);

  revalidatePath("/tutor");
  revalidatePath("/tutor/sessions");
  revalidatePath(`/tutor/sessions/${sessionId}`);
  redirect(`/tutor/sessions/${sessionId}?saved=1`);
}

export async function updateTutorTrialRecord(formData: FormData) {
  const { session, supabase } = await tutorContext();
  const leadId = text(formData, "leadId", 100);
  const status = text(formData, "trialStatus", 30);
  if (!leadId || !["scheduled", "completed", "cancelled", "no_show"].includes(status)) return;

  const { data: lead, error: leadError } = await supabase
    .from("tutoring_leads")
    .select("id,assigned_tutor_id")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) throw new Error(leadError?.message || "Trial not found.");
  if (lead.assigned_tutor_id !== session.tutor.id) throw new Error("You do not have access to this trial.");

  const { error } = await supabase.from("tutoring_leads").update({
    trial_status: status,
    trial_completed_at: ["completed", "no_show"].includes(status) ? new Date().toISOString() : null,
    trial_tutor_feedback: nullableText(formData, "trialTutorFeedback", 5000),
    updated_at: new Date().toISOString(),
  }).eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/tutor");
  revalidatePath("/tutor/trials");
  redirect("/tutor/trials?saved=1");
}

export async function assignTutorHomework(
  formData: FormData
) {
  const { session, supabase } = await tutorContext();
  const sessionId = text(formData, "sessionId", 100);
  const title = text(formData, "title", 500);
  const description = nullableText(formData, "description", 8000);
  const rawDueDate = text(formData, "dueDate", 20);
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDueDate)
    ? rawDueDate
    : null;

  if (!sessionId || !title) return;

  const { data: row, error: rowError } = await supabase
    .from("tutoring_sessions")
    .select("id,tutor_id,engagement_id,tutoring_engagements(tutor_id)")
    .eq("id", sessionId)
    .single();

  if (rowError || !row) {
    throw new Error(rowError?.message || "Session not found.");
  }

  const engagement = row.tutoring_engagements as unknown as
    | { tutor_id: string | null }
    | null;

  if (
    row.tutor_id !== session.tutor.id &&
    engagement?.tutor_id !== session.tutor.id
  ) {
    throw new Error("You do not have access to this session.");
  }

  const { data: existing } = await supabase
    .from("homework")
    .select("id")
    .eq("engagement_id", row.engagement_id)
    .eq("source_session_id", sessionId)
    .maybeSingle();

  const payload = {
    engagement_id: row.engagement_id,
    session_id: sessionId,
    source_session_id: sessionId,
    title,
    description,
    due_date: dueDate,
    status: "assigned",
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("homework")
      .update(payload)
      .eq("id", existing.id);

    if (error) throw new Error(error.message || "Could not update homework.");
  } else {
    const { error } = await supabase
      .from("homework")
      .insert(payload);

    if (error) throw new Error(error.message || "Could not assign homework.");
  }

  revalidatePath(`/tutor/sessions/${sessionId}`);
  revalidatePath("/tutor/sessions");
}
