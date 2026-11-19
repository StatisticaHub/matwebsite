import Link from "next/link";
import { notFound } from "next/navigation";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import ProgressReportView from "@/components/ProgressReportView";
import PrintButton from "@/components/PrintButton";
import type { ProgressPlanItem, ProgressReport } from "@/lib/progress";
export const dynamic = "force-dynamic";
type Params = Promise<{ reportId: string }>;
export default async function TutorProgressReportPage({ params }: { params: Params }) {
  const auth = await getTutorSession(); if (!auth) return null; const { reportId } = await params; const supabase = createAdminClient();
  const { data: report, error } = await supabase.from("progress_reports").select("*").eq("id", reportId).eq("tutor_id", auth.tutor.id).maybeSingle();
  if (error || !report) notFound();
  const [{ data: engagement }, { data: plan }] = await Promise.all([
    supabase.from("tutoring_engagements").select("id,subject,students(name)").eq("id", report.engagement_id).eq("tutor_id", auth.tutor.id).single(),
    supabase.from("learning_plan_items").select("id,engagement_id,topic,objective,priority,progress_status,mastery_percent,last_assessed_at,strength_note,next_step").eq("engagement_id", report.engagement_id).order("sort_order"),
  ]);
  return <div className="progress-print-page"><div className="progress-print-toolbar"><Link href={`/tutor/progress/${report.engagement_id}`}>← Back</Link><PrintButton/></div><ProgressReportView report={report as ProgressReport} studentName={(engagement as any)?.students?.name || "Student"} subject={(engagement as any)?.subject || "Tutoring"} tutorName={auth.tutor.name} topics={(plan || []) as ProgressPlanItem[]}/></div>;
}
