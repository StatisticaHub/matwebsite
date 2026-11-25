import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasServerSupabaseConfig } from "@/lib/supabase/config";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { sendNewLeadNotification, sendStudentAcknowledgement } from "@/lib/email/resend";

export const runtime = "nodejs";

const MAX_LEAD_BODY_BYTES = 32 * 1024;

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

function clean(value: unknown, max = 1200) {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

function reference(prefix = "MAT") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${date}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function validEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function gaClientIdFromCookie(value: string) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "";
  const match = cleanValue.match(/^(?:GA\d+\.\d+\.)?(\d+\.\d+)$/);
  return match?.[1] || cleanValue;
}

function gaSessionIdFromCookie(value: string) {
  const cleanValue = String(value || "").trim();
  if (!cleanValue) return "";

  // Google Analytics session cookies commonly contain a value such as
  // GS2.1.s1700000000$o1$g0$t1700000000$j0$l0$h0. Prefer the "s" value,
  // while still accepting a plain session id if Google changes formatting.
  const match = cleanValue.match(/(?:^|\$)s(\d+)(?:\$|$)/);
  return match?.[1] || cleanValue;
}

function gaSessionCookieName(measurementId: string) {
  return `_ga_${measurementId.replace(/^G-/, "").replace(/-/g, "_")}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!sameOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid origin." },
        { status: 403 },
      );
    }

    const contentLength = Number(
      request.headers.get("content-length") || 0,
    );

    if (
      Number.isFinite(contentLength) &&
      contentLength > MAX_LEAD_BODY_BYTES
    ) {
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    }

    const rawText = await request.text();

    if (
      Buffer.byteLength(rawText, "utf8") >
      MAX_LEAD_BODY_BYTES
    ) {
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    }

    let raw: Record<string, unknown>;

    try {
      raw = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 },
      );
    }

    // Honeypot: act successful without storing bot submissions.
    if (clean(raw.companyWebsite)) {
      return NextResponse.json({ ok: true, reference: reference("MAT"), message: "Request received." });
    }

    const name = clean(raw.name, 120);
    const email = clean(raw.email, 240).toLowerCase();
    const requirements = clean(raw.requirements, 5000);
    const country = clean(raw.country, 120);
    const level = clean(raw.level, 120);
    const subject = clean(raw.subject, 160);
    const supportType = clean(raw.supportType, 160);
    const consent = clean(raw.consent, 20);
    const ageConfirmation = clean(raw.ageConfirmation, 20);

    const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";
    const gaClientId =
      clean(raw.gaClientId, 240) ||
      clean(gaClientIdFromCookie(request.cookies.get("_ga")?.value || ""), 240);
    const gaSessionId =
      clean(raw.gaSessionId, 500) ||
      (measurementId
        ? clean(
            gaSessionIdFromCookie(
              request.cookies.get(gaSessionCookieName(measurementId))?.value || "",
            ),
            500,
          )
        : "");
    if (!name || !email || !requirements || !country || !level || !subject || !supportType || consent !== "yes" || ageConfirmation !== "yes") {
      return NextResponse.json({ error: "Please complete all required fields." }, { status: 400 });
    }
    if (ageConfirmation !== "yes") {
      return NextResponse.json(
        {
          error:
            "Tutoring enquiries are currently available only to learners aged 18 or over.",
        },
        { status: 400 },
      );
    }

    if (!validEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (requirements.length < 20) {
      return NextResponse.json({ error: "Please tell us a little more about the support you need." }, { status: 400 });
    }

    const turnstile =
      await verifyTurnstileToken({
        token:
          raw.turnstileToken,
        expectedAction:
          "tutoring_enquiry",
      });

    if (!turnstile.ok) {
      return NextResponse.json(
        {
          error:
            turnstile.error,
        },
        {
          status:
            turnstile.status,
        },
      );
    }

    const ref = reference();
    const lead = {
      reference: ref,
      name,
      email,
      phone: clean(raw.phone, 80) || null,
      country,
      level,
      subject,
      support_type: supportType,
      curriculum: clean(raw.curriculum, 240) || null,
      topic: clean(raw.topic, 240) || null,
      requirements,
      availability: clean(raw.availability, 500) || null,
      urgency: clean(raw.urgency, 120) || null,
      source: clean(raw.source, 120) || "website",
      landing_page: clean(raw.landingPage, 1000) || null,
      referrer: clean(raw.referrer, 1000) || null,
      utm_source: clean(raw.utmSource, 240) || null,
      utm_medium: clean(raw.utmMedium, 240) || null,
      utm_campaign: clean(raw.utmCampaign, 240) || null,
      utm_term: clean(raw.utmTerm, 240) || null,
      utm_content: clean(raw.utmContent, 240) || null,
      status: "new",
      currency: ["GBP", "USD", "CAD"].includes(
        clean(raw.currency, 3).toUpperCase(),
      )
        ? clean(raw.currency, 3).toUpperCase()
        : "GBP",
      ga_client_id: gaClientId || null,
      ga_session_id: gaSessionId || null,
      ga_captured_at: gaClientId ? new Date().toISOString() : null,
    };

    if (!hasServerSupabaseConfig()) {
      console.log("[MAT DEMO LEAD — SUPABASE NOT CONNECTED]", {
        ...lead,
        email: "[redacted]",
      });
      return NextResponse.json({
        ok: true,
        reference: `DEMO-${ref}`,
        mode: "demo",
        message: "The request flow is working. Supabase storage is not connected in this environment yet.",
      });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tutoring_leads")
      .insert(lead)
      .select("id, reference")
      .single();

    if (error) {
      console.error("[MAT LEAD INSERT ERROR]", error);
      return NextResponse.json({ error: "We could not save your request. Please try again." }, { status: 500 });
    }

    await supabase.from("lead_activity").insert({
      lead_id: data.id,
      event_type: "lead_created",
      note: "Tutoring request submitted from the website.",
      created_by_email: "website",
    });

    // Email is intentionally non-blocking: the lead remains safely stored even if
    // Resend is unavailable, misconfigured, or the recipient cannot be delivered to.
    const emailLead = { ...lead, id: data.id, reference: data.reference };
    const [teamEmail, studentEmail] = await Promise.all([
      sendNewLeadNotification(emailLead),
      sendStudentAcknowledgement(emailLead),
    ]);

    const emailActivity: Array<{
      lead_id: string;
      event_type: string;
      note: string;
      created_by_email: string;
    }> = [];
    if (teamEmail.ok) {
      emailActivity.push({
        lead_id: data.id,
        event_type: "team_notification_sent",
        note: `New-lead email sent to MAT${teamEmail.id ? ` (Resend ${teamEmail.id})` : ""}.`,
        created_by_email: "system",
      });
    } else {
      emailActivity.push({
        lead_id: data.id,
        event_type: teamEmail.skipped ? "team_notification_skipped" : "team_notification_failed",
        note: teamEmail.error || "Team notification was not sent.",
        created_by_email: "system",
      });
    }

    if (studentEmail.ok) {
      emailActivity.push({
        lead_id: data.id,
        event_type: "student_acknowledgement_sent",
        note: `Acknowledgement sent to ${email}${studentEmail.id ? ` (Resend ${studentEmail.id})` : ""}.`,
        created_by_email: "system",
      });
    } else {
      emailActivity.push({
        lead_id: data.id,
        event_type: studentEmail.skipped ? "student_acknowledgement_skipped" : "student_acknowledgement_failed",
        note: studentEmail.error || "Student acknowledgement was not sent.",
        created_by_email: "system",
      });
    }

    const { error: emailActivityError } = await supabase.from("lead_activity").insert(emailActivity);
    if (emailActivityError) console.error("[MAT EMAIL ACTIVITY ERROR]", emailActivityError);

    if (!teamEmail.ok) console.error("[MAT TEAM EMAIL]", teamEmail.error || "Skipped");
    if (!studentEmail.ok) console.error("[MAT STUDENT EMAIL]", studentEmail.error || "Skipped");

    return NextResponse.json({
      ok: true,
      reference: data.reference,
      mode: "live",
      message: "Your tutoring request has been received. We will review the academic context and contact you with the proposed support and price before anything is booked.",
    });
  } catch (error) {
    console.error("[MAT LEAD ROUTE ERROR]", error);
    return NextResponse.json({ error: "The tutoring request could not be processed." }, { status: 500 });
  }
}
