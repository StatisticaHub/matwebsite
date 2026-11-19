import { Resend } from "resend";

export type NotificationEmailResult = {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
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

function styles() {
  return `
    body{margin:0;background:#f4f7fb;color:#10233f;font-family:Arial,Helvetica,sans-serif}
    .wrap{max-width:680px;margin:0 auto;padding:32px 18px}.card{background:#fff;border:1px solid #dce4ee;border-radius:12px;overflow:hidden}
    .top{padding:24px 28px;background:#0b1f3a;color:#fff}.top strong{font-size:18px}.body{padding:28px}
    h1{font-size:25px;line-height:1.25;margin:4px 0 12px;color:#0b1f3a}p{font-size:15px;line-height:1.65;margin:0 0 16px;color:#4d5c70}
    .button{display:inline-block;margin:8px 0 20px;padding:12px 18px;border-radius:8px;background:#1f5bd8;color:#fff!important;text-decoration:none;font-weight:700}
    .box{margin:20px 0;padding:16px 18px;border-left:3px solid #1f5bd8;background:#f7f9fc;color:#27384f;font-size:14px;line-height:1.65}
    .footer{padding:20px 28px;background:#f7f9fc;color:#748095;font-size:12px;line-height:1.55}a{color:#1f5bd8}
  `;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.myacademictutor.com").replace(/\/$/, "");
}

export function formatLondonDateTime(value: string | Date) {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(d);
}

export async function sendNotificationEmail(input: {
  to: string;
  subject: string;
  heading: string;
  greetingName?: string | null;
  intro: string;
  details?: Array<{ label: string; value: string | null | undefined }>;
  buttonLabel?: string;
  buttonUrl?: string | null;
  closing?: string;
  idempotencyKey: string;
}): Promise<NotificationEmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };

  const detailRows = (input.details || []).filter((x) => x.value);
  const greeting = input.greetingName ? `Hi ${firstName(input.greetingName)},` : "Hello,";
  const textDetails = detailRows.map((x) => `${x.label}: ${x.value}`).join("\n");
  const text = `${greeting}\n\n${input.intro}${textDetails ? `\n\n${textDetails}` : ""}${input.buttonUrl ? `\n\n${input.buttonLabel || "Open"}: ${input.buttonUrl}` : ""}\n\n${input.closing || "Kind regards,\nMy Academic Tutor"}`;
  const detailHtml = detailRows.length
    ? `<div class="box">${detailRows.map((x) => `<strong>${escapeHtml(x.label)}:</strong> ${escapeHtml(x.value)}<br>`).join("")}</div>`
    : "";
  const button = input.buttonUrl
    ? `<a class="button" href="${escapeHtml(input.buttonUrl)}">${escapeHtml(input.buttonLabel || "Open")}</a>`
    : "";
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${styles()}</style></head><body><div class="wrap"><div class="card"><div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Automated reminder</div></div><div class="body"><h1>${escapeHtml(input.heading)}</h1><p>${escapeHtml(greeting)}</p><p>${escapeHtml(input.intro)}</p>${detailHtml}${button}<p>${escapeHtml(input.closing || "Kind regards,\nMy Academic Tutor").replaceAll("\n", "<br>")}</p></div><div class="footer">This is an automated service message from My Academic Tutor.</div></div></div></body></html>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send(
      {
        from: process.env.MAT_EMAIL_FROM!,
        to: [input.to],
        replyTo: process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim() || undefined,
        subject: input.subject,
        html,
        text,
      },
      { idempotencyKey: input.idempotencyKey },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown email error" };
  }
}
