import { Resend } from "resend";

type LeadEmailData = {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  level: string;
  subject: string;
  support_type: string;
  curriculum: string | null;
  topic: string | null;
  requirements: string;
  availability: string | null;
  urgency: string | null;
  source: string | null;
  landing_page: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
};

type EmailResult = {
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
  return Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.MAT_EMAIL_FROM?.trim() &&
      process.env.MAT_LEADS_TO_EMAIL?.trim(),
  );
}

function resendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function value(value: string | null | undefined) {
  return value?.trim() || "Not provided";
}

function baseStyles() {
  return `
    body{margin:0;background:#f4f7fb;color:#10233f;font-family:Arial,Helvetica,sans-serif}
    .wrap{max-width:680px;margin:0 auto;padding:32px 18px}
    .card{background:#ffffff;border:1px solid #dce4ee;border-radius:12px;overflow:hidden}
    .top{padding:24px 28px;background:#0b1f3a;color:#ffffff}
    .top strong{font-size:18px}.body{padding:28px}.ref{display:inline-block;padding:7px 10px;border-radius:6px;background:#edf4ff;color:#0b3b91;font-weight:700;font-size:12px;letter-spacing:.04em}
    h1{font-size:26px;line-height:1.25;margin:14px 0 10px;color:#0b1f3a}p{font-size:15px;line-height:1.65;margin:0 0 16px;color:#4d5c70}
    .grid{width:100%;border-collapse:collapse;margin:22px 0}.grid td{padding:10px 0;border-bottom:1px solid #edf0f4;vertical-align:top;font-size:14px}.grid td:first-child{width:170px;color:#6c788a}.grid td:last-child{color:#10233f;font-weight:600}
    .box{margin:20px 0;padding:16px 18px;border-left:3px solid #1f5bd8;background:#f7f9fc;color:#27384f;font-size:14px;line-height:1.65}
    .footer{padding:20px 28px;background:#f7f9fc;color:#748095;font-size:12px;line-height:1.55}
    a{color:#1f5bd8}
  `;
}

export async function sendNewLeadNotification(lead: LeadEmailData): Promise<EmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };

  const from = process.env.MAT_EMAIL_FROM!;
  const to = process.env.MAT_LEADS_TO_EMAIL!;
  const replyTo = lead.email;
  const adminUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/admin/leads/${lead.id}`;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body><div class="wrap"><div class="card">
    <div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">New tutoring enquiry</div></div>
    <div class="body"><span class="ref">${escapeHtml(lead.reference)}</span><h1>${escapeHtml(lead.subject)} enquiry from ${escapeHtml(lead.name)}</h1>
    <p>A new tutoring request has been submitted and saved to the MAT lead dashboard.</p>
    <table class="grid">
      <tr><td>Student</td><td>${escapeHtml(lead.name)}</td></tr>
      <tr><td>Email</td><td>${escapeHtml(lead.email)}</td></tr>
      ${lead.phone ? `<tr><td>Phone / WhatsApp</td><td>${escapeHtml(lead.phone)}</td></tr>` : ""}
      <tr><td>Country</td><td>${escapeHtml(lead.country)}</td></tr>
      <tr><td>Academic level</td><td>${escapeHtml(lead.level)}</td></tr>
      <tr><td>Subject</td><td>${escapeHtml(lead.subject)}</td></tr>
      ${lead.topic ? `<tr><td>Topic</td><td>${escapeHtml(lead.topic)}</td></tr>` : ""}
      ${lead.curriculum ? `<tr><td>Curriculum / university</td><td>${escapeHtml(lead.curriculum)}</td></tr>` : ""}
      <tr><td>Support type</td><td>${escapeHtml(lead.support_type)}</td></tr>
      ${lead.urgency ? `<tr><td>Urgency</td><td>${escapeHtml(lead.urgency)}</td></tr>` : ""}
      ${lead.availability ? `<tr><td>Availability</td><td>${escapeHtml(lead.availability)}</td></tr>` : ""}
      <tr><td>Source</td><td>${escapeHtml(value(lead.utm_source || lead.source))}</td></tr>
      ${lead.utm_campaign ? `<tr><td>Campaign</td><td>${escapeHtml(lead.utm_campaign)}</td></tr>` : ""}
    </table>
    <div class="box"><strong>What the student needs help with</strong><br>${escapeHtml(lead.requirements).replaceAll("\n", "<br>")}</div>
    ${adminUrl.startsWith("http") ? `<p><a href="${escapeHtml(adminUrl)}">Open this lead in the MAT admin dashboard →</a></p>` : ""}
    </div><div class="footer">This is an internal lead notification from My Academic Tutor. Replying to this email will reply to the student.</div>
  </div></div></body></html>`;

  const text = `NEW TUTORING LEAD\n\nReference: ${lead.reference}\nStudent: ${lead.name}\nEmail: ${lead.email}\nPhone: ${value(lead.phone)}\nCountry: ${lead.country}\nLevel: ${lead.level}\nSubject: ${lead.subject}\nTopic: ${value(lead.topic)}\nCurriculum / university: ${value(lead.curriculum)}\nSupport type: ${lead.support_type}\nUrgency: ${value(lead.urgency)}\nAvailability: ${value(lead.availability)}\n\nRequirement:\n${lead.requirements}\n\nAdmin: ${adminUrl}`;

  try {
    const { data, error } = await resendClient().emails.send(
      {
        from,
        to: [to],
        replyTo,
        subject: `[MAT Lead] ${lead.subject} · ${lead.level} · ${lead.reference}`,
        html,
        text,
      },
      { idempotencyKey: `mat-new-lead/${lead.id}` },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Resend error" };
  }
}

export async function sendStudentAcknowledgement(lead: LeadEmailData): Promise<EmailResult> {
  if (!configured()) return { ok: false, skipped: true, error: "Resend email configuration is incomplete." };

  const from = process.env.MAT_EMAIL_FROM!;
  const replyTo = process.env.MAT_REPLY_TO_EMAIL?.trim() || process.env.MAT_LEADS_TO_EMAIL!;
  const firstName = lead.name.trim().split(/\s+/)[0] || lead.name;

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${baseStyles()}</style></head><body><div class="wrap"><div class="card">
    <div class="top"><strong>My Academic Tutor</strong><div style="margin-top:5px;font-size:13px;opacity:.78">Tutoring request received</div></div>
    <div class="body"><span class="ref">${escapeHtml(lead.reference)}</span><h1>Thank you, ${escapeHtml(firstName)}.</h1>
    <p>We’ve received your request for <strong>${escapeHtml(lead.subject)}</strong> support. Our team will review your academic needs and arrange suitable one-to-one support.</p>
    <table class="grid">
      <tr><td>Academic level</td><td>${escapeHtml(lead.level)}</td></tr>
      <tr><td>Subject</td><td>${escapeHtml(lead.subject)}</td></tr>
      ${lead.topic ? `<tr><td>Topic</td><td>${escapeHtml(lead.topic)}</td></tr>` : ""}
      <tr><td>Support</td><td>${escapeHtml(lead.support_type)}</td></tr>
    </table>
    <div class="box"><strong>What happens next</strong><br>1. We review your learning requirements.<br>2. We arrange suitable one-to-one academic support.<br>3. We contact you with the next-step details for starting tutoring.</div>
    <p>Please keep your reference <strong>${escapeHtml(lead.reference)}</strong> if you contact us about this request.</p>
    <p>If you need to add anything, simply reply to this email.</p>
    <p>Kind regards,<br><strong>My Academic Tutor</strong></p>
    </div><div class="footer">Personalised 1:1 academic support from school to postgraduate and research-level study.</div>
  </div></div></body></html>`;

  const text = `Hi ${firstName},\n\nThank you for your tutoring request.\n\nReference: ${lead.reference}\nSubject: ${lead.subject}\nLevel: ${lead.level}\nTopic: ${value(lead.topic)}\n\nWhat happens next:\n1. We review your learning requirements.\n2. We arrange suitable one-to-one academic support.\n3. We contact you with the next-step details for starting tutoring.\n\nIf you need to add anything, reply to this email.\n\nKind regards,\nMy Academic Tutor`;

  try {
    const { data, error } = await resendClient().emails.send(
      {
        from,
        to: [lead.email],
        replyTo,
        subject: `We received your tutoring request · ${lead.reference}`,
        html,
        text,
      },
      { idempotencyKey: `mat-student-ack/${lead.id}` },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Resend error" };
  }
}
