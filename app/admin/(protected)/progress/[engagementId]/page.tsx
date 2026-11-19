import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { currentMonthRange, masteryLabel, topicMastery, type ProgressPlanItem, type ProgressReport } from "@/lib/progress";
import { updateAdminTopicProgress, generateAdminProgressReport } from "@/app/admin/progress-actions";
import { progressStatusLabels, progressStatuses } from "@/lib/delivery-data";

export const dynamic = "force-dynamic";
type Params = Promise<{ engagementId: string }>;

export default async function AdminStudentProgressPage({ params }: { params: Params }) {
  const { engagementId } = await params;
  const supabase = createAdminClient();
  const [{ data: engagement, error }, { data: plan }, { data: reports }] = await Promise.all([
    supabase.from("tutoring_engagements").select("id,student_id,tutor_id,subject,title,current_focus,students(id,name,email,academic_level),tutors(name)").eq("id", engagementId).single(),
    supabase.from("learning_plan_items").select("id,engagement_id,topic,objective,priority,progress_status,mastery_percent,last_assessed_at,strength_note,next_step").eq("engagement_id", engagementId).order("sort_order").order("created_at"),
    supabase.from("progress_reports").select("*").eq("engagement_id", engagementId).order("period_end", { ascending: false }),
  ]);
  if (error || !engagement) notFound();
  const topics = (plan || []) as ProgressPlanItem[];
  const history = (reports || []) as ProgressReport[];
  const month = currentMonthRange();
  const student = (engagement as any).students;
  return <div className="admin-page">
    <div className="admin-breadcrumb"><Link href="/admin/progress">← Progress</Link><span>{student?.name || "Student"}</span></div>
    <div className="admin-page-header"><div><span className="admin-eyebrow">{engagement.subject}</span><h1>{student?.name || "Student"}</h1><p>{engagement.current_focus || engagement.title} · Tutor: {(engagement as any).tutors?.name || "Unassigned"}</p></div></div>
    <div className="progress-management-grid">
      <section className="admin-card"><div className="admin-card-header"><div><h2>Topic mastery</h2><p>Keep the learning plan current after sessions or assessments.</p></div></div>
        <div className="progress-topic-editor-list">{topics.map((topic) => { const mastery = topicMastery(topic); return <form action={updateAdminTopicProgress} key={topic.id} className="progress-topic-editor">
          <input type="hidden" name="itemId" value={topic.id}/><input type="hidden" name="engagementId" value={engagementId}/>
          <div className="progress-topic-editor-head"><div><strong>{topic.topic}</strong><small>{topic.objective || `${topic.priority} priority`}</small></div><span>{mastery}% · {masteryLabel(mastery)}</span></div>
          <div className="progress-mini-bar"><i style={{ width: `${mastery}%` }} /></div>
          <div className="admin-form-grid"><label><span>Status</span><select name="progressStatus" defaultValue={topic.progress_status}>{progressStatuses.map((status) => <option key={status} value={status}>{progressStatusLabels[status]}</option>)}</select></label><label><span>Mastery %</span><input name="masteryPercent" type="number" min="0" max="100" defaultValue={topic.mastery_percent ?? mastery}/></label></div>
          <label><span>Strength / evidence</span><textarea name="strengthNote" defaultValue={topic.strength_note || ""}/></label><label><span>Next step</span><textarea name="nextStep" defaultValue={topic.next_step || ""}/></label>
          <button className="admin-secondary-button" type="submit">Save topic assessment</button>
        </form>;})}{!topics.length && <div className="admin-empty">Add learning-plan topics on the student record first.</div>}</div>
      </section>
      <aside className="admin-stack"><section className="admin-card"><div className="admin-card-header"><div><h2>Create monthly report</h2><p>Metrics are calculated from sessions, homework and topic mastery.</p></div></div>
        <form action={generateAdminProgressReport} className="admin-form progress-report-form"><input type="hidden" name="engagementId" value={engagementId}/><div className="admin-form-grid"><label><span>Period start</span><input name="periodStart" type="date" defaultValue={month.start} required/></label><label><span>Period end</span><input name="periodEnd" type="date" defaultValue={month.end} required/></label></div><label><span>Report title</span><input name="title" defaultValue={`${engagement.subject} progress report`}/></label><label><span>Summary</span><textarea name="summary" placeholder="Overall progress during this period…"/></label><label><span>Strengths</span><textarea name="strengths" placeholder="What is going particularly well?"/></label><label><span>Areas to develop</span><textarea name="areasForImprovement" placeholder="Where does the student need more practice?"/></label><label><span>Next focus</span><textarea name="nextFocus" defaultValue={engagement.current_focus || ""}/></label><label><span>Tutor comment</span><textarea name="tutorComment"/></label><label className="admin-check"><input type="checkbox" name="studentVisible" defaultChecked/><span>Show in student portal</span></label><label className="admin-check"><input type="checkbox" name="emailStudent"/><span>Email report summary to student</span></label><button className="admin-primary-button" type="submit">Generate progress report</button></form>
      </section></aside>
    </div>
    <section className="admin-card"><div className="admin-card-header"><div><h2>Report history</h2><p>Saved monthly snapshots remain available even as live metrics change.</p></div></div><div className="progress-report-history">{history.map((report) => <article key={report.id}><div><strong>{report.title}</strong><small>{report.period_start} → {report.period_end}</small></div><span>{report.overall_score == null ? "—" : `${report.overall_score}%`}</span><Link href={`/admin/progress/report/${report.id}`}>Open report →</Link></article>)}{!history.length && <div className="admin-empty">No progress reports have been created yet.</div>}</div></section>
  </div>;
}
