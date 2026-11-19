"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTestimonialRequestEmail } from "@/lib/email/testimonials";
import { recordStudentCommunication } from "@/lib/student-communications";

async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function text(formData: FormData, key: string, max = 4000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}

function relationOne(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

export async function requestStudentTestimonial(formData: FormData) {
  const { session, supabase } = await requireAdmin();
  const engagementId = text(formData, "engagementId", 100);
  if (!engagementId) redirect("/admin/testimonials?error=Choose+a+student+engagement");

  const { data: engagement, error } = await supabase
    .from("tutoring_engagements")
    .select("id,student_id,tutor_id,subject,students(name,email,academic_level),tutors(name)")
    .eq("id", engagementId)
    .single();
  if (error || !engagement) redirect(`/admin/testimonials?error=${encodeURIComponent(error?.message || "Engagement not found")}`);

  const student = relationOne((engagement as any).students);
  const tutor = relationOne((engagement as any).tutors);
  if (!student?.email) redirect("/admin/testimonials?error=Student+email+is+missing");

  const { data: existing } = await supabase
    .from("testimonials")
    .select("id,request_expires_at")
    .eq("engagement_id", engagementId)
    .eq("status", "requested")
    .gt("request_expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) redirect("/admin/testimonials?existing=1");

  const { data: request, error: insertError } = await supabase
    .from("testimonials")
    .insert({
      student_id: engagement.student_id,
      engagement_id: engagement.id,
      tutor_id: engagement.tutor_id,
      subject: engagement.subject,
      academic_level: student.academic_level || null,
      display_name: null,
      display_context: [student.academic_level, engagement.subject].filter(Boolean).join(" · ") || null,
    })
    .select("id,request_token,request_expires_at")
    .single();
  if (insertError || !request) redirect(`/admin/testimonials?error=${encodeURIComponent(insertError?.message || "Could not create feedback request")}`);

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.myacademictutor.com").replace(/\/$/, "");
  const feedbackUrl = `${base}/feedback/${request.request_token}`;
  const result = await sendTestimonialRequestEmail({
    requestId: request.id,
    name: student.name,
    email: student.email,
    subject: engagement.subject,
    tutorName: tutor?.name || null,
    feedbackUrl,
  });

  if (!result.ok) {
    await supabase.from("testimonials").delete().eq("id", request.id);
    redirect(`/admin/testimonials?error=${encodeURIComponent(result.error || "Could not send feedback request")}`);
  }

  await supabase.from("testimonials").update({ email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", request.id);
  await recordStudentCommunication({
    studentId: engagement.student_id,
    engagementId: engagement.id,
    type: "feedback_request",
    recipient: student.email,
    subject: "How was your tutoring experience? — My Academic Tutor",
    result,
    createdByEmail: session.user.email || null,
  });

  revalidatePath("/admin/testimonials");
  redirect("/admin/testimonials?sent=1");
}

export async function moderateTestimonial(formData: FormData) {
  const { supabase } = await requireAdmin();
  const testimonialId = text(formData, "testimonialId", 100);
  const decision = text(formData, "decision", 30);
  const featured = formData.get("featured") === "on";
  const adminNote = text(formData, "adminNote", 3000) || null;
  if (!testimonialId || !["approve", "reject", "unpublish"].includes(decision)) return;

  const { data: testimonial, error: loadError } = await supabase
    .from("testimonials")
    .select("id,status,consent_to_publish,rating,review_text,subject")
    .eq("id", testimonialId)
    .single();
  if (loadError || !testimonial) redirect(`/admin/testimonials?error=${encodeURIComponent(loadError?.message || "Feedback not found")}`);

  if (decision === "approve") {
    if (!testimonial.consent_to_publish || !testimonial.rating || !testimonial.review_text) {
      redirect("/admin/testimonials?error=Only+complete+feedback+with+publication+consent+can+be+approved");
    }
    const { error } = await supabase.from("testimonials").update({
      status: "approved",
      approved_at: new Date().toISOString(),
      featured,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    }).eq("id", testimonialId);
    if (error) redirect(`/admin/testimonials?error=${encodeURIComponent(error.message)}`);
  } else {
    const nextStatus = decision === "unpublish" ? "submitted" : "rejected";
    const { error } = await supabase.from("testimonials").update({
      status: nextStatus,
      approved_at: null,
      featured: false,
      admin_note: adminNote,
      updated_at: new Date().toISOString(),
    }).eq("id", testimonialId);
    if (error) redirect(`/admin/testimonials?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/testimonials");
  revalidatePath("/tutors");
  revalidatePath("/");
  if (testimonial.subject) revalidatePath(`/subjects/${String(testimonial.subject).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`);
  redirect("/admin/testimonials?saved=1");
}
