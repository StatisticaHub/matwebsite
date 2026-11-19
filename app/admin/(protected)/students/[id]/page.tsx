import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/admin-data";
import {
  engagementStatusLabels,
  engagementStatuses,
  homeworkStatusLabels,
  homeworkStatuses,
  progressStatusLabels,
  progressStatuses,
  sessionStatusLabels,
  sessionStatuses,
  type Homework,
  type LearningPlanItem,
  type LearningResource,
  type Student,
  type TutoringEngagement,
  type TutoringSession,
} from "@/lib/delivery-data";
import {
  addHomework,
  addLearningPlanItem,
  addLearningResource,
  addTutoringSession,
  updateEngagement,
  updateHomeworkStatus,
  updateLearningPlanProgress,
  updateTutoringSessionStatus,
} from "@/app/admin/delivery-actions";
import type { StudentCommunication } from "@/lib/student-communications";

export const dynamic = "force-dynamic";
type Params = Promise<{ id: string }>;

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function money(value: number | null, currency: string) {
  return value === null ? "—" : `${currency} ${Number(value).toFixed(2)}`;
}

export default async function StudentDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: studentData, error }, { data: engagementData }, { data: tutorData }, { data: communicationData }] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    supabase.from("tutoring_engagements").select("*").eq("student_id", id).order("created_at", { ascending: false }),
    supabase.from("tutors").select("*").order("name"),
    supabase.from("student_communications").select("*").eq("student_id", id).order("created_at", { ascending: false }).limit(12),
  ]);
  if (error || !studentData) notFound();

  const student = studentData as Student;
  const engagements = (engagementData || []) as TutoringEngagement[];
  const engagement = engagements.find((item) => item.status === "active") || engagements[0];
  const tutors = (tutorData || []) as Tutor[];
  const communications = (communicationData || []) as StudentCommunication[];
  const tutor = engagement?.tutor_id ? tutors.find((item) => item.id === engagement.tutor_id) : null;

  let plan: LearningPlanItem[] = [];
  let sessions: TutoringSession[] = [];
  let homework: Homework[] = [];
  let resources: LearningResource[] = [];

  if (engagement) {
    const [planResult, sessionResult, homeworkResult, resourceResult] = await Promise.all([
      supabase.from("learning_plan_items").select("*").eq("engagement_id", engagement.id).order("sort_order").order("created_at"),
      supabase.from("tutoring_sessions").select("*").eq("engagement_id", engagement.id).order("scheduled_for", { ascending: false, nullsFirst: false }),
      supabase.from("homework").select("*").eq("engagement_id", engagement.id).order("created_at", { ascending: false }),
      supabase.from("learning_resources").select("*").eq("engagement_id", engagement.id).order("created_at", { ascending: false }),
    ]);
    plan = (planResult.data || []) as LearningPlanItem[];
    sessions = (sessionResult.data || []) as TutoringSession[];
    homework = (homeworkResult.data || []) as Homework[];
    resources = (resourceResult.data || []) as LearningResource[];
  }

  const mastered = plan.filter((item) => item.progress_status === "mastered").length;
  const completedSessions = sessions.filter((item) => item.status === "completed");
  const totalMinutes = completedSessions.reduce((sum, item) => sum + item.duration_minutes, 0);
  const nextSession = sessions
    .filter((item) => item.status === "planned" && item.scheduled_for && new Date(item.scheduled_for) >= new Date())
    .sort((a, b) => new Date(a.scheduled_for || 0).getTime() - new Date(b.scheduled_for || 0).getTime())[0];

  return (
    <div className="admin-page">
      <div className="admin-breadcrumb"><Link href="/admin/students">← Students</Link><span>{student.email}</span></div>
      <header className="admin-page-head admin-lead-head">
        <div>
          <span className="admin-eyebrow">Student delivery record</span>
          <h1>{student.name}</h1>
          <p>{student.academic_level || "Academic level not set"}{student.programme ? ` · ${student.programme}` : ""}{student.institution ? ` · ${student.institution}` : ""}</p>
        </div>
        <div className="admin-head-actions">
          <Link className="admin-secondary-button" href={`/admin/students/${student.id}/edit`}>Edit profile</Link>
          <Link className="admin-secondary-button" href={`/admin/onboarding?student=${student.id}`}>Onboarding</Link>
          <Link className="admin-secondary-button" href={`/admin/portals?student=${student.id}`}>Portal access</Link>
          <span className={`admin-status student-${student.status}`}>{student.status}</span>
        </div>
      </header>

      <section className="admin-metrics admin-metrics-4">
        <div><span>Engagement</span><strong className="admin-metric-text">{engagement?.subject || "None"}</strong></div>
        <div><span>Completed sessions</span><strong>{completedSessions.length}</strong><small>{Math.round(totalMinutes / 60 * 10) / 10} hours</small></div>
        <div><span>Plan mastered</span><strong>{plan.length ? `${mastered}/${plan.length}` : "—"}</strong></div>
        <div><span>Next session</span><strong className="admin-metric-text">{nextSession ? formatDateTime(nextSession.scheduled_for) : "Not booked"}</strong></div>
      </section>

      {!engagement ? (
        <section className="admin-panel admin-detail-card"><h2>No tutoring engagement</h2><p>This student record does not yet have a tutoring engagement.</p></section>
      ) : (
        <div className="admin-student-stack">
          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><div><span className="admin-eyebrow">Academic plan</span><h2>{engagement.title}</h2></div><span className={`admin-status engagement-${engagement.status}`}>{engagementStatusLabels[engagement.status]}</span></div>
            <div className="admin-summary-grid">
              <div><span>Subject</span><strong>{engagement.subject}</strong></div>
              <div><span>Module</span><strong>{engagement.module || "Not set"}</strong></div>
              <div><span>Tutor</span><strong>{tutor?.name || "Not assigned"}</strong></div>
              <div><span>Frequency</span><strong>{engagement.frequency || "Not set"}</strong></div>
              <div><span>Session length</span><strong>{engagement.session_duration_minutes} min</strong></div>
              <div><span>Current focus</span><strong>{engagement.current_focus || "Not set"}</strong></div>
              <div><span>Confidence</span><strong>{engagement.confidence ? `${engagement.confidence}/5` : "Not assessed"}</strong></div>
              <div><span>Next deadline</span><strong>{formatDate(engagement.upcoming_deadline)}</strong></div>
              <div><span>Learning preference</span><strong>{engagement.preferred_learning_style || "Not set"}</strong></div>
            </div>
            {engagement.weak_topics?.length > 0 && <div className="admin-learning-goal"><span>Weak / priority topics</span><p>{engagement.weak_topics.join(" · ")}</p></div>}
            {engagement.assessment_summary && <div className="admin-learning-goal"><span>Initial academic assessment</span><p>{engagement.assessment_summary}</p></div>}
            {engagement.goal && <div className="admin-learning-goal"><span>Learning goal</span><p>{engagement.goal}</p></div>}
            {engagement.target && <div className="admin-learning-goal"><span>Target</span><p>{engagement.target}</p></div>}
          </section>

          <div className="admin-delivery-columns">
            <section className="admin-panel admin-detail-card">
              <div className="admin-card-head"><h2>Learning plan</h2><span>{plan.length} topics</span></div>
              <div className="admin-plan-list">
                {plan.map((item) => (
                  <article key={item.id} className={`priority-${item.priority}`}>
                    <div className="admin-plan-copy"><div><strong>{item.topic}</strong><span>{item.priority} priority</span></div>{item.objective && <p>{item.objective}</p>}</div>
                    <form action={updateLearningPlanProgress} className="admin-inline-form">
                      <input type="hidden" name="itemId" value={item.id} /><input type="hidden" name="studentId" value={student.id} />
                      <select name="progress" defaultValue={item.progress_status}>{progressStatuses.map((status) => <option key={status} value={status}>{progressStatusLabels[status]}</option>)}</select>
                      <button type="submit">Save</button>
                    </form>
                  </article>
                ))}
                {!plan.length && <div className="admin-empty compact">No learning-plan topics yet.</div>}
              </div>
              <details className="admin-disclosure"><summary>Add learning-plan topic</summary><form action={addLearningPlanItem} className="admin-compact-form">
                <input type="hidden" name="engagementId" value={engagement.id} /><input type="hidden" name="studentId" value={student.id} />
                <label><span>Topic</span><input name="topic" required placeholder="Confidence intervals" /></label>
                <label><span>Objective</span><textarea name="objective" placeholder="What should the student be able to do?" /></label>
                <label><span>Priority</span><select name="priority" defaultValue="medium"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
                <button className="admin-primary-button" type="submit">Add topic</button>
              </form></details>
            </section>

            <section className="admin-panel admin-detail-card">
              <div className="admin-card-head"><h2>Engagement settings</h2><span>Internal</span></div>
              <form action={updateEngagement} className="admin-compact-form">
                <input type="hidden" name="engagementId" value={engagement.id} /><input type="hidden" name="studentId" value={student.id} />
                <div className="admin-form-grid-2"><label><span>Status</span><select name="status" defaultValue={engagement.status}>{engagementStatuses.map((status) => <option key={status} value={status}>{engagementStatusLabels[status]}</option>)}</select></label><label><span>Tutor</span><select name="tutorId" defaultValue={engagement.tutor_id || ""}><option value="">Not assigned</option>{tutors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
                <div className="admin-form-grid-2"><label><span>Module</span><input name="module" defaultValue={engagement.module || ""} /></label><label><span>Current focus</span><input name="currentFocus" defaultValue={engagement.current_focus || ""} /></label></div>
                <label><span>Goal</span><textarea name="goal" defaultValue={engagement.goal || ""} /></label>
                <label><span>Target</span><input name="target" defaultValue={engagement.target || ""} /></label>
                <label><span>Weak topics</span><input name="weakTopics" defaultValue={(engagement.weak_topics || []).join(", ")} /></label>
                <div className="admin-form-grid-2"><label><span>Confidence (1–5)</span><input name="confidence" type="number" min="1" max="5" defaultValue={engagement.confidence ?? ""} /></label><label><span>Next exam / deadline</span><input name="upcomingDeadline" type="date" defaultValue={engagement.upcoming_deadline || ""} /></label></div>
                <label><span>Learning preference</span><input name="learningStyle" defaultValue={engagement.preferred_learning_style || ""} /></label>
                <label><span>Academic assessment</span><textarea name="assessmentSummary" defaultValue={engagement.assessment_summary || ""} /></label>
                <div className="admin-form-grid-2"><label><span>Frequency</span><input name="frequency" defaultValue={engagement.frequency || ""} /></label><label><span>Session minutes</span><input name="sessionDuration" type="number" min="15" max="480" defaultValue={engagement.session_duration_minutes} /></label></div>
                <div className="admin-form-grid-3"><label><span>Currency</span><select name="currency" defaultValue={engagement.currency}><option>GBP</option><option>USD</option><option>EUR</option><option>INR</option></select></label><label><span>Student rate</span><input name="studentRate" type="number" min="0" step="0.01" defaultValue={engagement.student_rate ?? ""} /></label><label><span>Tutor rate</span><input name="tutorRate" type="number" min="0" step="0.01" defaultValue={engagement.tutor_rate ?? ""} /></label></div>
                <label><span>Internal notes</span><textarea name="notes" defaultValue={engagement.notes || ""} /></label>
                <button className="admin-primary-button" type="submit">Save engagement</button>
              </form>
            </section>
          </div>

          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><div><h2>Sessions</h2><span>{completedSessions.length} completed · {sessions.length} total</span></div><Link className="admin-row-link" href="/admin/sessions">All sessions →</Link></div>
            <div className="admin-session-list">
              {sessions.map((item) => (
                <article key={item.id}>
                  <div className="admin-session-date"><strong>{formatDateTime(item.scheduled_for)}</strong><span>{item.duration_minutes} min</span></div>
                  <div className="admin-session-copy"><strong>{item.topic}</strong>{item.lesson_notes && <p>{item.lesson_notes}</p>}{item.next_topic && <small>Next: {item.next_topic}</small>}</div>
                  <div className="admin-session-meta"><span className={`admin-status session-${item.status}`}>{sessionStatusLabels[item.status]}</span>{item.understanding_rating && <small>Understanding {item.understanding_rating}/5</small>}<small>{money(item.student_rate, item.currency)} student</small><Link className="admin-row-link" href={`/admin/sessions/${item.id}`}>Manage session →</Link></div>
                  <form action={updateTutoringSessionStatus} className="admin-inline-form"><input type="hidden" name="sessionId" value={item.id} /><input type="hidden" name="studentId" value={student.id} /><select name="status" defaultValue={item.status}>{sessionStatuses.map((status) => <option key={status} value={status}>{sessionStatusLabels[status]}</option>)}</select><label className="admin-email-toggle"><input name="notifyStudent" type="checkbox" /> Email</label><button type="submit">Save</button></form>
                </article>
              ))}
              {!sessions.length && <div className="admin-empty compact">No sessions recorded yet.</div>}
            </div>
            <details className="admin-disclosure"><summary>Add / record session</summary><form action={addTutoringSession} className="admin-compact-form admin-session-form">
              <input type="hidden" name="engagementId" value={engagement.id} /><input type="hidden" name="studentId" value={student.id} />
              <div className="admin-form-grid-3"><label><span>Date & time</span><input name="scheduledFor" type="datetime-local" /></label><label><span>Status</span><select name="status" defaultValue="planned">{sessionStatuses.map((status) => <option key={status} value={status}>{sessionStatusLabels[status]}</option>)}</select></label><label><span>Duration</span><input name="durationMinutes" type="number" min="15" max="480" defaultValue={engagement.session_duration_minutes} /></label></div>
              <label><span>Topic / lesson title</span><input name="topic" required placeholder="Inference for regression coefficients" /></label>
              <label><span>Lesson notes</span><textarea name="lessonNotes" placeholder="Concepts covered, examples worked, misconceptions addressed…" /></label>
              <div className="admin-form-grid-2"><label><span>Understanding (1–5)</span><input name="understandingRating" type="number" min="1" max="5" /></label><label><span>Next topic</span><input name="nextTopic" /></label></div>
              <label><span>Homework summary</span><input name="homeworkSummary" /></label>
              <input type="hidden" name="tutorId" value={engagement.tutor_id || ""} /><input type="hidden" name="studentRate" value={engagement.student_rate ?? ""} /><input type="hidden" name="tutorRate" value={engagement.tutor_rate ?? ""} /><input type="hidden" name="currency" value={engagement.currency} />
              <label className="admin-email-toggle admin-email-toggle-block"><input name="notifyStudent" type="checkbox" /> Email this session update to the student</label>
              <button className="admin-primary-button" type="submit">Save session</button>
            </form></details>
          </section>

          <div className="admin-delivery-columns">
            <section className="admin-panel admin-detail-card">
              <div className="admin-card-head"><h2>Homework & practice</h2><span>{homework.length} items</span></div>
              <div className="admin-homework-list">
                {homework.map((item) => (
                  <article key={item.id}><div><strong>{item.title}</strong><span>{item.due_date ? `Due ${formatDate(item.due_date)}` : "No due date"}</span>{item.description && <p>{item.description}</p>}</div><form action={updateHomeworkStatus} className="admin-inline-form admin-homework-action"><input type="hidden" name="homeworkId" value={item.id} /><input type="hidden" name="studentId" value={student.id} /><select name="status" defaultValue={item.status}>{homeworkStatuses.map((status) => <option key={status} value={status}>{homeworkStatusLabels[status]}</option>)}</select><input name="feedback" defaultValue={item.tutor_feedback || ""} placeholder="Feedback" /><label className="admin-email-toggle"><input name="notifyStudent" type="checkbox" /> Email</label><button type="submit">Save</button></form></article>
                ))}
                {!homework.length && <div className="admin-empty compact">No homework assigned yet.</div>}
              </div>
              <details className="admin-disclosure"><summary>Assign homework</summary><form action={addHomework} className="admin-compact-form"><input type="hidden" name="engagementId" value={engagement.id} /><input type="hidden" name="studentId" value={student.id} /><label><span>Title</span><input name="title" required /></label><label><span>Description</span><textarea name="description" /></label><label><span>Due date</span><input name="dueDate" type="date" /></label><label className="admin-email-toggle admin-email-toggle-block"><input name="notifyStudent" type="checkbox" /> Email this homework to the student</label><button className="admin-primary-button" type="submit">Assign homework</button></form></details>
            </section>

            <section className="admin-panel admin-detail-card">
              <div className="admin-card-head"><h2>Materials & resources</h2><span>{resources.length} items</span></div>
              <div className="admin-resource-list">
                {resources.map((item) => <article key={item.id}><div><span>{item.resource_type}</span><strong>{item.title}</strong>{item.note && <p>{item.note}</p>}</div>{item.url && <a href={item.url} target="_blank" rel="noreferrer">Open ↗</a>}</article>)}
                {!resources.length && <div className="admin-empty compact">No resources attached yet.</div>}
              </div>
              <details className="admin-disclosure"><summary>Add resource</summary><form action={addLearningResource} className="admin-compact-form"><input type="hidden" name="engagementId" value={engagement.id} /><input type="hidden" name="studentId" value={student.id} /><label><span>Title</span><input name="title" required /></label><div className="admin-form-grid-2"><label><span>Type</span><select name="resourceType" defaultValue="link"><option value="link">Link</option><option value="note">Note</option><option value="worksheet">Worksheet</option><option value="syllabus">Syllabus</option><option value="other">Other</option></select></label><label><span>URL</span><input name="url" type="url" placeholder="https://…" /></label></div><label><span>Note</span><textarea name="note" /></label><button className="admin-primary-button" type="submit">Add resource</button></form></details>
            </section>
          </div>

          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><div><h2>Student communications</h2><span>Resend delivery log</span></div></div>
            <div className="admin-communication-list">
              {communications.map((item) => (
                <article key={item.id}>
                  <div><strong>{item.subject}</strong><span>{item.communication_type.replaceAll("_", " ")} · {formatDateTime(item.created_at)}</span></div>
                  <div className={`admin-status communication-${item.status}`}>{item.status}</div>
                  {item.error && <small>{item.error}</small>}
                </article>
              ))}
              {!communications.length && <div className="admin-empty compact">No student emails logged yet.</div>}
            </div>
          </section>

          <section className="admin-panel admin-detail-card admin-finance-strip">
            <div><span>Student rate</span><strong>{money(engagement.student_rate, engagement.currency)}</strong></div><div><span>Tutor rate</span><strong>{money(engagement.tutor_rate, engagement.currency)}</strong></div><div><span>Margin / completed session</span><strong>{engagement.student_rate !== null && engagement.tutor_rate !== null ? money(engagement.student_rate - engagement.tutor_rate, engagement.currency) : "—"}</strong></div><div><span>Start date</span><strong>{formatDate(engagement.start_date)}</strong></div>
          </section>
        </div>
      )}
    </div>
  );
}
