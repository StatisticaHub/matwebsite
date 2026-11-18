"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { onboardingStatuses, type OnboardingStatus } from "@/lib/student-onboarding";
import { createAdminClient } from "@/lib/supabase/admin";

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function topicList(value: string | null) {
  return String(value || "").split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).slice(0, 50);
}

export async function saveOnboardingReview(formData: FormData) {
  const { supabase } = await adminContext();
  const studentId = text(formData, "studentId", 100);
  const status = text(formData, "status", 30) as OnboardingStatus;
  if (!studentId || !onboardingStatuses.includes(status)) return;

  const now = new Date().toISOString();
  const { error } = await supabase.from("student_onboarding").upsert({
    student_id: studentId,
    status,
    admin_notes: text(formData, "adminNotes", 5000) || null,
    reviewed_at: status === "ready" || status === "complete" ? now : null,
    updated_at: now,
  }, { onConflict: "student_id" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/onboarding");
  revalidatePath(`/admin/students/${studentId}`);
}

export async function applyIntakeToEngagement(formData: FormData) {
  const { supabase } = await adminContext();
  const studentId = text(formData, "studentId", 100);
  const engagementId = text(formData, "engagementId", 100);
  if (!studentId || !engagementId) return;

  const { data: onboarding, error: onboardingError } = await supabase.from("student_onboarding").select("*").eq("student_id", studentId).single();
  if (onboardingError || !onboarding) throw new Error(onboardingError?.message || "Onboarding record not found.");

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (onboarding.target_outcome) update.goal = onboarding.target_outcome;
  if (onboarding.target_date) update.upcoming_deadline = onboarding.target_date;
  if (onboarding.current_confidence) update.confidence = onboarding.current_confidence;
  if (onboarding.learning_preferences) update.preferred_learning_style = onboarding.learning_preferences;
  if (onboarding.weak_topics) update.weak_topics = topicList(onboarding.weak_topics);
  if (onboarding.assessment_context) update.assessment_summary = onboarding.assessment_context;

  const { error } = await supabase.from("tutoring_engagements").update(update).eq("id", engagementId).eq("student_id", studentId);
  if (error) throw new Error(error.message);

  await supabase.from("student_onboarding").update({ status: "ready", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("student_id", studentId);
  revalidatePath("/admin/onboarding");
  revalidatePath(`/admin/students/${studentId}`);
}
