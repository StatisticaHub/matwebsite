import Link from "next/link";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatRetentionDateTime, retentionRiskLabels, type RetentionCase } from "@/lib/retention";
import { logTutorRetentionOutreach, reviewTutorRetentionCase } from "@/app/tutor/retention-actions";

export const metadata = { title: "Student continuity" };
export const dynamic = "force-dynamic";

export default async function TutorRetentionPage() {
  const auth = await getTutorSession();
  if (!auth) return null;
  const supabase = createAdminClient();
  const { data: casesData, error } = await supabase.from("retention_cases")
    .select("*")
    .eq("tutor_id", auth.tutor.id)
    .in("status", ["open", "monitoring", "snoozed"])
    .order("attention_score", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const cases = (casesData || []) as RetentionCase[];
  const engagementIds = cases.map((item) => item.engagement_id);
  const studentIds = [...new Set(cases.map((item) => item.student_id))];
  const [{ data: engagements }, { data: students }] = await Promise.all([
    engagementIds.length ? supabase.from("tutoring_engagements").select("id,student_id,subject,title,current_focus,frequency,session_duration_minutes,status").in("id", engagementIds) : Promise.resolve({ data: [] as any[] }),
    studentIds.length ? supabase.from("students").select("id,name,email,academic_level").in("id", studentIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const engagementMap = new Map(((engagements || []) as any[]).map((row) => [row.id, row]));
  const studentMap = new Map(((students || []) as any[]).map((row) => [row.id, row]));
  const actionable = cases.filter((item) => item.status === "open" || item.status === "snoozed");

  return <div className="tutor-page tutor-retention-page">
    <header className="tutor-page-head"><div><span className="tutor-eyebrow">Student continuity</span><h1>Retention & next-session review</h1><p>Use operational signals to spot students who may need a scheduling check-in or a clear next learning step. This is not a churn probability.</p></div></header>

    <section className="tutor-retention-metrics">
      <article><span>Needs review</span><strong>{actionable.length}</strong><small>Open or snoozed</small></article>
      <article><span>High attention</span><strong>{actionable.filter((item) => item.risk_level === "high").length}</strong><small>Based on recorded activity</small></article>
      <article><span>No future session</span><strong>{cases.filter((item) => !item.next_session_at).length}</strong><small>Across assigned active engagements</small></article>
      <article><span>Monitoring</span><strong>{cases.filter((item) => item.status === "monitoring").length}</strong><small>No immediate action</small></article>
    </section>

    <div className="tutor-retention-list">
      {actionable.map((item) => {
        const engagement = engagementMap.get(item.engagement_id) as any;
        const student = studentMap.get(item.student_id) as any;
        return <article className={`tutor-panel tutor-retention-card retention-${item.risk_level}`} key={item.id}>
          <div className="tutor-retention-card-head"><div><span className="tutor-eyebrow">{engagement?.subject || "Tutoring"}</span><h2>{student?.name || "Student"}</h2><p>{engagement?.current_focus || engagement?.title || "Current learning plan"}</p></div><div className="tutor-retention-score"><strong>{item.attention_score}</strong><span>{retentionRiskLabels[item.risk_level]}</span></div></div>
          <div className="tutor-retention-facts"><div><span>Last completed</span><strong>{formatRetentionDateTime(item.last_session_at)}</strong></div><div><span>Next session</span><strong>{formatRetentionDateTime(item.next_session_at)}</strong></div><div><span>Plan mastery</span><strong>{item.plan_completion_percent === null ? "—" : `${item.plan_completion_percent}%`}</strong></div><div><span>Completed</span><strong>{item.completed_sessions} sessions</strong></div></div>
          <ul className="tutor-retention-signals">{item.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
          <div className="tutor-retention-next"><strong>Suggested action</strong><p>{item.suggested_action || "Review the current tutoring plan."}</p></div>
          <form action={reviewTutorRetentionCase} className="tutor-retention-review-form"><input type="hidden" name="caseId" value={item.id} /><label><span>Your continuity note</span><textarea name="tutorNote" defaultValue={item.tutor_note || ""} placeholder="Recommended next topic, scheduling context, barriers discussed…" /></label><button className="tutor-secondary-button" type="submit">Save review</button></form>
          <form action={logTutorRetentionOutreach} className="tutor-retention-outreach-form"><input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="engagementId" value={item.engagement_id} /><input type="hidden" name="studentId" value={item.student_id} /><div><label><span>Channel</span><select name="channel" defaultValue="email"><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="portal">Portal</option><option value="other">Other</option></select></label><label><span>Outcome</span><select name="outcome" defaultValue="contacted"><option value="contacted">Contacted</option><option value="rebooked">Rebooked</option><option value="no_response">No response</option><option value="paused">Paused</option><option value="completed">Completed plan</option><option value="declined">Does not want to continue</option><option value="other">Other</option></select></label></div><label><span>Note</span><textarea name="note" placeholder="Brief operational note" /></label><button className="tutor-primary-button" type="submit">Log outreach</button></form>
          <div className="tutor-retention-links"><Link href={`/tutor/progress/${item.engagement_id}`}>Progress →</Link><Link href="/tutor/sessions">Sessions →</Link>{student?.email && <a href={`mailto:${student.email}`}>Email student ↗</a>}</div>
        </article>;
      })}
      {!actionable.length && <div className="tutor-panel tutor-empty">No students currently need a retention review. Monitoring cases will continue to update through the scheduled scan.</div>}
    </div>
  </div>;
}
