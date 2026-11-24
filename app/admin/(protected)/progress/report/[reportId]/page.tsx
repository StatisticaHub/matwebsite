import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import ProgressReportView from "@/components/ProgressReportView";
import PrintButton from "@/components/PrintButton";
import type { ProgressReport } from "@/lib/progress";
export const dynamic = "force-dynamic";
type Params = Promise<{ reportId: string }>;
export default async function AdminProgressReportPage({ params }: { params: Params }) {
  const { reportId } = await params; const supabase = createAdminClient();
  const { data: report, error } = await supabase.from("progress_reports").select("*").eq("id", reportId).single();
  if (error || !report) notFound();
  const [{ data: engagement }, { data: plan }] = await Promise.all([
    supabase.from("tutoring_engagements").select("id,subject,students(name),tutors(name)").eq("id", report.engagement_id).single(),
    supabase.from("learning_plan_items").select("id,engagement_id,topic,objective,priority,progress_status,mastery_percent,last_assessed_at,strength_note,next_step").eq("engagement_id", report.engagement_id).order("sort_order"),
  ]);
  return <div className="progress-print-page"><div className="progress-print-toolbar"><Link href={`/admin/progress/${report.engagement_id}`}>← Back</Link><PrintButton/></div><ProgressReportView report={report as ProgressReport} studentName={(engagement as any)?.students?.name || "Student"} subject={(engagement as any)?.subject || "Tutoring"} tutorName={(engagement as any)?.tutors?.name || null}/></div>;
}
