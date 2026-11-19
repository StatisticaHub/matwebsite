import { Resend } from "resend";
import type { StudentEmailResult } from "@/lib/email/student";

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

export async function sendTestimonialRequestEmail(input: {
  requestId: string;
  name: string;
  email: string;
  subject: string;
  tutorName?: string | null;
  feedbackUrl: string;
}): Promise<StudentEmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.MAT_EMAIL_FROM!;
  const replyTo = process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim() || undefined;
  const name = firstName(input.name);
  const tutorLine = input.tutorName ? ` about your tutoring with ${escapeHtml(input.tutorName)}` : " about your tutoring experience";
  const subject = "How was your tutoring experience? — My Academic Tutor";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#10233f"><div style="max-width:640px;margin:0 auto;padding:32px 18px"><div style="background:#fff;border:1px solid #dce4ee;border-radius:14px;overflow:hidden"><div style="padding:24px 28px;background:#0b1f3a;color:#fff"><strong style="font-size:18px">My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.8">Student feedback</div></div><div style="padding:28px"><h1 style="font-size:26px;line-height:1.25;margin:0 0 14px">We’d value your feedback, ${escapeHtml(name)}.</h1><p style="font-size:15px;line-height:1.65;color:#4d5c70">You’ve been studying <strong>${escapeHtml(input.subject)}</strong> with My Academic Tutor. We’d appreciate a short, honest review${tutorLine}.</p><p style="font-size:15px;line-height:1.65;color:#4d5c70">Your feedback helps us improve our teaching. You can choose whether or not you give permission for your comments to be published publicly. Nothing is published automatically.</p><p style="margin:24px 0"><a href="${escapeHtml(input.feedbackUrl)}" style="display:inline-block;background:#1f5bd8;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Share feedback</a></p><p style="font-size:13px;line-height:1.6;color:#748095">The link is personal to you. Please don’t forward it.</p><p style="font-size:15px;line-height:1.65;color:#4d5c70">Kind regards,<br><strong>My Academic Tutor</strong></p></div></div></div></body></html>`;
  const text = `Hi ${name},\n\nWe'd value your feedback on your ${input.subject} tutoring experience.\n\nShare feedback: ${input.feedbackUrl}\n\nYou can choose whether or not your comments may be published publicly. Nothing is published automatically.\n\nKind regards,\nMy Academic Tutor`;

  try {
    const { data, error } = await resend.emails.send({ from, to: [input.email], replyTo, subject, html, text }, { idempotencyKey: `mat-testimonial-request/${input.requestId}` });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Resend error" };
  }
}
