import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.MAT_EMAIL_FROM?.trim();
const to = process.env.MAT_TEST_EMAIL_TO?.trim() || process.env.MAT_LEADS_TO_EMAIL?.trim();
const replyTo = process.env.MAT_REPLY_TO_EMAIL?.trim() || undefined;

if (!apiKey || !from || !to) {
  console.error("Missing RESEND_API_KEY, MAT_EMAIL_FROM, or MAT_LEADS_TO_EMAIL/MAT_TEST_EMAIL_TO.");
  process.exit(1);
}

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to: [to],
  replyTo,
  subject: "My Academic Tutor — Resend test",
  text: `Resend is configured correctly for My Academic Tutor.\n\nSent at: ${new Date().toISOString()}`,
  html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:30px auto;color:#10233f"><h2>My Academic Tutor</h2><p>Resend is configured correctly for the website.</p><p style="color:#65758b">Sent at ${new Date().toISOString()}</p></div>`,
});

if (error) {
  console.error("Resend test failed:", error.message);
  process.exit(1);
}

console.log(`Resend test sent to ${to}. Message ID: ${data?.id || "unknown"}`);
