import { NextRequest, NextResponse } from "next/server";
import { resolveIntakeLink } from "@/lib/student-onboarding";
import { createAdminClient } from "@/lib/supabase/admin";

function clean(value: unknown, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function nullable(value: unknown, max = 5000) {
  const text = clean(value, max);
  return text || null;
}

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > 100_000) return NextResponse.json({ error: "Request too large." }, { status: 413 });

  const { token } = await params;
  const link = await resolveIntakeLink(token);
  if (!link) return NextResponse.json({ error: "This intake link is invalid or has expired." }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (clean(body.company, 200)) return NextResponse.json({ ok: true });
  if (clean(body.consent, 20) !== "yes") return NextResponse.json({ error: "Please confirm the consent checkbox." }, { status: 400 });

  const targetOutcome = clean(body.targetOutcome, 5000);
  if (!targetOutcome) return NextResponse.json({ error: "Please tell us your target outcome." }, { status: 400 });

  const confidenceRaw = clean(body.currentConfidence, 10);
  const confidenceNumber = confidenceRaw ? Number(confidenceRaw) : null;
  const confidence = confidenceNumber && confidenceNumber >= 1 && confidenceNumber <= 5 ? Math.round(confidenceNumber) : null;
  const targetDateRaw = clean(body.targetDate, 20);
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(targetDateRaw) && !Number.isNaN(new Date(`${targetDateRaw}T00:00:00Z`).getTime()) ? targetDateRaw : null;
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  const { error: onboardingError } = await supabase
    .from("student_onboarding")
    .upsert({
      student_id: link.student_id,
      status: "review",
      timezone: nullable(body.timezone, 200),
      availability: nullable(body.availability, 1000),
      target_outcome: targetOutcome,
      target_date: targetDate,
      current_confidence: confidence,
      strong_topics: nullable(body.strongTopics, 5000),
      weak_topics: nullable(body.weakTopics, 5000),
      learning_preferences: nullable(body.learningPreferences, 5000),
      course_context: nullable(body.courseContext, 5000),
      assessment_context: nullable(body.assessmentContext, 5000),
      accessibility_requirements: nullable(body.accessibilityRequirements, 5000),
      anything_else: nullable(body.anythingElse, 5000),
      consent_confirmed: true,
      intake_completed_at: now,
      updated_at: now,
    }, { onConflict: "student_id" });

  if (onboardingError) return NextResponse.json({ error: "Could not save your intake form." }, { status: 500 });

  const { error: studentError } = await supabase
    .from("students")
    .update({
      academic_level: nullable(body.academicLevel, 300),
      institution: nullable(body.institution, 500),
      programme: nullable(body.programme, 500),
      updated_at: now,
    })
    .eq("id", link.student_id);

  if (studentError) return NextResponse.json({ error: "Your intake was saved, but academic profile details could not be updated." }, { status: 500 });

  return NextResponse.json({ ok: true });
}
