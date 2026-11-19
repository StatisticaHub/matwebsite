import { createAdminClient } from "@/lib/supabase/admin";
import { formatLondonDateTime, sendNotificationEmail, siteUrl, type NotificationEmailResult } from "@/lib/email/notifications";

export type NotificationSettings = {
  id: number;
  automation_enabled: boolean;
  session_24h_enabled: boolean;
  session_same_day_enabled: boolean;
  trial_24h_enabled: boolean;
  overdue_homework_enabled: boolean;
  tutor_missing_notes_enabled: boolean;
  overdue_followups_enabled: boolean;
  monthly_progress_enabled: boolean;
};

export type NotificationRunSummary = {
  trigger: "cron" | "manual";
  considered: number;
  sent: number;
  failed: number;
  skipped: number;
  byType: Record<string, { sent: number; failed: number; skipped: number }>;
};

type LogInput = {
  notificationType: string;
  recipientKind: "student" | "tutor" | "admin";
  recipientId?: string | null;
  recipientEmail: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  dedupeKey: string;
  subject: string;
};

function isoAddHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function londonDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function previousMonthRange(date = new Date()) {
  const london = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(london.find((p) => p.type === "year")?.value);
  const month = Number(london.find((p) => p.type === "month")?.value);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const start = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;
  const endDay = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  const end = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(endDay).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${start}T12:00:00Z`));
  return { start, end, label };
}

function londonDayOfMonth(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { day: "2-digit", timeZone: "Europe/London" }).format(date));
}

async function getSettings(): Promise<NotificationSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("notification_settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error(error?.message || "Notification settings are missing. Run the notification SQL layer first.");
  return data as NotificationSettings;
}

async function alreadySent(dedupeKey: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("notification_log").select("status").eq("dedupe_key", dedupeKey).maybeSingle();
  return data?.status === "sent" || data?.status === "skipped";
}

async function recordNotification(input: LogInput, result: NotificationEmailResult, trigger: "cron" | "manual") {
  const supabase = createAdminClient();
  const status = result.ok ? "sent" : result.skipped ? "skipped" : "failed";
  const { error } = await supabase.from("notification_log").upsert({
    notification_type: input.notificationType,
    recipient_kind: input.recipientKind,
    recipient_id: input.recipientId || null,
    recipient_email: input.recipientEmail,
    related_entity_type: input.relatedEntityType || null,
    related_entity_id: input.relatedEntityId || null,
    dedupe_key: input.dedupeKey,
    subject: input.subject,
    status,
    provider_id: result.id || null,
    error: result.error || null,
    trigger_source: trigger,
    created_at: new Date().toISOString(),
  }, { onConflict: "dedupe_key" });
  if (error) console.error("Could not record notification", error.message);
  return status as "sent" | "failed" | "skipped";
}

function bump(summary: NotificationRunSummary, type: string, status: "sent" | "failed" | "skipped") {
  summary.considered += 1;
  summary[status] += 1;
  summary.byType[type] ||= { sent: 0, failed: 0, skipped: 0 };
  summary.byType[type][status] += 1;
}

async function sendLogged(summary: NotificationRunSummary, trigger: "cron" | "manual", log: LogInput, email: () => Promise<NotificationEmailResult>) {
  if (await alreadySent(log.dedupeKey)) {
    bump(summary, log.notificationType, "skipped");
    return;
  }
  const result = await email();
  const status = await recordNotification(log, result, trigger);
  bump(summary, log.notificationType, status);
}

async function processSessionReminders(settings: NotificationSettings, summary: NotificationRunSummary, trigger: "cron" | "manual", now: Date) {
  if (!settings.session_24h_enabled && !settings.session_same_day_enabled) return;
  const supabase = createAdminClient();
  const { data: sessions, error } = await supabase
    .from("tutoring_sessions")
    .select("id, engagement_id, tutor_id, scheduled_for, duration_minutes, topic, meeting_url, status")
    .eq("status", "planned")
    .gte("scheduled_for", isoAddHours(now, 0.75))
    .lte("scheduled_for", isoAddHours(now, 26));
  if (error) throw new Error(error.message);
  if (!sessions?.length) return;
  const sessionRows = sessions as any[];

  const engagementIds = [...new Set(sessionRows.map((s) => s.engagement_id))];
  const { data: engagements } = await supabase.from("tutoring_engagements").select("id, student_id, tutor_id").in("id", engagementIds);
  const studentIds = [...new Set((engagements || []).map((e) => e.student_id))];
  const tutorIds = [...new Set(sessionRows.map((s) => s.tutor_id).filter(Boolean) as string[])];
  const [{ data: students }, { data: tutors }] = await Promise.all([
    supabase.from("students").select("id, name, email, status").in("id", studentIds),
    tutorIds.length ? supabase.from("tutors").select("id, name").in("id", tutorIds) : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);
  const engagementRows = (engagements || []) as any[];
  const studentRows = (students || []) as any[];
  const tutorRows = (tutors || []) as any[];
  const engagementMap = new Map<string, any>(engagementRows.map((e) => [e.id, e]));
  const studentMap = new Map<string, any>(studentRows.map((x) => [x.id, x]));
  const tutorMap = new Map<string, any>(tutorRows.map((x) => [x.id, x]));

  for (const session of sessionRows) {
    if (!session.scheduled_for) continue;
    const hoursAway = (new Date(session.scheduled_for).getTime() - now.getTime()) / 3_600_000;
    const engagement = engagementMap.get(session.engagement_id);
    const student = engagement ? studentMap.get(engagement.student_id) : null;
    if (!student || student.status !== "active" || !student.email) continue;
    const tutor = session.tutor_id ? tutorMap.get(session.tutor_id) : null;

    if (settings.session_24h_enabled && hoursAway >= 23 && hoursAway <= 25.5) {
      const subject = `Reminder: ${session.topic} tomorrow`;
      const key = `mat-auto/session-24h/${session.id}/${session.scheduled_for}`;
      await sendLogged(summary, trigger, {
        notificationType: "session_24h", recipientKind: "student", recipientId: student.id, recipientEmail: student.email,
        relatedEntityType: "session", relatedEntityId: session.id, dedupeKey: key, subject,
      }, () => sendNotificationEmail({
        to: student.email, subject, heading: "Your tutoring session is coming up", greetingName: student.name,
        intro: "A reminder that your My Academic Tutor session is scheduled for tomorrow.",
        details: [
          { label: "Topic", value: session.topic },
          { label: "When", value: formatLondonDateTime(session.scheduled_for) },
          { label: "Duration", value: `${session.duration_minutes} minutes` },
          { label: "Tutor", value: tutor?.name || null },
        ],
        buttonLabel: session.meeting_url ? "Join session" : undefined,
        buttonUrl: session.meeting_url || undefined,
        idempotencyKey: key,
      }));
    }

    if (settings.session_same_day_enabled && hoursAway >= 1 && hoursAway <= 3) {
      const subject = `Starting soon: ${session.topic}`;
      const key = `mat-auto/session-same-day/${session.id}/${session.scheduled_for}`;
      await sendLogged(summary, trigger, {
        notificationType: "session_same_day", recipientKind: "student", recipientId: student.id, recipientEmail: student.email,
        relatedEntityType: "session", relatedEntityId: session.id, dedupeKey: key, subject,
      }, () => sendNotificationEmail({
        to: student.email, subject, heading: "Your session starts soon", greetingName: student.name,
        intro: "Your tutoring session is coming up shortly.",
        details: [
          { label: "Topic", value: session.topic },
          { label: "When", value: formatLondonDateTime(session.scheduled_for) },
          { label: "Duration", value: `${session.duration_minutes} minutes` },
          { label: "Tutor", value: tutor?.name || null },
        ],
        buttonLabel: session.meeting_url ? "Join session" : undefined,
        buttonUrl: session.meeting_url || undefined,
        idempotencyKey: key,
      }));
    }
  }
}

async function processTrialReminders(settings: NotificationSettings, summary: NotificationRunSummary, trigger: "cron" | "manual", now: Date) {
  if (!settings.trial_24h_enabled) return;
  const supabase = createAdminClient();
  const { data: leads, error } = await supabase
    .from("tutoring_leads")
    .select("id, reference, name, email, subject, trial_scheduled_for, trial_duration_minutes, trial_meeting_url, assigned_tutor_id")
    .eq("trial_status", "scheduled")
    .gte("trial_scheduled_for", isoAddHours(now, 23))
    .lte("trial_scheduled_for", isoAddHours(now, 25.5));
  if (error) throw new Error(error.message);
  if (!leads?.length) return;
  const leadRows = leads as any[];
  const tutorIds = [...new Set(leadRows.map((x) => x.assigned_tutor_id).filter(Boolean) as string[])];
  const { data: tutors } = tutorIds.length
    ? await supabase.from("tutors").select("id, name, email, status").in("id", tutorIds)
    : { data: [] as Array<{ id: string; name: string; email: string; status: string }> };
  const tutorMap = new Map<string, any>(((tutors || []) as any[]).map((x) => [x.id, x]));

  for (const lead of leadRows) {
    if (!lead.trial_scheduled_for) continue;
    const when = formatLondonDateTime(lead.trial_scheduled_for);
    const studentSubject = `Reminder: your ${lead.subject} trial session`;
    const studentKey = `mat-auto/trial-student/${lead.id}/${lead.trial_scheduled_for}`;
    await sendLogged(summary, trigger, {
      notificationType: "trial_24h_student", recipientKind: "student", recipientEmail: lead.email,
      relatedEntityType: "lead", relatedEntityId: lead.id, dedupeKey: studentKey, subject: studentSubject,
    }, () => sendNotificationEmail({
      to: lead.email, subject: studentSubject, heading: "Your trial session is tomorrow", greetingName: lead.name,
      intro: "A quick reminder about your upcoming My Academic Tutor trial session.",
      details: [
        { label: "Subject", value: lead.subject },
        { label: "When", value: when },
        { label: "Duration", value: lead.trial_duration_minutes ? `${lead.trial_duration_minutes} minutes` : null },
      ],
      buttonLabel: lead.trial_meeting_url ? "Join trial session" : undefined,
      buttonUrl: lead.trial_meeting_url || undefined,
      idempotencyKey: studentKey,
    }));

    const tutor = lead.assigned_tutor_id ? tutorMap.get(lead.assigned_tutor_id) : null;
    if (tutor && tutor.status === "active" && tutor.email) {
      const tutorSubject = `Trial tomorrow: ${lead.name} · ${lead.subject}`;
      const tutorKey = `mat-auto/trial-tutor/${lead.id}/${lead.trial_scheduled_for}/${tutor.id}`;
      await sendLogged(summary, trigger, {
        notificationType: "trial_24h_tutor", recipientKind: "tutor", recipientId: tutor.id, recipientEmail: tutor.email,
        relatedEntityType: "lead", relatedEntityId: lead.id, dedupeKey: tutorKey, subject: tutorSubject,
      }, () => sendNotificationEmail({
        to: tutor.email, subject: tutorSubject, heading: "Trial session tomorrow", greetingName: tutor.name,
        intro: "You have an upcoming My Academic Tutor trial session.",
        details: [
          { label: "Student", value: lead.name },
          { label: "Subject", value: lead.subject },
          { label: "When", value: when },
          { label: "Reference", value: lead.reference },
        ],
        buttonLabel: lead.trial_meeting_url ? "Open meeting link" : undefined,
        buttonUrl: lead.trial_meeting_url || undefined,
        idempotencyKey: tutorKey,
      }));
    }
  }
}

async function processOverdueHomework(settings: NotificationSettings, summary: NotificationRunSummary, trigger: "cron" | "manual", now: Date) {
  if (!settings.overdue_homework_enabled) return;
  const supabase = createAdminClient();
  const today = londonDateKey(now);
  const { data: items, error } = await supabase
    .from("homework")
    .select("id, engagement_id, title, description, due_date, status")
    .eq("status", "assigned")
    .not("due_date", "is", null)
    .lt("due_date", today)
    .order("due_date", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  if (!items?.length) return;
  const homeworkRows = items as any[];
  const engagementIds = [...new Set(homeworkRows.map((x) => x.engagement_id))];
  const { data: engagements } = await supabase.from("tutoring_engagements").select("id, student_id, status").in("id", engagementIds);
  const studentIds = [...new Set((engagements || []).map((x) => x.student_id))];
  const { data: students } = await supabase.from("students").select("id, name, email, status").in("id", studentIds);
  const engagementMap = new Map<string, any>(((engagements || []) as any[]).map((x) => [x.id, x]));
  const studentMap = new Map<string, any>(((students || []) as any[]).map((x) => [x.id, x]));
  for (const item of homeworkRows) {
    const engagement = engagementMap.get(item.engagement_id);
    const student = engagement ? studentMap.get(engagement.student_id) : null;
    if (!engagement || engagement.status !== "active" || !student || student.status !== "active") continue;
    const subject = `Homework reminder: ${item.title}`;
    const key = `mat-auto/homework-overdue/${item.id}/${item.due_date}`;
    await sendLogged(summary, trigger, {
      notificationType: "homework_overdue", recipientKind: "student", recipientId: student.id, recipientEmail: student.email,
      relatedEntityType: "homework", relatedEntityId: item.id, dedupeKey: key, subject,
    }, () => sendNotificationEmail({
      to: student.email, subject, heading: "Your homework is overdue", greetingName: student.name,
      intro: "This is a one-time reminder that the following tutoring task is now past its due date.",
      details: [
        { label: "Task", value: item.title },
        { label: "Due date", value: item.due_date },
        { label: "Details", value: item.description || null },
      ],
      closing: "If you have already completed it or need help, please use your student portal or reply to this email.\n\nKind regards,\nMy Academic Tutor",
      idempotencyKey: key,
    }));
  }
}

async function processMissingTutorNotes(settings: NotificationSettings, summary: NotificationRunSummary, trigger: "cron" | "manual", now: Date) {
  if (!settings.tutor_missing_notes_enabled) return;
  const supabase = createAdminClient();
  const { data: sessions, error } = await supabase
    .from("tutoring_sessions")
    .select("id, engagement_id, tutor_id, topic, completed_at, scheduled_for, lesson_notes")
    .eq("status", "completed")
    .not("tutor_id", "is", null)
    .is("lesson_notes", null)
    .gte("completed_at", isoAddHours(now, -168))
    .lte("completed_at", isoAddHours(now, -3));
  if (error) throw new Error(error.message);
  if (!sessions?.length) return;
  const completedRows = sessions as any[];
  const tutorIds = [...new Set(completedRows.map((x) => x.tutor_id).filter(Boolean) as string[])];
  const engagementIds = [...new Set(completedRows.map((x) => x.engagement_id))];
  const [{ data: tutors }, { data: engagements }] = await Promise.all([
    supabase.from("tutors").select("id, name, email, status, portal_enabled").in("id", tutorIds),
    supabase.from("tutoring_engagements").select("id, student_id").in("id", engagementIds),
  ]);
  const studentIds = [...new Set((engagements || []).map((x) => x.student_id))];
  const { data: students } = studentIds.length ? await supabase.from("students").select("id, name").in("id", studentIds) : { data: [] as Array<{ id: string; name: string }> };
  const tutorMap = new Map<string, any>(((tutors || []) as any[]).map((x) => [x.id, x]));
  const engagementMap = new Map<string, any>(((engagements || []) as any[]).map((x) => [x.id, x]));
  const studentMap = new Map<string, any>(((students || []) as any[]).map((x) => [x.id, x]));
  for (const session of completedRows) {
    const tutor = session.tutor_id ? tutorMap.get(session.tutor_id) : null;
    if (!tutor || tutor.status !== "active" || !tutor.email) continue;
    const engagement = engagementMap.get(session.engagement_id);
    const student = engagement ? studentMap.get(engagement.student_id) : null;
    const subject = `Lesson notes needed: ${student?.name || session.topic}`;
    const key = `mat-auto/missing-notes/${session.id}`;
    await sendLogged(summary, trigger, {
      notificationType: "tutor_missing_notes", recipientKind: "tutor", recipientId: tutor.id, recipientEmail: tutor.email,
      relatedEntityType: "session", relatedEntityId: session.id, dedupeKey: key, subject,
    }, () => sendNotificationEmail({
      to: tutor.email, subject, heading: "Please complete the lesson record", greetingName: tutor.name,
      intro: "A completed tutoring session is still missing lesson notes. Please update the record while the session is fresh.",
      details: [
        { label: "Student", value: student?.name || null },
        { label: "Topic", value: session.topic },
        { label: "Session", value: session.completed_at ? formatLondonDateTime(session.completed_at) : session.scheduled_for ? formatLondonDateTime(session.scheduled_for) : null },
      ],
      buttonLabel: tutor.portal_enabled ? "Open tutor portal" : undefined,
      buttonUrl: tutor.portal_enabled ? `${siteUrl()}/tutor/sessions/${session.id}` : undefined,
      idempotencyKey: key,
    }));
  }
}

async function processOverdueFollowups(settings: NotificationSettings, summary: NotificationRunSummary, trigger: "cron" | "manual", now: Date) {
  if (!settings.overdue_followups_enabled) return;
  const adminEmail = process.env.MAT_LEADS_TO_EMAIL?.trim() || process.env.MAT_REPLY_TO_EMAIL?.trim();
  if (!adminEmail) return;
  const supabase = createAdminClient();
  const { data: leads, error } = await supabase
    .from("tutoring_leads")
    .select("id, reference, name, subject, next_follow_up_at, status")
    .not("next_follow_up_at", "is", null)
    .lt("next_follow_up_at", now.toISOString())
    .not("status", "in", '(closed,lost)')
    .order("next_follow_up_at", { ascending: true })
    .limit(50);
  if (error) throw new Error(error.message);
  if (!leads?.length) return;
  const overdueRows = leads as any[];
  const dateKey = londonDateKey(now);
  const subject = `${overdueRows.length} lead follow-up${overdueRows.length === 1 ? "" : "s"} overdue`;
  const key = `mat-auto/admin-overdue-followups/${dateKey}`;
  const detail = overdueRows.slice(0, 12).map((x: any) => `${x.reference} · ${x.name} · ${x.subject} · due ${formatLondonDateTime(x.next_follow_up_at)}`).join("\n");
  await sendLogged(summary, trigger, {
    notificationType: "admin_overdue_followups", recipientKind: "admin", recipientEmail: adminEmail,
    relatedEntityType: "lead", dedupeKey: key, subject,
  }, () => sendNotificationEmail({
    to: adminEmail, subject, heading: "Follow-ups need attention",
    intro: `${overdueRows.length} lead follow-up${overdueRows.length === 1 ? " is" : "s are"} currently overdue.`,
    details: [{ label: "Oldest items", value: detail }],
    buttonLabel: "Open follow-up queue", buttonUrl: `${siteUrl()}/admin/follow-ups`,
    idempotencyKey: key,
  }));
}

async function processMonthlyProgress(settings: NotificationSettings, summary: NotificationRunSummary, trigger: "cron" | "manual", now: Date) {
  if (!settings.monthly_progress_enabled || londonDayOfMonth(now) < 2) return;
  const supabase = createAdminClient();
  const period = previousMonthRange(now);
  const { data: engagements, error } = await supabase.from("tutoring_engagements").select("id, student_id, tutor_id, subject, title, status").eq("status", "active");
  if (error) throw new Error(error.message);
  if (!engagements?.length) return;
  const engagementRows = engagements as any[];
  const { data: reports } = await supabase.from("progress_reports").select("engagement_id").gte("period_start", period.start).lte("period_end", period.end);
  const reported = new Set(((reports || []) as any[]).map((x: any) => x.engagement_id));
  const missing = engagementRows.filter((x: any) => !reported.has(x.id));
  if (!missing.length) return;
  const tutorIds = [...new Set(missing.map((x) => x.tutor_id).filter(Boolean) as string[])];
  const studentIds = [...new Set(missing.map((x) => x.student_id))];
  const [{ data: tutors }, { data: students }] = await Promise.all([
    tutorIds.length ? supabase.from("tutors").select("id, name, email, status, portal_enabled").in("id", tutorIds) : Promise.resolve({ data: [] as Array<{ id: string; name: string; email: string; status: string; portal_enabled: boolean }> }),
    supabase.from("students").select("id, name").in("id", studentIds),
  ]);
  const tutorMap = new Map<string, any>(((tutors || []) as any[]).map((x: any) => [x.id, x]));
  const studentMap = new Map<string, any>(((students || []) as any[]).map((x: any) => [x.id, x]));
  const adminEmail = process.env.MAT_LEADS_TO_EMAIL?.trim() || process.env.MAT_REPLY_TO_EMAIL?.trim();

  for (const engagement of missing) {
    const tutor = engagement.tutor_id ? tutorMap.get(engagement.tutor_id) : null;
    const student = studentMap.get(engagement.student_id);
    const recipientEmail = tutor?.status === "active" && tutor.email ? tutor.email : adminEmail;
    if (!recipientEmail) continue;
    const recipientKind = tutor?.status === "active" && tutor.email ? "tutor" as const : "admin" as const;
    const subject = `Progress report due: ${student?.name || engagement.subject} · ${period.label}`;
    const key = `mat-auto/progress-due/${engagement.id}/${period.start}/${period.end}/${recipientKind}`;
    await sendLogged(summary, trigger, {
      notificationType: "monthly_progress_due", recipientKind, recipientId: recipientKind === "tutor" ? tutor?.id : null, recipientEmail,
      relatedEntityType: "engagement", relatedEntityId: engagement.id, dedupeKey: key, subject,
    }, () => sendNotificationEmail({
      to: recipientEmail, subject, heading: "Monthly progress report due", greetingName: recipientKind === "tutor" ? tutor?.name : null,
      intro: `The ${period.label} progress report has not yet been generated for this active student.`,
      details: [
        { label: "Student", value: student?.name || null },
        { label: "Subject", value: engagement.subject },
        { label: "Engagement", value: engagement.title },
      ],
      buttonLabel: recipientKind === "tutor" && tutor?.portal_enabled ? "Open progress workspace" : "Open admin progress",
      buttonUrl: recipientKind === "tutor" && tutor?.portal_enabled ? `${siteUrl()}/tutor/progress/${engagement.id}` : `${siteUrl()}/admin/progress/${engagement.id}`,
      idempotencyKey: key,
    }));
  }
}

export async function runNotificationEngine(trigger: "cron" | "manual" = "cron"): Promise<NotificationRunSummary> {
  const settings = await getSettings();
  const summary: NotificationRunSummary = { trigger, considered: 0, sent: 0, failed: 0, skipped: 0, byType: {} };
  if (!settings.automation_enabled && trigger === "cron") return summary;
  const now = new Date();
  await processSessionReminders(settings, summary, trigger, now);
  await processTrialReminders(settings, summary, trigger, now);
  await processOverdueHomework(settings, summary, trigger, now);
  await processMissingTutorNotes(settings, summary, trigger, now);
  await processOverdueFollowups(settings, summary, trigger, now);
  await processMonthlyProgress(settings, summary, trigger, now);
  return summary;
}
