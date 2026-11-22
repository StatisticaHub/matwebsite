import { Resend } from "resend";

export type StudentEmailResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
};

type StudentRecipient = {
  name: string;
  email: string;
};

type IntakeInvitation = StudentRecipient & {
  linkId: string;
  intakeUrl: string;
  expiresAt: string | null;
};

type PortalInvitation = StudentRecipient & {
  linkId: string;
  portalUrl: string;
  expiresAt: string | null;
};

type SessionNotification = StudentRecipient & {
  sessionId: string;
  topic: string;
  status: string;
  scheduledFor: string | null;
  durationMinutes: number;
  nextTopic?: string | null;
  homeworkSummary?: string | null;
  meetingUrl?: string | null;
};

type HomeworkNotification = StudentRecipient & {
  homeworkId: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status?: string | null;
  feedback?: string | null;
};

function configured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAT_EMAIL_FROM?.trim());
}

function client() {
  return new Resend(process.env.RESEND_API_KEY);
}

function replyTo() {
  return process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim() || undefined;
}

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

function safeEmailTimeZone(value?: string | null) {
  const candidate = String(value || "").trim();

  if (!candidate) return "Europe/London";

  try {
    new Intl.DateTimeFormat("en-GB", {
      timeZone: candidate,
    }).format(new Date());

    return candidate;
  } catch {
    return "Europe/London";
  }
}

function prettyDate(
  value: string | null | undefined,
  includeTime = false,
  timeZone?: string | null,
) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const safeTimeZone = safeEmailTimeZone(timeZone);

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    ...(includeTime
      ? {
          timeStyle: "short",
          timeZone: safeTimeZone,
        }
      : {}),
  }).format(date);
}

function styles() {
  return `
    body{margin:0;background:#f4f7fb;color:#10233f;font-family:Arial,Helvetica,sans-serif}
    .wrap{max-width:680px;margin:0 auto;padding:32px 18px}.card{background:#fff;border:1px solid #dce4ee;border-radius:12px;overflow:hidden}
    .top{padding:24px 28px;background:#0b1f3a;color:#fff}.top strong{font-size:18px}.body{padding:28px}
    h1{font-size:26px;line-height:1.25;margin:4px 0 12px;color:#0b1f3a}p{font-size:15px;line-height:1.65;margin:0 0 16px;color:#4d5c70}
    .button{display:inline-block;margin:8px 0 20px;padding:12px 18px;border-radius:8px;background:#1f5bd8;color:#fff!important;text-decoration:none;font-weight:700}
    .box{margin:20px 0;padding:16px 18px;border-left:3px solid #1f5bd8;background:#f7f9fc;color:#27384f;font-size:14px;line-height:1.65}
    .footer{padding:20px 28px;background:#f7f9fc;color:#748095;font-size:12px;line-height:1.55}a{color:#1f5bd8}
  `;
}

async function deliver(args: { to: string; subject: string; html: string; text: string; idempotencyKey: string }): Promise<StudentEmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };
  try {
    const { data, error } = await client().emails.send(
      {
        from: process.env.MAT_EMAIL_FROM!,
        to: [args.to],
        replyTo: replyTo(),
        subject: args.subject,
        html: args.html,
        text: args.text,
      },
      { idempotencyKey: args.idempotencyKey },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Resend error" };
  }
}

export function intakeInvitationDraft(input: Omit<IntakeInvitation, "linkId">) {
  const name = firstName(input.name);
  const expiry = prettyDate(input.expiresAt);
  const subject = "Welcome to My Academic Tutor — complete your learning intake";
  const text = `Hi ${name},\n\nWelcome to My Academic Tutor. Before we begin tutoring, please complete your short learning intake using the secure link below:\n\n${input.intakeUrl}\n\nThis gives us the essentials: your level, what you want help with, your timezone and your usual availability.${expiry ? `\n\nThe secure link is available until ${expiry}.` : ""}\n\nIf you have any questions, simply reply to this email.\n\nKind regards,\nMy Academic Tutor`;
  return { subject, text };
}

export async function sendStudentIntakeInvitation(input: IntakeInvitation): Promise<StudentEmailResult> {
  const draft = intakeInvitationDraft(input);
  const name = firstName(input.name);
  const expiry = prettyDate(input.expiresAt);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Your learning intake</div></div><div class="body"><h1>Welcome, ${escapeHtml(name)}.</h1><p>Before tutoring begins, please complete your short learning intake. It gives us the essentials: your level, what you want help with, your timezone and your usual availability.</p><a class="button" href="${escapeHtml(input.intakeUrl)}">Complete my learning intake</a>${expiry ? `<div class="box">This secure link is available until <strong>${escapeHtml(expiry)}</strong>.</div>` : ""}<p>If you have any questions, simply reply to this email.</p><p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">One-to-one online tutoring from school to postgraduate and research-level study.</div></div></div></body></html>`;
  return deliver({ to: input.email, subject: draft.subject, html, text: draft.text, idempotencyKey: `mat-intake/${input.linkId}` });
}

export function portalInvitationDraft(input: Omit<PortalInvitation, "linkId">) {
  const name = firstName(input.name);
  const expiry = prettyDate(input.expiresAt);
  const subject = "Your My Academic Tutor learning portal";
  const text = `Hi ${name},\n\nYour My Academic Tutor learning portal is ready. Use the secure link below to view your learning plan, sessions, homework, feedback and shared resources:\n\n${input.portalUrl}${expiry ? `\n\nThe secure link is available until ${expiry}.` : ""}\n\nPlease keep this link private. If you need help accessing the portal, reply to this email.\n\nKind regards,\nMy Academic Tutor`;
  return { subject, text };
}

export async function sendStudentPortalInvitation(input: PortalInvitation): Promise<StudentEmailResult> {
  const draft = portalInvitationDraft(input);
  const name = firstName(input.name);
  const expiry = prettyDate(input.expiresAt);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Student learning portal</div></div><div class="body"><h1>Your portal is ready, ${escapeHtml(name)}.</h1><p>Use your secure learning portal to view your current learning plan, session record, homework, tutor feedback and shared resources.</p><a class="button" href="${escapeHtml(input.portalUrl)}">Open my learning portal</a>${expiry ? `<div class="box">This secure link is available until <strong>${escapeHtml(expiry)}</strong>. Please keep it private.</div>` : ""}<p>If you need help accessing the portal, reply to this email.</p><p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">Your portal link gives access to your learning record. Do not forward it to other people.</div></div></div></body></html>`;
  return deliver({ to: input.email, subject: draft.subject, html, text: draft.text, idempotencyKey: `mat-portal/${input.linkId}` });
}

export async function sendSessionNotification(
  input: SessionNotification & {
    timeZone?: string | null;
  },
): Promise<StudentEmailResult> {
  const name = firstName(input.name);
  const timeZone = safeEmailTimeZone(input.timeZone);
  const scheduled = prettyDate(
    input.scheduledFor,
    true,
    timeZone,
  );
  const scheduledWithZone =
    scheduled
      ? `${scheduled} (${timeZone})`
      : null;
  const completed = input.status === "completed";
  const cancelled = input.status === "cancelled";
  const subject = cancelled ? `Session update: ${input.topic}` : completed ? `Session follow-up: ${input.topic}` : `Tutoring session scheduled: ${input.topic}`;
  const statusLine = cancelled
    ? `Your tutoring session for ${input.topic} has been marked as cancelled.`
    : completed
      ? `Your tutoring session on ${input.topic} has been recorded as completed.`
      : `Your tutoring session on ${input.topic} has been scheduled${scheduledWithZone ? ` for ${scheduledWithZone}` : ""}.`;
  const next = input.nextTopic ? `\nNext topic: ${input.nextTopic}` : "";
  const homework = input.homeworkSummary ? `\nPractice / homework: ${input.homeworkSummary}` : "";
  const meeting = input.meetingUrl ? `\nJoin link: ${input.meetingUrl}` : "";
  const text = `Hi ${name},\n\n${statusLine}\n\nDuration: ${input.durationMinutes} minutes${next}${homework}${meeting}\n\nIf anything needs changing, reply to this email.\n\nKind regards,\nMy Academic Tutor`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Tutoring session update</div></div><div class="body"><h1>${escapeHtml(input.topic)}</h1><p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(statusLine)}</p><div class="box"><strong>Duration:</strong> ${input.durationMinutes} minutes${input.nextTopic ? `<br><strong>Next topic:</strong> ${escapeHtml(input.nextTopic)}` : ""}${input.homeworkSummary ? `<br><strong>Practice / homework:</strong> ${escapeHtml(input.homeworkSummary)}` : ""}</div>${input.meetingUrl ? `<a class="button" href="${escapeHtml(input.meetingUrl)}">Join session</a>` : ""}<p>If anything needs changing, reply to this email.</p><p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">This message relates to your tutoring delivery record.</div></div></div></body></html>`;
  return deliver({ to: input.email, subject, html, text, idempotencyKey: `mat-session/${input.sessionId}/${input.status}` });
}

export async function sendHomeworkNotification(input: HomeworkNotification): Promise<StudentEmailResult> {
  const name = firstName(input.name);
  const due = prettyDate(input.dueDate);
  const isFeedback = Boolean(input.feedback) || (input.status && input.status !== "assigned");
  const subject = isFeedback ? `Homework update: ${input.title}` : `New homework: ${input.title}`;
  const opening = isFeedback ? `There is an update to your homework “${input.title}”.` : `New homework has been assigned: “${input.title}”.`;
  const text = `Hi ${name},\n\n${opening}${input.description ? `\n\nTask: ${input.description}` : ""}${due ? `\nDue: ${due}` : ""}${input.status ? `\nStatus: ${input.status.replaceAll("_", " ")}` : ""}${input.feedback ? `\n\nTutor feedback:\n${input.feedback}` : ""}\n\nKind regards,\nMy Academic Tutor`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Homework & practice</div></div><div class="body"><h1>${escapeHtml(input.title)}</h1><p>Hi ${escapeHtml(name)},</p><p>${escapeHtml(opening)}</p><div class="box">${input.description ? `<strong>Task:</strong> ${escapeHtml(input.description)}<br>` : ""}${due ? `<strong>Due:</strong> ${escapeHtml(due)}<br>` : ""}${input.status ? `<strong>Status:</strong> ${escapeHtml(input.status.replaceAll("_", " "))}` : ""}</div>${input.feedback ? `<p><strong>Tutor feedback</strong></p><div class="box">${escapeHtml(input.feedback).replaceAll("\n", "<br>")}</div>` : ""}<p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">This message relates to your tutoring delivery record.</div></div></div></body></html>`;
  return deliver({ to: input.email, subject, html, text, idempotencyKey: `mat-homework/${input.homeworkId}/${input.status || "assigned"}/${input.feedback ? "feedback" : "notice"}` });
}

export async function sendSessionReminder(input: StudentRecipient & {
  sessionId: string;
  topic: string;
  scheduledFor: string;
  durationMinutes: number;
  tutorName?: string | null;
  meetingUrl?: string | null;
  timeZone?: string | null;
}): Promise<StudentEmailResult> {
  const name = firstName(input.name);
  const timeZone = safeEmailTimeZone(input.timeZone);
  const scheduled =
    prettyDate(
      input.scheduledFor,
      true,
      timeZone,
    ) || input.scheduledFor;
  const scheduledWithZone =
    `${scheduled} (${timeZone})`;
  const subject = `Reminder: ${input.topic}`;
  const tutorLine = input.tutorName ? `\nTutor: ${input.tutorName}` : "";
  const meetingLine = input.meetingUrl ? `\nJoin link: ${input.meetingUrl}` : "";
  const text = `Hi ${name},\n\nA quick reminder about your upcoming My Academic Tutor session.\n\nTopic: ${input.topic}\nWhen: ${scheduledWithZone}\nDuration: ${input.durationMinutes} minutes${tutorLine}${meetingLine}\n\nIf anything needs changing, reply to this email.\n\nKind regards,\nMy Academic Tutor`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Session reminder</div></div><div class="body"><h1>${escapeHtml(input.topic)}</h1><p>Hi ${escapeHtml(name)},</p><p>A quick reminder about your upcoming tutoring session.</p><div class="box"><strong>When:</strong> ${escapeHtml(scheduledWithZone)}<br><strong>Duration:</strong> ${input.durationMinutes} minutes${input.tutorName ? `<br><strong>Tutor:</strong> ${escapeHtml(input.tutorName)}` : ""}</div>${input.meetingUrl ? `<a class="button" href="${escapeHtml(input.meetingUrl)}">Join session</a>` : ""}<p>If anything needs changing, reply to this email.</p><p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">This reminder relates to your upcoming tutoring session.</div></div></div></body></html>`;
  const reminderDay = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return deliver({ to: input.email, subject, html, text, idempotencyKey: `mat-session-reminder/${input.sessionId}/${input.scheduledFor}/${reminderDay}` });
}

export async function sendProgressReportEmail(input: StudentRecipient & {
  reportId: string;
  title: string;
  periodLabel: string;
  overallScore: number | null;
  attendanceRate: number | null;
  homeworkCompletionRate: number | null;
  averageUnderstanding: number | null;
  summary?: string | null;
  strengths?: string | null;
  areasForImprovement?: string | null;
  nextFocus?: string | null;
}): Promise<StudentEmailResult> {
  const name = firstName(input.name);
  const metric = (value: number | null, suffix = "%") => value === null ? "Not enough data" : `${Number(value).toFixed(value % 1 ? 1 : 0)}${suffix}`;
  const subject = `${input.title} — My Academic Tutor`;
  const text = `Hi ${name},\n\nYour latest My Academic Tutor progress report is ready.\n\nPeriod: ${input.periodLabel}\nOverall progress indicator: ${metric(input.overallScore)}\nAttendance: ${metric(input.attendanceRate)}\nHomework completion: ${metric(input.homeworkCompletionRate)}\nAverage understanding: ${input.averageUnderstanding === null ? "Not enough data" : `${input.averageUnderstanding.toFixed(1)}/5`}\n${input.summary ? `\nSummary:\n${input.summary}\n` : ""}${input.strengths ? `\nStrengths:\n${input.strengths}\n` : ""}${input.areasForImprovement ? `\nAreas to improve:\n${input.areasForImprovement}\n` : ""}${input.nextFocus ? `\nNext focus:\n${input.nextFocus}\n` : ""}\nYou can also view your progress and lesson history in your My Academic Tutor student portal.\n\nKind regards,\nMy Academic Tutor`;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Student progress report</div></div><div class="body"><h1>${escapeHtml(input.title)}</h1><p>Hi ${escapeHtml(name)},</p><p>Your latest progress summary is ready for <strong>${escapeHtml(input.periodLabel)}</strong>.</p><div class="box"><strong>Overall progress indicator:</strong> ${escapeHtml(metric(input.overallScore))}<br><strong>Attendance:</strong> ${escapeHtml(metric(input.attendanceRate))}<br><strong>Homework completion:</strong> ${escapeHtml(metric(input.homeworkCompletionRate))}<br><strong>Average understanding:</strong> ${input.averageUnderstanding === null ? "Not enough data" : `${input.averageUnderstanding.toFixed(1)}/5`}</div>${input.summary ? `<p><strong>Summary</strong></p><p>${escapeHtml(input.summary).replaceAll("\n", "<br>")}</p>` : ""}${input.strengths ? `<p><strong>Strengths</strong></p><p>${escapeHtml(input.strengths).replaceAll("\n", "<br>")}</p>` : ""}${input.areasForImprovement ? `<p><strong>Areas to improve</strong></p><p>${escapeHtml(input.areasForImprovement).replaceAll("\n", "<br>")}</p>` : ""}${input.nextFocus ? `<p><strong>Next focus</strong></p><p>${escapeHtml(input.nextFocus).replaceAll("\n", "<br>")}</p>` : ""}<p>The same progress information is available in your student portal alongside your lesson history and learning plan.</p><p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">This progress indicator summarises your tutoring records for the stated period and is not an academic grade.</div></div></div></body></html>`;
  return deliver({ to: input.email, subject, html, text, idempotencyKey: `mat-progress-report/${input.reportId}` });
}
