"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTutorReferenceRequestEmail } from "@/lib/email/tutor";

async function adminContext() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return {
    session,
    supabase: createAdminClient(),
  };
}

function value(formData: FormData, key: string, max = 5000) {
  return String(formData.get(key) || "")
    .trim()
    .slice(0, max);
}

export async function reviewTutorApplication(
  formData: FormData,
) {
  const { session, supabase } = await adminContext();

  const applicationId = value(
    formData,
    "applicationId",
    100,
  );

  const decision = value(formData, "decision", 30);

  if (
    !applicationId ||
    !["reviewing", "rejected"].includes(decision)
  ) {
    return;
  }

  const { error } = await supabase
    .from("tutor_applications")
    .update({
      status: decision,
      admin_notes:
        value(formData, "adminNotes", 5000) || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .neq("status", "converted");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tutor-applications");

  redirect(
    `/admin/tutor-applications?application=${encodeURIComponent(
      applicationId,
    )}&saved=1`,
  );
}


export async function sendTutorReferenceRequest(
  formData: FormData,
) {
  const { supabase } = await adminContext();

  const referenceId = value(formData, "referenceId", 100);
  const applicationId = value(
    formData,
    "applicationId",
    100,
  );

  if (!referenceId || !applicationId) return;

  const { data: reference, error: referenceError } =
    await supabase
      .from("tutor_application_references")
      .select(
        "id,name,email,status,request_token,application_id",
      )
      .eq("id", referenceId)
      .eq("application_id", applicationId)
      .single();

  if (referenceError || !reference) {
    throw new Error(
      referenceError?.message || "Reference not found.",
    );
  }

  if (reference.status === "verified") {
    redirect(
      `/admin/tutor-applications?application=${applicationId}`,
    );
  }

  const { data: application, error: applicationError } =
    await supabase
      .from("tutor_applications")
      .select("id,name,reference")
      .eq("id", applicationId)
      .single();

  if (applicationError || !application) {
    throw new Error(
      applicationError?.message || "Application not found.",
    );
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.myacademictutor.com"
  ).replace(/\/$/, "");

  const responseUrl =
    `${siteUrl}/tutor-reference/${reference.request_token}`;

  const result = await sendTutorReferenceRequestEmail({
    refereeName: reference.name,
    refereeEmail: reference.email,
    applicantName: application.name,
    applicationReference: application.reference,
    responseUrl,
  });

  if (!result.ok) {
    throw new Error(
      result.error || "Reference request email could not be sent.",
    );
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("tutor_application_references")
    .update({
      status:
        reference.status === "responded"
          ? "responded"
          : "contacted",
      request_sent_at: now,
      contacted_at:
        reference.status === "responded"
          ? undefined
          : now,
      updated_at: now,
    })
    .eq("id", referenceId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath("/admin/tutor-applications");

  redirect(
    `/admin/tutor-applications?application=${applicationId}&reference=sent`,
  );
}


export async function updateTutorReferenceStatus(
  formData: FormData,
) {
  const { session, supabase } = await adminContext();

  const referenceId = value(formData, "referenceId", 100);
  const applicationId = value(
    formData,
    "applicationId",
    100,
  );
  const status = value(formData, "status", 30);

  if (
    !referenceId ||
    !applicationId ||
    ![
      "provided",
      "contacted",
      "verified",
      "unresponsive",
      "concern",
    ].includes(status)
  ) {
    return;
  }

  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    status,
    admin_notes:
      value(formData, "adminNotes", 3000) || null,
    updated_at: now,
  };

  if (status === "contacted") {
    update.contacted_at = now;
  }

  if (status === "verified") {
    update.verified_at = now;
    update.contacted_at = now;
  }

  const { error } = await supabase
    .from("tutor_application_references")
    .update(update)
    .eq("id", referenceId)
    .eq("application_id", applicationId);

  if (error) throw new Error(error.message);

  await supabase
    .from("tutor_applications")
    .update({
      reviewed_by: session.user.id,
      reviewed_at: now,
      updated_at: now,
    })
    .eq("id", applicationId);

  revalidatePath("/admin/tutor-applications");

  redirect(
    `/admin/tutor-applications?application=${encodeURIComponent(
      applicationId,
    )}&saved=1`,
  );
}

export async function updateTutorDocumentStatus(
  formData: FormData,
) {
  const { session, supabase } = await adminContext();

  const documentId = value(formData, "documentId", 100);
  const applicationId = value(
    formData,
    "applicationId",
    100,
  );
  const status = value(formData, "status", 30);

  if (
    !documentId ||
    !applicationId ||
    !["submitted", "verified", "rejected"].includes(status)
  ) {
    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tutor_application_documents")
    .update({
      verification_status: status,
      admin_notes:
        value(formData, "adminNotes", 3000) || null,
      verified_at: status === "verified" ? now : null,
      verified_by:
        status === "verified" ? session.user.id : null,
    })
    .eq("id", documentId)
    .eq("application_id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/tutor-applications");

  redirect(
    `/admin/tutor-applications?application=${encodeURIComponent(
      applicationId,
    )}&saved=1`,
  );
}

export async function convertTutorApplication(
  formData: FormData,
) {
  const { session, supabase } = await adminContext();

  const applicationId = value(
    formData,
    "applicationId",
    100,
  );

  if (!applicationId) return;

  const [
    applicationResult,
    referencesResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from("tutor_applications")
      .select("*")
      .eq("id", applicationId)
      .single(),

    supabase
      .from("tutor_application_references")
      .select("*")
      .eq("application_id", applicationId),

    supabase
      .from("tutor_application_documents")
      .select("*")
      .eq("application_id", applicationId),
  ]);

  if (applicationResult.error || !applicationResult.data) {
    throw new Error(
      applicationResult.error?.message ||
        "Application not found.",
    );
  }

  if (referencesResult.error) {
    throw new Error(referencesResult.error.message);
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message);
  }

  const application = applicationResult.data;

  if (application.status === "converted") {
    if (application.converted_tutor_id) {
      redirect(
        `/admin/tutors/${application.converted_tutor_id}`,
      );
    }

    return;
  }

  if (application.status === "rejected") {
    redirect(
      `/admin/tutor-applications?application=${applicationId}&error=rejected`,
    );
  }

  const references = referencesResult.data || [];
  const documents = documentsResult.data || [];

  const verifiedReferences = references.filter(
    (item) => item.status === "verified",
  );

  const verifiedCertificate = documents.some(
    (item) =>
      item.document_type === "degree_certificate" &&
      item.verification_status === "verified",
  );

  const demoComplete =
    Boolean(application.demo_subject) &&
    Boolean(application.demo_level) &&
    Boolean(application.demo_topic) &&
    Boolean(application.demo_video_url);

  const ready =
    verifiedReferences.length >= 2 &&
    verifiedCertificate &&
    demoComplete &&
    application.academic_integrity_confirmed === true;

  if (!ready) {
    redirect(
      `/admin/tutor-applications?application=${applicationId}&error=requirements`,
    );
  }

  const { data: existingTutor, error: existingTutorError } =
    await supabase
      .from("tutors")
      .select("id")
      .eq("email", application.email)
      .limit(1)
      .maybeSingle();

  if (existingTutorError) {
    throw new Error(existingTutorError.message);
  }

  if (existingTutor) {
    redirect(
      `/admin/tutor-applications?application=${applicationId}&error=duplicate`,
    );
  }

  const { data: tutor, error: tutorError } = await supabase
    .from("tutors")
    .insert({
      name: application.name,
      email: application.email,

      headline: null,

      subjects: application.subjects || [],
      levels: application.levels || [],
      specialisms: application.specialisms || [],

      qualifications: application.qualifications || null,
      teaching_experience:
        application.teaching_experience || null,
      languages: application.languages || [],

      timezone: application.timezone || null,
      availability_notes: application.availability || null,

      availability_days: [],
      availability_periods: [],

      weekly_capacity_hours: null,
      max_active_students: null,

      accepts_trials: true,

      currency: "GBP",
      hourly_rate: null,

      status: "pending",
      verified: false,

      portal_enabled: false,

      onboarding_status: "not_started",
      onboarding_submitted_at: null,
      onboarding_updated_at: null,

      verification_notes:
        `Created from tutor application ${application.reference}.`,
    })
    .select("id")
    .single();

  if (tutorError || !tutor) {
    throw new Error(
      tutorError?.message || "Could not create tutor record.",
    );
  }

  const now = new Date().toISOString();

  const { error: applicationUpdateError } = await supabase
    .from("tutor_applications")
    .update({
      status: "converted",
      converted_tutor_id: tutor.id,
      converted_at: now,
      reviewed_at: now,
      reviewed_by: session.user.id,
      updated_at: now,
    })
    .eq("id", applicationId);

  if (applicationUpdateError) {
    await supabase
      .from("tutors")
      .delete()
      .eq("id", tutor.id);

    throw new Error(applicationUpdateError.message);
  }

  revalidatePath("/admin/tutor-applications");
  revalidatePath("/admin/tutors");

  redirect(
    `/admin/tutors/${tutor.id}?from_application=1`,
  );
}
