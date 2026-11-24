"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateProgressMetrics, reportPeriodLabel } from "@/lib/progress";
import { sendProgressReportEmail } from "@/lib/email/student";
import { recordStudentCommunication } from "@/lib/student-communications";

async function adminContext() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return { session, supabase: createAdminClient() };
}

function text(formData: FormData, key: string, max = 8000) {
  return String(formData.get(key) || "").trim().slice(0, max);
}
function nullable(formData: FormData, key: string, max = 8000) {
  return text(formData, key, max) || null;
}
function clampMastery(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
}

export async function updateAdminTopicProgress(formData: FormData) {
  const { supabase } = await adminContext();
  const itemId = text(formData, "itemId", 100);
  const engagementId = text(formData, "engagementId", 100);
  if (!itemId || !engagementId) return;
  const statusRaw = text(formData, "progressStatus", 30);
  const progressStatus = ["needs_work", "developing", "comfortable", "mastered"].includes(statusRaw) ? statusRaw : "developing";
  const { error } = await supabase.from("learning_plan_items").update({
    progress_status: progressStatus,
    mastery_percent: clampMastery(text(formData, "masteryPercent", 10)),
    strength_note: nullable(formData, "strengthNote", 2000),
    next_step: nullable(formData, "nextStep", 2000),
    last_assessed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", itemId).eq("engagement_id", engagementId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/progress/${engagementId}`);
}

export async function generateAdminProgressReport(formData: FormData) {
  const { session, supabase } = await adminContext();
  const engagementId = text(formData, "engagementId", 100);
  const periodStart = text(formData, "periodStart", 20);
  const periodEnd = text(formData, "periodEnd", 20);
  if (!engagementId || !periodStart || !periodEnd) return;

  const { data: engagement, error } = await supabase.from("tutoring_engagements")
    .select("id,student_id,tutor_id,subject,title,students(name,email),tutors(name)")
    .eq("id", engagementId).single();
  if (error || !engagement) throw new Error(error?.message || "Engagement not found.");

  const metrics = await calculateProgressMetrics(supabase, engagementId, periodStart, periodEnd);
  const title = nullable(formData, "title", 300) || `${engagement.subject} progress report`;
  const studentVisible =
    formData.get("studentVisible") === "on";

  const emailStudent =
    studentVisible &&
    formData.get("emailStudent") === "on";

  const publishedAt =
    studentVisible
      ? new Date().toISOString()
      : null;
  const payload = {
    student_id: engagement.student_id,
    engagement_id: engagement.id,
    tutor_id: engagement.tutor_id,
    period_start: periodStart,
    period_end: periodEnd,
    title,
    overall_score: metrics.overallScore,
    attendance_rate: metrics.attendanceRate,
    homework_completion_rate: metrics.homeworkCompletionRate,
    average_understanding: metrics.averageUnderstanding,
    topic_mastery_average: metrics.topicMasteryAverage,
    sessions_completed: metrics.sessionsCompleted,
    sessions_missed: metrics.sessionsMissed,
    homework_completed: metrics.homeworkCompleted,
    homework_total: metrics.homeworkTotal,
    summary: nullable(formData, "summary"),
    strengths: nullable(formData, "strengths"),
    areas_for_improvement: nullable(formData, "areasForImprovement"),
    next_focus: nullable(formData, "nextFocus"),
    tutor_comment: nullable(formData, "tutorComment"),
    student_visible: studentVisible,
    published_at: publishedAt,
    created_by: "admin",
    updated_at: new Date().toISOString(),
  };

  const { data: report, error: reportError } = await supabase.from("progress_reports")
    .upsert(payload, { onConflict: "engagement_id,period_start,period_end" })
    .select("*").single();
  if (reportError || !report) throw new Error(reportError?.message || "Could not save progress report.");

  const student = (engagement as any).students;
  if (emailStudent && student?.email) {
    const result = await sendProgressReportEmail({
      reportId: report.id,
      name: student.name,
      email: student.email,
      title: report.title,
      periodLabel: reportPeriodLabel(report.period_start, report.period_end),
      overallScore: report.overall_score,
      attendanceRate: report.attendance_rate,
      homeworkCompletionRate: report.homework_completion_rate,
      averageUnderstanding: report.average_understanding,
      summary: report.summary,
      strengths: report.strengths,
      areasForImprovement: report.areas_for_improvement,
      nextFocus: report.next_focus,
    });
    await recordStudentCommunication({
      studentId: engagement.student_id,
      engagementId: engagement.id,
      type: "progress_report",
      recipient: student.email,
      subject: `${report.title} — My Academic Tutor`,
      result,
      createdByEmail: session.user.email || null,
    });

    if (result.ok) {
      const {
        error: notificationTimestampError,
      } =
        await supabase
          .from("progress_reports")
          .update({
            student_notified_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            report.id,
          );

      if (notificationTimestampError) {
        console.error(
          "Could not record progress report notification:",
          notificationTimestampError.message,
        );
      }
    }
  }

  revalidatePath("/admin/progress");
  revalidatePath(`/admin/progress/${engagementId}`);
  redirect(`/admin/progress/report/${report.id}`);
}
