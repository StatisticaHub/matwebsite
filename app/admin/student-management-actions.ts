"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const studentStatuses = ["active", "inactive", "prospect"] as const;
type StudentStatus = (typeof studentStatuses)[number];

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function text(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function nullableText(formData: FormData, key: string, max = 5000) {
  const value = text(formData, key, max);
  return value || null;
}

export async function acknowledgeStudentCommunicationFailure(
  formData: FormData,
) {
  const { session, supabase } = await adminContext();

  const studentId = text(formData, "studentId", 100);
  const communicationId = text(formData, "communicationId", 100);
  const note = nullableText(formData, "acknowledgementNote", 1000);

  if (!studentId || !communicationId) return;

  const { data, error } = await supabase
    .from("student_communications")
    .update({
      failure_acknowledged_at: new Date().toISOString(),
      failure_acknowledged_by_email: session.user.email || null,
      failure_acknowledgement_note: note,
    })
    .eq("id", communicationId)
    .eq("student_id", studentId)
    .eq("status", "failed")
    .is("failure_acknowledged_at", null)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    throw new Error(
      "This communication failure was not found or has already been acknowledged.",
    );
  }

  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath("/admin/system-health");
}

export async function updateStudentProfile(formData: FormData) {
  const { supabase } = await adminContext();
  const studentId = text(formData, "studentId", 100);
  const name = text(formData, "name", 300);
  const email = text(formData, "email", 500).toLowerCase();
  const status = text(formData, "status", 40) as StudentStatus;

  if (!studentId || !name || !email || !studentStatuses.includes(status)) return;

  const { error } = await supabase
    .from("students")
    .update({
      name,
      email,
      phone: nullableText(formData, "phone", 100),
      country: nullableText(formData, "country", 200),
      academic_level: nullableText(formData, "academicLevel", 300),
      institution: nullableText(formData, "institution", 500),
      programme: nullableText(formData, "programme", 500),
      curriculum: nullableText(formData, "curriculum", 500),
      status,
      notes: nullableText(formData, "notes", 5000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", studentId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/students/${studentId}/edit`);
  revalidatePath("/admin/analytics");
  redirect(`/admin/students/${studentId}`);
}

export async function archiveStudent(formData: FormData) {
  const { supabase } = await adminContext();
  const studentId = text(formData, "studentId", 100);
  if (!studentId) return;

  const { error } = await supabase
    .from("students")
    .update({ status: "inactive", updated_at: new Date().toISOString() })
    .eq("id", studentId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/students");
  revalidatePath(`/admin/students/${studentId}`);
  revalidatePath(`/admin/students/${studentId}/edit`);
  revalidatePath("/admin/analytics");
  redirect(`/admin/students/${studentId}`);
}

export async function deleteStudentSafely(formData: FormData) {
  const { supabase } = await adminContext();
  const studentId = text(formData, "studentId", 100);
  const confirmation = text(formData, "confirmation", 300);
  if (!studentId) return;

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id,name")
    .eq("id", studentId)
    .single();

  if (studentError || !student) throw new Error(studentError?.message || "Student not found.");
  if (confirmation !== student.name) {
    throw new Error("Student name confirmation did not match. Nothing was deleted.");
  }

  const [
    engagements,
    communications,
    portalLinks,
    supportRequests,
    submissions,
    intakeLinks,
    onboarding,
  ] = await Promise.all([
    supabase.from("tutoring_engagements").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("student_communications").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("student_portal_links").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("student_support_requests").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("homework_submissions").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("student_intake_links").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("student_onboarding").select("status,intake_completed_at,reviewed_at").eq("student_id", studentId).maybeSingle(),
  ]);

  const queryError = [engagements, communications, portalLinks, supportRequests, submissions, intakeLinks, onboarding]
    .map((result) => result.error)
    .find(Boolean);
  if (queryError) throw new Error(queryError.message);

  const onboardingHasHistory = Boolean(
    onboarding.data &&
      (onboarding.data.status !== "awaiting_intake" || onboarding.data.intake_completed_at || onboarding.data.reviewed_at)
  );

  const linkedHistory =
    (engagements.count || 0) +
    (communications.count || 0) +
    (portalLinks.count || 0) +
    (supportRequests.count || 0) +
    (submissions.count || 0) +
    (intakeLinks.count || 0) +
    (onboardingHasHistory ? 1 : 0);

  if (linkedHistory > 0) {
    throw new Error(
      "This student has tutoring, communication, onboarding or portal history. Archive the student instead of deleting the record."
    );
  }

  const { error: deleteError } = await supabase.from("students").delete().eq("id", studentId);
  if (deleteError) throw new Error(deleteError.message);

  revalidatePath("/admin/students");
  revalidatePath("/admin/analytics");
  redirect("/admin/students");
}
