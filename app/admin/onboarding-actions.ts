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

  if (status === "ready" || status === "complete") {
    const [
      studentResult,
      onboardingResult,
      engagementResult,
    ] = await Promise.all([
      supabase
        .from("students")
        .select("auth_user_id,portal_enabled")
        .eq("id", studentId)
        .maybeSingle(),

      supabase
        .from("student_onboarding")
        .select("intake_completed_at")
        .eq("student_id", studentId)
        .maybeSingle(),

      supabase
        .from("tutoring_engagements")
        .select("id,tutor_id,status")
        .eq("student_id", studentId)
        .in("status", ["active", "completed"]),
    ]);

    if (studentResult.error) {
      throw new Error(studentResult.error.message);
    }

    if (onboardingResult.error) {
      throw new Error(onboardingResult.error.message);
    }

    if (engagementResult.error) {
      throw new Error(engagementResult.error.message);
    }

    const engagements =
      engagementResult.data || [];

    const hasIntake =
      Boolean(
        onboardingResult.data?.intake_completed_at,
      );

    const hasTutor =
      engagements.some(
        (engagement) =>
          Boolean(
            engagement.tutor_id,
          ),
      );

    const hasStudentLogin =
      Boolean(
        studentResult.data?.portal_enabled &&
        studentResult.data?.auth_user_id,
      );

    const engagementIds =
      engagements.map(
        (engagement) =>
          engagement.id,
      );

    let hasFirstSession =
      false;

    if (engagementIds.length) {
      const {
        data: sessionRows,
        error: sessionError,
      } = await supabase
        .from("tutoring_sessions")
        .select("id")
        .in(
          "engagement_id",
          engagementIds,
        )
        .in(
          "status",
          [
            "planned",
            "completed",
          ],
        )
        .limit(1);

      if (sessionError) {
        throw new Error(
          sessionError.message,
        );
      }

      hasFirstSession =
        Boolean(
          sessionRows?.length,
        );
    }

    const canBeReady =
      hasIntake &&
      hasTutor &&
      hasStudentLogin;

    if (!canBeReady) {
      redirect(
        `/admin/onboarding?student=${encodeURIComponent(studentId)}&blocked=ready`,
      );
    }

    if (
      status === "complete" &&
      !hasFirstSession
    ) {
      redirect(
        `/admin/onboarding?student=${encodeURIComponent(studentId)}&blocked=complete`,
      );
    }
  }

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

  const [
    studentResult,
    engagementResult,
  ] = await Promise.all([
    supabase
      .from("students")
      .select("auth_user_id,portal_enabled")
      .eq("id", studentId)
      .maybeSingle(),

    supabase
      .from("tutoring_engagements")
      .select("tutor_id,status")
      .eq("id", engagementId)
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  if (studentResult.error) {
    throw new Error(
      studentResult.error.message,
    );
  }

  if (engagementResult.error) {
    throw new Error(
      engagementResult.error.message,
    );
  }

  const canBeReady =
    Boolean(
      onboarding.intake_completed_at &&
      engagementResult.data?.tutor_id &&
      studentResult.data?.portal_enabled &&
      studentResult.data?.auth_user_id
    );

  const nextStatus: OnboardingStatus =
    onboarding.status === "complete"
      ? "complete"
      : canBeReady
        ? "ready"
        : "review";

  const now =
    new Date().toISOString();

  const {
    error: onboardingUpdateError,
  } = await supabase
    .from("student_onboarding")
    .update({
      status: nextStatus,
      reviewed_at:
        nextStatus === "ready" ||
        nextStatus === "complete"
          ? now
          : null,
      updated_at: now,
    })
    .eq("student_id", studentId);

  if (onboardingUpdateError) {
    throw new Error(
      onboardingUpdateError.message,
    );
  }
  revalidatePath("/admin/onboarding");
  revalidatePath(`/admin/students/${studentId}`);
}
