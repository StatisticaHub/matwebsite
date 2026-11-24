"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { leadStatuses, type LeadStatus } from "@/lib/admin-data";
import { createAdminClient } from "@/lib/supabase/admin";

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

export async function updateLeadStatus(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = String(formData.get("leadId") || "");
  const status = String(formData.get("status") || "") as LeadStatus;
  if (!leadId || !leadStatuses.includes(status)) return;

  const update: Record<string, string | null> = { status, updated_at: new Date().toISOString() };
  if (status === "contacted") update.last_contacted_at = new Date().toISOString();

  const { error } = await supabase.from("tutoring_leads").update(update).eq("id", leadId);
  if (error) throw new Error(error.message);

  await supabase.from("lead_activity").insert({
    lead_id: leadId,
    event_type: "status_changed",
    note: `Status changed to ${status}.`,
    created_by: session.user.id,
    created_by_email: session.user.email || null,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function updateLeadAssignment(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = String(formData.get("leadId") || "");
  const tutorId = String(formData.get("tutorId") || "") || null;
  const rateRaw = String(formData.get("quotedRate") || "").trim();
  const currency = String(formData.get("currency") || "GBP").slice(0, 3).toUpperCase();
  const quotedRate = rateRaw ? Number(rateRaw) : null;

  if (!leadId || (quotedRate !== null && (!Number.isFinite(quotedRate) || quotedRate < 0))) return;

  const status = tutorId ? "tutor_assigned" : "matching";
  const { error } = await supabase
    .from("tutoring_leads")
    .update({
      assigned_tutor_id: tutorId,
      quoted_rate: quotedRate,
      currency,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  await supabase.from("lead_activity").insert({
    lead_id: leadId,
    event_type: "tutor_assignment",
    note: tutorId ? "Tutor assigned to lead." : "Tutor assignment cleared.",
    created_by: session.user.id,
    created_by_email: session.user.email || null,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${leadId}`);
}

export async function saveLeadNotes(formData: FormData) {
  const { session, supabase } = await adminContext();
  const leadId = String(formData.get("leadId") || "");
  const note = String(formData.get("note") || "").trim().slice(0, 5000);
  if (!leadId || !note) return;

  const { error } = await supabase.from("lead_activity").insert({
    lead_id: leadId,
    event_type: "note",
    note,
    created_by: session.user.id,
    created_by_email: session.user.email || null,
  });
  if (error) throw new Error(error.message);

  await supabase
    .from("tutoring_leads")
    .update({ internal_notes: note, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath(`/admin/leads/${leadId}`);
}

export async function createTutor(formData: FormData) {
  const { supabase } = await adminContext();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!name || !email) return;

  const subjects = String(formData.get("subjects") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const levels = String(formData.get("levels") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const specialisms = String(formData.get("specialisms") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const languages = String(formData.get("languages") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const rateRaw = String(formData.get("hourlyRate") || "").trim();
  const hourlyRate = rateRaw ? Number(rateRaw) : null;
  const weeklyCapacityRaw = String(formData.get("weeklyCapacityHours") || "").trim();
  const weeklyCapacityHours = weeklyCapacityRaw ? Number(weeklyCapacityRaw) : null;
  const maxStudentsRaw = String(formData.get("maxActiveStudents") || "").trim();
  const maxActiveStudents = maxStudentsRaw ? Number(maxStudentsRaw) : null;
  const availabilityDays = formData.getAll("availabilityDays").map((value) => String(value)).filter(Boolean);
  const availabilityPeriods = formData.getAll("availabilityPeriods").map((value) => String(value)).filter(Boolean);
  const acceptsTrials = formData.get("acceptsTrials") === "yes";
  const verified =
    formData.get("verified") === "yes";

  const { error } = await supabase.from("tutors").insert({
    name,
    email,
    headline: String(formData.get("headline") || "").trim() || null,
    subjects,
    levels,
    specialisms,
    qualifications:
      String(formData.get("qualifications") || "").trim().slice(0, 5000) || null,
    teaching_experience:
      String(formData.get("teachingExperience") || "").trim().slice(0, 5000) || null,
    languages,
    verification_notes:
      String(formData.get("verificationNotes") || "").trim().slice(0, 5000) || null,
    timezone: String(formData.get("timezone") || "").trim() || null,
    hourly_rate: hourlyRate,
    currency: String(formData.get("currency") || "GBP").slice(0, 3).toUpperCase(),
    availability_notes: String(formData.get("availability") || "").trim() || null,
    availability_days: availabilityDays,
    availability_periods: availabilityPeriods,
    weekly_capacity_hours: weeklyCapacityHours,
    max_active_students: maxActiveStudents,
    accepts_trials: acceptsTrials,
    status: "pending",
    verified: false,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tutors");
}

export async function toggleTutorStatus(formData: FormData) {
  const { supabase } = await adminContext();

  const tutorId = String(formData.get("tutorId") || "");
  const nextStatus = String(formData.get("nextStatus") || "inactive");

  if (
    !tutorId ||
    !["active", "inactive", "pending"].includes(nextStatus)
  ) {
    return;
  }

  const { data: tutor, error: tutorError } = await supabase
    .from("tutors")
    .select("id,onboarding_status")
    .eq("id", tutorId)
    .maybeSingle();

  if (tutorError) throw new Error(tutorError.message);
  if (!tutor) return;

  // Pending onboarding records must be reviewed from the tutor
  // detail page before they can become active.
  if (
    nextStatus === "active" &&
    tutor.onboarding_status !== "approved"
  ) {
    revalidatePath("/admin/tutors");
    return;
  }

  const { error } = await supabase
    .from("tutors")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tutorId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tutors");
  revalidatePath(`/admin/tutors/${tutorId}`);
}

// MAT tutor management upgrade
export async function updateTutor(formData: FormData) {
  const { supabase } = await adminContext();
  const tutorId = String(formData.get("tutorId") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const status = String(formData.get("status") || "active");
  const rateRaw = String(formData.get("hourlyRate") || "").trim();
  const hourlyRate = rateRaw ? Number(rateRaw) : null;
  const weeklyCapacityRaw = String(formData.get("weeklyCapacityHours") || "").trim();
  const weeklyCapacityHours = weeklyCapacityRaw ? Number(weeklyCapacityRaw) : null;
  const maxStudentsRaw = String(formData.get("maxActiveStudents") || "").trim();
  const maxActiveStudents = maxStudentsRaw ? Number(maxStudentsRaw) : null;
  const availabilityDays = formData.getAll("availabilityDays").map((value) => String(value)).filter(Boolean);
  const availabilityPeriods = formData.getAll("availabilityPeriods").map((value) => String(value)).filter(Boolean);
  const acceptsTrials = formData.get("acceptsTrials") === "yes";
  const verified =
    formData.get("verified") === "yes";

  if (!tutorId || !name || !email) return;
  if (!["active", "inactive", "pending"].includes(status)) return;
  if (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0)) return;
  if (weeklyCapacityHours !== null && (!Number.isFinite(weeklyCapacityHours) || weeklyCapacityHours < 0 || weeklyCapacityHours > 80)) return;
  if (maxActiveStudents !== null && (!Number.isFinite(maxActiveStudents) || maxActiveStudents < 0 || maxActiveStudents > 100)) return;

  const {
    data: currentTutor,
    error: currentTutorError,
  } = await supabase
    .from("tutors")
    .select("status,onboarding_status")
    .eq("id", tutorId)
    .single();

  if (currentTutorError || !currentTutor) {
    throw new Error(
      currentTutorError?.message ||
        "Tutor record could not be loaded.",
    );
  }

  const activatingTutor =
    currentTutor.status === "pending" &&
    status === "active";

  if (
    activatingTutor &&
    !["submitted", "approved"].includes(
      String(currentTutor.onboarding_status || ""),
    )
  ) {
    redirect(
      `/admin/tutors/${tutorId}?activation=onboarding`,
    );
  }

  if (activatingTutor && !verified) {
    redirect(
      `/admin/tutors/${tutorId}?activation=verification`,
    );
  }

  const subjects = String(formData.get("subjects") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const levels = String(formData.get("levels") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const specialisms = String(formData.get("specialisms") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const languages = String(formData.get("languages") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from("tutors")
    .update({
      name,
      email,
      headline: String(formData.get("headline") || "").trim() || null,
      subjects,
      levels,
      specialisms,
      qualifications:
        String(formData.get("qualifications") || "").trim().slice(0, 5000) || null,
      teaching_experience:
        String(formData.get("teachingExperience") || "").trim().slice(0, 5000) || null,
      languages,
      verification_notes:
        String(formData.get("verificationNotes") || "").trim().slice(0, 5000) || null,
      timezone: String(formData.get("timezone") || "").trim() || null,
      hourly_rate: hourlyRate,
      currency: String(formData.get("currency") || "GBP").slice(0, 3).toUpperCase(),
      availability_notes: String(formData.get("availability") || "").trim() || null,
    availability_days: availabilityDays,
    availability_periods: availabilityPeriods,
    weekly_capacity_hours: weeklyCapacityHours,
    max_active_students: maxActiveStudents,
    accepts_trials: acceptsTrials,
      status,
      ...(status === "active"
        ? {
            onboarding_status: "approved",
            onboarding_updated_at: new Date().toISOString(),
          }
        : {}),
      verified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tutorId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tutors");
  revalidatePath(`/admin/tutors/${tutorId}`);
  redirect(`/admin/tutors/${tutorId}?updated=1`);
}

export async function deleteTutor(formData: FormData) {
  const { supabase } = await adminContext();
  const tutorId = String(formData.get("tutorId") || "");
  const confirmName = String(formData.get("confirmName") || "").trim();
  if (!tutorId) return;

  const { data: tutor, error: tutorError } = await supabase
    .from("tutors")
    .select("id,name")
    .eq("id", tutorId)
    .maybeSingle();

  if (tutorError) throw new Error(tutorError.message);
  if (!tutor) redirect("/admin/tutors");

  if (confirmName !== tutor.name) {
    redirect(`/admin/tutors/${tutorId}?delete=name_mismatch`);
  }

  const [leadsResult, engagementsResult, sessionsResult] = await Promise.all([
    supabase.from("tutoring_leads").select("id", { count: "exact", head: true }).eq("assigned_tutor_id", tutorId),
    supabase.from("tutoring_engagements").select("id", { count: "exact", head: true }).eq("tutor_id", tutorId),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }).eq("tutor_id", tutorId),
  ]);

  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (engagementsResult.error) throw new Error(engagementsResult.error.message);
  if (sessionsResult.error) throw new Error(sessionsResult.error.message);

  const linkedCount = (leadsResult.count || 0) + (engagementsResult.count || 0) + (sessionsResult.count || 0);
  if (linkedCount > 0) {
    redirect(`/admin/tutors/${tutorId}?delete=linked`);
  }

  const { error } = await supabase.from("tutors").delete().eq("id", tutorId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/tutors");
  redirect("/admin/tutors?deleted=1");
}

