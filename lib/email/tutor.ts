import { Resend } from "resend";

function configured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.MAT_EMAIL_FROM?.trim());
}
function esc(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
function firstName(name: string) { return name.trim().split(/\s+/)[0] || name; }

export async function sendTutorPortalAccessEmail(input: { name: string; email: string; actionUrl: string; isRecovery: boolean }) {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const name = firstName(input.name);
  const subject = input.isRecovery ? "Reset your My Academic Tutor portal password" : "Your My Academic Tutor tutor portal";
  const action = input.isRecovery ? "Choose a new password" : "Set up my tutor portal";
  const intro = input.isRecovery
    ? "Use the secure link below to choose a new password for your tutor portal."
    : "Your My Academic Tutor tutor portal is ready. Use the secure link below to set your password and activate access.";
  const text = `Hi ${name},\n\n${intro}\n\n${input.actionUrl}\n\nThe portal lets you view your assigned students, trials and sessions, update lesson records, and manage your teaching availability.\n\nIf you did not expect this message, please contact My Academic Tutor.\n\nKind regards,\nMy Academic Tutor`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#10233f"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #dce4ee;border-radius:12px;overflow:hidden"><div style="padding:24px 28px;background:#0b1f3a;color:#fff"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Tutor portal access</div></div><div style="padding:28px"><h1 style="font-size:26px;margin:0 0 12px">Hi ${esc(name)},</h1><p style="line-height:1.65;color:#4d5c70">${esc(intro)}</p><a href="${esc(input.actionUrl)}" style="display:inline-block;margin:8px 0 20px;padding:12px 18px;border-radius:8px;background:#1f5bd8;color:#fff;text-decoration:none;font-weight:700">${esc(action)}</a><p style="line-height:1.65;color:#4d5c70">The portal lets you view your assigned students, trials and sessions, update lesson records, and manage your teaching availability.</p><p style="line-height:1.65;color:#4d5c70">If you did not expect this message, please contact My Academic Tutor.</p><p style="line-height:1.65;color:#4d5c70">Kind regards,<br><strong>My Academic Tutor</strong></p></div></div></div></body></html>`;
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.MAT_EMAIL_FROM!,
      to: [input.email],
      replyTo: process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim() || undefined,
      subject,
      html,
      text,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown email error" };
  }
}
