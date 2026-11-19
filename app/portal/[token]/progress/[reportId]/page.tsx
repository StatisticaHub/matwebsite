import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolvePortalLink } from "@/lib/student-portal";
import ProgressReportView from "@/components/ProgressReportView";
import PrintButton from "@/components/PrintButton";
import type { ProgressPlanItem, ProgressReport } from "@/lib/progress";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Progress report", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };
type Params = Promise<{ token: string; reportId: string }>;
export default async function StudentPrintableProgressPage({ params }: { params: Params }) {
  const { token, reportId } = await params; const link = await resolvePortalLink(token); if (!link) notFound();
  const supabase = createAdminClient();
  const { data: report, error } = await supabase.from("progress_reports").select("*").eq("id", reportId).eq("student_id", link.student_id).eq("student_visible", true).maybeSingle();
  if (error || !report) notFound();
  const [{ data: engagement }, { data: plan }] = await Promise.all([
    supabase.from("tutoring_engagements").select("id,subject,tutor_id,students(name),tutors(name)").eq("id", report.engagement_id).eq("student_id", link.student_id).single(),
    supabase.from("learning_plan_items").select("id,engagement_id,topic,objective,priority,progress_status,mastery_percent,last_assessed_at,strength_note,next_step").eq("engagement_id", report.engagement_id).order("sort_order"),
  ]);
  return <div className="progress-print-page student-progress-print"><div className="progress-print-toolbar"><Link href={`/portal/${token}#progress`}>← Back to portal</Link><PrintButton/></div><ProgressReportView report={report as ProgressReport} studentName={(engagement as any)?.students?.name || "Student"} subject={(engagement as any)?.subject || "Tutoring"} tutorName={(engagement as any)?.tutors?.name || null} topics={(plan || []) as ProgressPlanItem[]}/></div>;
}
