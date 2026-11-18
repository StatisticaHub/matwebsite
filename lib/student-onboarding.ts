import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Student, TutoringEngagement } from "@/lib/delivery-data";

export const onboardingStatuses = ["awaiting_intake", "review", "ready", "complete"] as const;
export type OnboardingStatus = (typeof onboardingStatuses)[number];

export const onboardingStatusLabels: Record<OnboardingStatus, string> = {
  awaiting_intake: "Awaiting intake",
  review: "Needs review",
  ready: "Ready to start",
  complete: "Onboarding complete",
};

export type StudentOnboarding = {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  status: OnboardingStatus;
  timezone: string | null;
  availability: string | null;
  target_outcome: string | null;
  target_date: string | null;
  current_confidence: number | null;
  strong_topics: string | null;
  weak_topics: string | null;
  learning_preferences: string | null;
  course_context: string | null;
  assessment_context: string | null;
  accessibility_requirements: string | null;
  anything_else: string | null;
  consent_confirmed: boolean;
  intake_completed_at: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
};

export type StudentIntakeLink = {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  token_hash: string;
  token_preview: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_accessed_at: string | null;
  created_by_email: string | null;
  label: string | null;
};

export type IntakeContext = {
  link: StudentIntakeLink;
  student: Student;
  onboarding: StudentOnboarding;
  engagement: TutoringEngagement | null;
  tutorName: string | null;
};

const tokenPattern = /^[A-Za-z0-9_-]{40,128}$/;

export function generateIntakeToken() {
  return randomBytes(32).toString("base64url");
}

export function normalizeIntakeToken(value: string) {
  const token = String(value || "").trim();
  return tokenPattern.test(token) ? token : null;
}

export function hashIntakeToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function intakeTokenPreview(token: string) {
  return `${token.slice(0, 5)}…${token.slice(-4)}`;
}

export function isIntakeLinkExpired(link: Pick<StudentIntakeLink, "expires_at">) {
  return Boolean(link.expires_at && new Date(link.expires_at).getTime() <= Date.now());
}

export async function resolveIntakeLink(tokenInput: string) {
  const token = normalizeIntakeToken(tokenInput);
  if (!token) return null;

  const supabase = createAdminClient();
  const tokenHash = hashIntakeToken(token);
  const { data, error } = await supabase
    .from("student_intake_links")
    .select("*")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;
  const link = data as StudentIntakeLink;
  if (isIntakeLinkExpired(link)) return null;
  return link;
}

export async function getIntakeContext(tokenInput: string): Promise<IntakeContext | null> {
  const link = await resolveIntakeLink(tokenInput);
  if (!link) return null;

  const supabase = createAdminClient();
  const [{ data: studentData, error: studentError }, { data: onboardingData }, { data: engagementData }] = await Promise.all([
    supabase.from("students").select("*").eq("id", link.student_id).single(),
    supabase.from("student_onboarding").select("*").eq("student_id", link.student_id).maybeSingle(),
    supabase.from("tutoring_engagements").select("*").eq("student_id", link.student_id).order("created_at", { ascending: false }),
  ]);

  if (studentError || !studentData) return null;

  let onboarding = onboardingData as StudentOnboarding | null;
  if (!onboarding) {
    const { data: inserted, error: insertError } = await supabase
      .from("student_onboarding")
      .insert({ student_id: link.student_id })
      .select("*")
      .single();
    if (insertError || !inserted) return null;
    onboarding = inserted as StudentOnboarding;
  }

  const engagements = (engagementData || []) as TutoringEngagement[];
  const engagement = engagements.find((item) => item.status === "active") || engagements[0] || null;
  let tutorName: string | null = null;
  if (engagement?.tutor_id) {
    const { data: tutor } = await supabase.from("tutors").select("name").eq("id", engagement.tutor_id).maybeSingle();
    tutorName = tutor?.name || null;
  }

  await supabase
    .from("student_intake_links")
    .update({ last_accessed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", link.id);

  return {
    link,
    student: studentData as Student,
    onboarding,
    engagement,
    tutorName,
  };
}
