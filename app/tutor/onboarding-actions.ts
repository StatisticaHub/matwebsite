"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTutorAccountSession } from "@/lib/tutor-auth";

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function list(formData: FormData, key: string) {
  return text(formData, key, 3000)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 100);
}

function nullableNumber(formData: FormData, key: string) {
  const raw = text(formData, key, 50);

  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

async function onboardingContext() {
  const session = await getTutorAccountSession();

  if (!session) {
    redirect("/tutor/login?unauthorized=1");
  }

  if (session.tutor.status === "active") {
    redirect("/tutor");
  }

  if (session.tutor.status !== "pending") {
    redirect("/tutor/login?unauthorized=1");
  }

  return {
    session,
    supabase: createAdminClient(),
  };
}

export async function saveTutorOnboarding(formData: FormData) {
  const { session, supabase } = await onboardingContext();

  const intent = text(formData, "intent", 30);
  const submitting = intent === "submit";

  const headline = text(formData, "headline", 500) || null;
  const subjects = list(formData, "subjects");
  const levels = list(formData, "levels");
  const specialisms = list(formData, "specialisms");
  const qualifications = text(formData, "qualifications", 5000) || null;
  const teachingExperience =
    text(formData, "teachingExperience", 5000) || null;
  const languages = list(formData, "languages");
  const timezone = text(formData, "timezone", 120) || null;

  const availabilityDays = formData
    .getAll("availabilityDays")
    .map(String)
    .filter(Boolean);

  const availabilityPeriods = formData
    .getAll("availabilityPeriods")
    .map(String)
    .filter(Boolean);

  const weeklyCapacity = nullableNumber(
    formData,
    "weeklyCapacityHours"
  );

  const maxStudents = nullableNumber(
    formData,
    "maxActiveStudents"
  );

  if (
    submitting &&
    (
      !subjects.length ||
      !levels.length ||
      !qualifications ||
      !teachingExperience ||
      !languages.length ||
      !timezone ||
      !availabilityDays.length ||
      !availabilityPeriods.length
    )
  ) {
    redirect("/tutor/onboarding?error=incomplete");
  }

  const now = new Date().toISOString();

  const onboardingStatus = submitting
    ? "submitted"
    : session.tutor.onboarding_status === "submitted"
      ? "submitted"
      : "draft";

  const update: Record<string, unknown> = {
    headline,
    subjects,
    levels,
    specialisms,
    qualifications,
    teaching_experience: teachingExperience,
    languages,
    timezone,
    availability_notes:
      text(formData, "availabilityNotes", 2000) || null,
    availability_days: availabilityDays,
    availability_periods: availabilityPeriods,
    weekly_capacity_hours:
      weeklyCapacity !== null
        ? Math.max(0, Math.min(80, weeklyCapacity))
        : null,
    max_active_students:
      maxStudents !== null
        ? Math.max(0, Math.min(100, Math.round(maxStudents)))
        : null,
    accepts_trials: formData.get("acceptsTrials") === "yes",
    onboarding_status: onboardingStatus,
    onboarding_updated_at: now,
    updated_at: now,
  };

  if (submitting) {
    update.onboarding_submitted_at = now;
  }

  const { error } = await supabase
    .from("tutors")
    .update(update)
    .eq("id", session.tutor.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/tutor/onboarding");
  revalidatePath("/admin/tutors");
  revalidatePath(`/admin/tutors/${session.tutor.id}`);

  redirect(
    submitting
      ? "/tutor/onboarding?submitted=1"
      : "/tutor/onboarding?saved=1"
  );
}
