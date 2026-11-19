import { createAdminClient } from "@/lib/supabase/admin";
import { sendLeadNurtureEmail, type NurtureEmailResult } from "@/lib/email/nurture";

type Trigger = "cron" | "manual";
type SequenceKey = "service_checkin_day1" | "education_day3" | "education_day7" | "final_checkin_day14";

type NurtureSettings = {
  automation_enabled: boolean;
  service_checkin_enabled: boolean;
  educational_day3_enabled: boolean;
  educational_day7_enabled: boolean;
  final_day14_enabled: boolean;
};

type LeadRow = {
  id: string;
  reference: string;
  created_at: string;
  nurture_started_at: string | null;
  nurture_paused: boolean;
  marketing_email_consent: boolean;
  marketing_email_unsubscribed_at: string | null;
  email_preference_token: string;
  name: string;
  email: string;
  subject: string;
  level: string;
  support_type: string;
  topic: string | null;
  status: string;
  trial_status: string | null;
  last_contacted_at: string | null;
};

export type LeadNurtureSummary = {
  sent: number;
  failed: number;
  skipped: number;
  checked: number;
};

const ACTIVE_STATUSES = new Set(["new", "contacted", "matching", "tutor_assigned"]);

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.myacademictutor.com").replace(/\/$/, "");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function ageDays(start: string, now: Date) {
  return (now.getTime() - new Date(start).getTime()) / 86_400_000;
}

function preferenceUrl(lead: LeadRow) {
  return `${siteUrl()}/email-preferences/${encodeURIComponent(lead.email_preference_token)}`;
}

function resourceForSubject(subject: string) {
  const normalized = subject.toLowerCase();
  if (normalized.includes("medical") || normalized.includes("biostat")) return { label: "Explore medical statistics guides", href: "/learn/medical-statistics" };
  if (normalized.includes("econom")) return { label: "Explore econometrics guides", href: "/learn/econometrics" };
  if (normalized.includes("spss")) return { label: "Explore SPSS guides", href: "/learn/spss" };
  if (normalized === "r" || normalized.includes("r programming") || normalized.includes("statistical programming")) return { label: "Explore R guides", href: "/learn/r-programming" };
  if (normalized.includes("data science") || normalized.includes("python") || normalized.includes("machine learning")) return { label: "Explore data science guides", href: "/learn/data-science" };
  if (normalized.includes("bioinform") || normalized.includes("genomic")) return { label: "Explore bioinformatics guides", href: "/learn/bioinformatics" };
  if (normalized.includes("research") || normalized.includes("dissertation")) return { label: "Explore research-methods guides", href: "/learn/research-methods" };
  if (normalized.includes("math")) return { label: "Explore mathematics guides", href: "/learn/mathematics" };
  if (normalized.includes("stat")) return { label: "Explore statistics guides", href: "/learn/statistics" };
  return { label: "Explore the Learning Hub", href: "/learn" };
}

function withUtm(path: string, campaign: SequenceKey) {
  const separator = path.includes("?") ? "&" : "?";
  return `${siteUrl()}${path}${separator}utm_source=lead_nurture&utm_medium=email&utm_campaign=${campaign}`;
}

async function alreadyHandled(dedupeKey: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("lead_nurture_log").select("status").eq("dedupe_key", dedupeKey).maybeSingle();
  return data?.status === "sent" || data?.status === "skipped";
}

async function logResult(
  lead: LeadRow,
  sequenceKey: SequenceKey,
  subject: string,
  dedupeKey: string,
  trigger: Trigger,
  result: NurtureEmailResult,
) {
  const supabase = createAdminClient();
  const status = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
  await supabase.from("lead_nurture_log").upsert({
    lead_id: lead.id,
    sequence_key: sequenceKey,
    recipient_email: lead.email,
    subject,
    status,
    provider_id: result.id || null,
    error: result.error || null,
    trigger_source: trigger,
    dedupe_key: dedupeKey,
    created_at: new Date().toISOString(),
  }, { onConflict: "dedupe_key" });
  return status;
}

async function sendOne(
  summary: LeadNurtureSummary,
  trigger: Trigger,
  lead: LeadRow,
  sequenceKey: SequenceKey,
  subject: string,
  input: Omit<Parameters<typeof sendLeadNurtureEmail>[0], "to" | "subject" | "greetingName" | "preferenceUrl" | "idempotencyKey">,
) {
  const dedupeKey = `mat-nurture/${sequenceKey}/${lead.id}`;
  if (await alreadyHandled(dedupeKey)) {
    summary.skipped += 1;
    return;
  }

  const result = await sendLeadNurtureEmail({
    to: lead.email,
    subject,
    greetingName: firstName(lead.name),
    preferenceUrl: preferenceUrl(lead),
    idempotencyKey: dedupeKey,
    ...input,
  });
  const status = await logResult(lead, sequenceKey, subject, dedupeKey, trigger, result);
  if (status === "sent") summary.sent += 1;
  else if (status === "failed") summary.failed += 1;
  else summary.skipped += 1;
}

function eligibleBase(lead: LeadRow) {
  return Boolean(
    lead.nurture_started_at &&
    !lead.nurture_paused &&
    ACTIVE_STATUSES.has(lead.status) &&
    lead.trial_status !== "scheduled" &&
    lead.trial_status !== "completed"
  );
}

export async function runLeadNurtureEngine(trigger: Trigger = "cron"): Promise<LeadNurtureSummary> {
  const summary: LeadNurtureSummary = { sent: 0, failed: 0, skipped: 0, checked: 0 };
  const supabase = createAdminClient();

  const [{ data: settings, error: settingsError }, { data: leads, error: leadsError }, { data: recentLogs }] = await Promise.all([
    supabase.from("lead_nurture_settings").select("*").eq("id", 1).single(),
    supabase.from("tutoring_leads")
      .select("id,reference,created_at,nurture_started_at,nurture_paused,marketing_email_consent,marketing_email_unsubscribed_at,email_preference_token,name,email,subject,level,support_type,topic,status,trial_status,last_contacted_at")
      .not("nurture_started_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase.from("lead_nurture_log").select("lead_id,created_at,status").eq("status", "sent").order("created_at", { ascending: false }).limit(1000),
  ]);

  if (settingsError) throw new Error(settingsError.message);
  if (leadsError) throw new Error(leadsError.message);

  const cfg = settings as NurtureSettings;
  if (trigger === "cron" && !cfg.automation_enabled) return summary;

  const now = new Date();
  const latestSentByLead = new Map<string, number>();
  for (const log of (recentLogs || []) as Array<{ lead_id: string; created_at: string }>) {
    if (!latestSentByLead.has(log.lead_id)) latestSentByLead.set(log.lead_id, new Date(log.created_at).getTime());
  }

  for (const lead of (leads || []) as LeadRow[]) {
    summary.checked += 1;
    if (!eligibleBase(lead)) continue;

    const lastAutomatedSend = latestSentByLead.get(lead.id);
    if (lastAutomatedSend && now.getTime() - lastAutomatedSend < 20 * 3_600_000) continue;
    if (lead.last_contacted_at && now.getTime() - new Date(lead.last_contacted_at).getTime() < 20 * 3_600_000) continue;

    const age = ageDays(lead.nurture_started_at || lead.created_at, now);
    const resource = resourceForSubject(lead.subject);

    if (cfg.service_checkin_enabled && !lead.last_contacted_at && age >= 1 && age <= 7) {
      await sendOne(summary, trigger, lead, "service_checkin_day1", `Checking in about your ${lead.subject} tutoring request`, {
        heading: "A quick check-in on your tutoring request",
        intro: `We’re following up on the ${lead.subject} tutoring request you sent us.`,
        body: [
          `If you still need support with ${lead.topic || lead.subject}, reply to this email with any timing or topic updates and we can continue arranging suitable one-to-one help.`,
          "If your plans have changed, there is nothing you need to do.",
        ],
        buttonLabel: "View tutoring options",
        buttonUrl: withUtm("/find-a-tutor", "service_checkin_day1"),
      });
      continue;
    }

    const optedIn = lead.marketing_email_consent && !lead.marketing_email_unsubscribed_at;
    if (!optedIn) continue;

    if (cfg.educational_day3_enabled && age >= 3 && age <= 14) {
      await sendOne(summary, trigger, lead, "education_day3", `A useful ${lead.subject} resource for your studies`, {
        heading: `A useful starting point for ${lead.subject}`,
        intro: "Because you asked to receive educational emails related to your tutoring request, here is a focused resource you can use before your next study session.",
        body: [
          "The Learning Hub is designed to explain methods clearly first, then connect them to worked examples and one-to-one support when you need it.",
          "Use the guide to identify the exact step or concept that is blocking you; that makes a future tutoring session much more focused.",
        ],
        buttonLabel: resource.label,
        buttonUrl: withUtm(resource.href, "education_day3"),
      });
      continue;
    }

    if (cfg.educational_day7_enabled && age >= 7 && age <= 21) {
      await sendOne(summary, trigger, lead, "education_day7", "How to make a tutoring session more useful", {
        heading: "Prepare for tutoring in 10 minutes",
        intro: "A little preparation can make one-to-one tutoring much more efficient.",
        body: [
          "Before a session, write down one specific outcome you want, one example you cannot complete, and the exact point where your reasoning becomes uncertain.",
          "Bring your course terminology, assignment brief or lecture method with you. The goal is to build your understanding around the way your course is actually taught—not replace your own academic work.",
        ],
        buttonLabel: "See how tutoring works",
        buttonUrl: withUtm("/how-it-works", "education_day7"),
      });
      continue;
    }

    if (cfg.final_day14_enabled && age >= 14 && age <= 35) {
      await sendOne(summary, trigger, lead, "final_checkin_day14", `Still need help with ${lead.subject}?`, {
        heading: "Still working on the same study challenge?",
        intro: `We’re closing the automated follow-up loop on your ${lead.subject} enquiry.`,
        body: [
          "If you still want one-to-one support, reply with your current topic and availability and the team can pick the conversation back up.",
          "If you no longer need tutoring, you can simply ignore this message or use the preference link below to stop educational follow-ups.",
        ],
        buttonLabel: "Request tutoring",
        buttonUrl: withUtm("/find-a-tutor", "final_checkin_day14"),
      });
    }
  }

  return summary;
}
