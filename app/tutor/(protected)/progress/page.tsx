import Link from "next/link";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProgressReport } from "@/lib/progress";
import { riskLabel } from "@/lib/progress";
export const dynamic = "force-dynamic";
export const metadata = { title: "Student progress" };
export default async function TutorProgressPage() {
  const auth = await getTutorSession(); if (!auth) return null;
  const supabase = createAdminClient();
  const [{ data: engagements, error }, { data: reports }] = await Promise.all([
    supabase.from("tutoring_engagements").select("id,student_id,subject,title,current_focus,status,students(name,academic_level)").eq("tutor_id", auth.tutor.id).eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("progress_reports").select("*").eq("tutor_id", auth.tutor.id).order("period_end", { ascending: false }).limit(300),
  ]);
  if (error) throw new Error(error.message);
  const latest = new Map<string, ProgressReport>();
  for (const report of (reports || []) as ProgressReport[]) if (!latest.has(report.engagement_id)) latest.set(report.engagement_id, report);
  return <div className="tutor-page"><header className="tutor-page-head"><div><span className="tutor-eyebrow">Learning outcomes</span><h1>Student progress</h1><p>Assess topic mastery and create clear monthly progress reports.</p></div></header>
    <div className="tutor-card-grid">{(engagements || []).map((row: any) => { const report = latest.get(row.id) || null; const label = report ? riskLabel(report) : "No report"; return <article className="tutor-student-card" key={row.id}><div className="tutor-student-card-head"><div><span className="tutor-eyebrow">{row.subject}</span><h2>{row.students?.name || "Student"}</h2><p>{row.students?.academic_level || "Level not recorded"}</p></div><span className={`progress-risk-badge ${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</span></div><dl className="tutor-details"><div><dt>Current focus</dt><dd>{row.current_focus || row.title}</dd></div><div><dt>Latest progress</dt><dd>{report?.overall_score == null ? "Not reported" : `${report.overall_score}%`}</dd></div><div><dt>Attendance</dt><dd>{report?.attendance_rate == null ? "—" : `${Math.round(report.attendance_rate)}%`}</dd></div><div><dt>Homework</dt><dd>{report?.homework_completion_rate == null ? "—" : `${Math.round(report.homework_completion_rate)}%`}</dd></div></dl><Link className="tutor-primary-link" href={`/tutor/progress/${row.id}`}>Manage progress →</Link></article>; })}{!(engagements || []).length && <div className="tutor-panel tutor-empty">No active students are assigned to you.</div>}</div>
  </div>;
}
