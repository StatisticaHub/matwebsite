import { Resend } from "resend";

type NurtureEmailInput = {
  to: string;
  subject: string;
  heading: string;
  greetingName: string;
  intro: string;
  body: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  preferenceUrl: string;
  idempotencyKey: string;
};

export type NurtureEmailResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
};

function escapeHtml(value: string | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function configured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAT_EMAIL_FROM?.trim());
}

export async function sendLeadNurtureEmail(input: NurtureEmailInput): Promise<NurtureEmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.MAT_EMAIL_FROM!;
  const replyTo = process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim() || undefined;

  const paragraphs = input.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  const button = input.buttonLabel && input.buttonUrl
    ? `<p style="margin:24px 0"><a href="${escapeHtml(input.buttonUrl)}" style="display:inline-block;background:#173d7a;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px">${escapeHtml(input.buttonLabel)}</a></p>`
    : "";

  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#f4f7fb;color:#10233f;font-family:Arial,Helvetica,sans-serif"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #dce4ee;border-radius:12px;overflow:hidden"><div style="padding:24px 28px;background:#0b1f3a;color:#fff"><strong style="font-size:18px">My Academic Tutor</strong></div><div style="padding:28px"><h1 style="font-size:25px;line-height:1.25;margin:0 0 14px;color:#0b1f3a">${escapeHtml(input.heading)}</h1><p style="font-size:15px;line-height:1.65;color:#4d5c70">Hi ${escapeHtml(input.greetingName)},</p><p style="font-size:15px;line-height:1.65;color:#4d5c70">${escapeHtml(input.intro)}</p>${paragraphs}${button}<p style="font-size:15px;line-height:1.65;color:#4d5c70">Kind regards,<br><strong>My Academic Tutor</strong></p></div><div style="padding:20px 28px;background:#f7f9fc;color:#748095;font-size:12px;line-height:1.55">You are receiving this because you contacted My Academic Tutor about tutoring. <a href="${escapeHtml(input.preferenceUrl)}" style="color:#1f5bd8">Manage email preferences</a>.</div></div></div></body></html>`;

  const text = `Hi ${input.greetingName},\n\n${input.intro}\n\n${input.body.join("\n\n")}${input.buttonUrl ? `\n\n${input.buttonLabel}: ${input.buttonUrl}` : ""}\n\nKind regards,\nMy Academic Tutor\n\nManage email preferences: ${input.preferenceUrl}`;

  try {
    const { data, error } = await resend.emails.send(
      {
        from,
        to: [input.to],
        replyTo,
        subject: input.subject,
        html,
        text,
      },
      { idempotencyKey: input.idempotencyKey },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Resend error" };
  }
}
