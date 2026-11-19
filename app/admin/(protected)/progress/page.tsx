import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProgressReport } from "@/lib/progress";
import { riskLabel } from "@/lib/progress";

export const dynamic = "force-dynamic";

export default async function AdminProgressPage() {
  const supabase = createAdminClient();
  const [{ data: engagements, error }, { data: reports }] = await Promise.all([
    supabase.from("tutoring_engagements")
      .select("id,student_id,tutor_id,subject,title,status,current_focus,students(name,academic_level),tutors(name)")
      .eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("progress_reports").select("*").order("period_end", { ascending: false }).limit(500),
  ]);
  if (error) throw new Error(error.message);
  const rows = (engagements || []) as any[];
  const allReports = (reports || []) as ProgressReport[];
  const latestByEngagement = new Map<string, ProgressReport>();
  for (const report of allReports) if (!latestByEngagement.has(report.engagement_id)) latestByEngagement.set(report.engagement_id, report);
  const needsAttention = [...latestByEngagement.values()].filter((item) => riskLabel(item) === "Needs attention").length;
  const withoutReport = rows.filter((row) => !latestByEngagement.has(row.id)).length;

  return <div className="admin-page">
    <div className="admin-page-header"><div><span className="admin-eyebrow">Learning outcomes</span><h1>Student progress</h1><p>Track topic mastery, attendance, homework completion and monthly tutoring reports.</p></div></div>
    <section className="admin-stat-grid progress-stat-grid">
      <article><span>Active students</span><strong>{rows.length}</strong><small>Current engagements</small></article>
      <article><span>Needs attention</span><strong>{needsAttention}</strong><small>Based on latest report</small></article>
      <article><span>No report yet</span><strong>{withoutReport}</strong><small>Active engagements</small></article>
      <article><span>Reports created</span><strong>{allReports.length}</strong><small>Monthly snapshots</small></article>
    </section>
    <section className="admin-card"><div className="admin-card-header"><div><h2>Progress queue</h2><p>Open a student to assess topics or generate the next report.</p></div></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Student</th><th>Subject</th><th>Tutor</th><th>Latest score</th><th>Status</th><th>Report period</th><th></th></tr></thead><tbody>{rows.map((row) => {
        const report = latestByEngagement.get(row.id) || null;
        const label = report ? riskLabel(report) : "No report";
        return <tr key={row.id}><td><strong>{row.students?.name || "Student"}</strong><small>{row.students?.academic_level || ""}</small></td><td>{row.subject}<small>{row.current_focus || row.title}</small></td><td>{row.tutors?.name || "Unassigned"}</td><td>{report?.overall_score == null ? "—" : `${report.overall_score}%`}</td><td><span className={`progress-risk-badge ${label.toLowerCase().replaceAll(" ", "-")}`}>{label}</span></td><td>{report ? `${report.period_start} → ${report.period_end}` : "—"}</td><td><Link className="admin-link-button" href={`/admin/progress/${row.id}`}>Manage →</Link></td></tr>;
      })}</tbody></table>{!rows.length && <div className="admin-empty">No active student engagements yet.</div>}</div>
    </section>
  </div>;
}
