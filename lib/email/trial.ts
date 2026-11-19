import { Resend } from "resend";

export type TrialEmailResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
};

type TrialNotificationInput = {
  leadId: string;
  name: string;
  email: string;
  subject: string;
  scheduledFor: string;
  durationMinutes: number;
  tutorName?: string | null;
  meetingUrl?: string | null;
};

function configured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAT_EMAIL_FROM?.trim());
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

function prettyDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export async function sendLeadTrialNotification(input: TrialNotificationInput): Promise<TrialEmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };

  const when = prettyDate(input.scheduledFor);
  const name = firstName(input.name);
  const replyTo = process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim() || undefined;
  const tutorLine = input.tutorName ? `\nTutor: ${input.tutorName}` : "";
  const meetingLine = input.meetingUrl ? `\nJoin link: ${input.meetingUrl}` : "";
  const text = `Hi ${name},\n\nYour My Academic Tutor trial session has been scheduled.\n\nSubject: ${input.subject}\nDate and time: ${when}\nDuration: ${input.durationMinutes} minutes${tutorLine}${meetingLine}\n\nIf anything needs changing, simply reply to this email.\n\nKind regards,\nMy Academic Tutor`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#f4f7fb;color:#10233f;font-family:Arial,Helvetica,sans-serif}.wrap{max-width:680px;margin:0 auto;padding:32px 18px}.card{background:#fff;border:1px solid #dce4ee;border-radius:12px;overflow:hidden}.top{padding:24px 28px;background:#0b1f3a;color:#fff}.body{padding:28px}h1{font-size:26px;line-height:1.25;margin:4px 0 12px;color:#0b1f3a}p{font-size:15px;line-height:1.65;margin:0 0 16px;color:#4d5c70}.box{margin:20px 0;padding:16px 18px;border-left:3px solid #1f5bd8;background:#f7f9fc;color:#27384f;font-size:14px;line-height:1.75}.button{display:inline-block;margin:4px 0 18px;padding:12px 18px;border-radius:8px;background:#1f5bd8;color:#fff!important;text-decoration:none;font-weight:700}.footer{padding:20px 28px;background:#f7f9fc;color:#748095;font-size:12px;line-height:1.55}
  </style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Trial session confirmation</div></div><div class="body"><h1>Your trial session is scheduled</h1><p>Hi ${escapeHtml(name)},</p><p>We have scheduled your one-to-one trial session.</p><div class="box"><strong>Subject:</strong> ${escapeHtml(input.subject)}<br><strong>Date and time:</strong> ${escapeHtml(when)}<br><strong>Duration:</strong> ${input.durationMinutes} minutes${input.tutorName ? `<br><strong>Tutor:</strong> ${escapeHtml(input.tutorName)}` : ""}</div>${input.meetingUrl ? `<a class="button" href="${escapeHtml(input.meetingUrl)}">Join trial session</a>` : ""}<p>If anything needs changing, simply reply to this email.</p><p>Kind regards,<br><strong>My Academic Tutor</strong></p></div><div class="footer">Personalised one-to-one academic tutoring.</div></div></div></body></html>`;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const stamp = input.scheduledFor.replace(/[^0-9]/g, "").slice(0, 20);
  try {
    const { data, error } = await resend.emails.send(
      {
        from: process.env.MAT_EMAIL_FROM!,
        to: [input.email],
        replyTo,
        subject: `Trial session scheduled — ${input.subject}`,
        html,
        text,
      },
      { idempotencyKey: `mat-trial/${input.leadId}/${stamp}` },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Resend error" };
  }
}
