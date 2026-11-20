import type { Metadata } from "next";
import HomeworkSubmissionForm from "@/components/HomeworkSubmissionForm";
import StudentSupportForm from "@/components/StudentSupportForm";
import {
  getPortalContext,
  safeExternalUrl,
} from "@/lib/student-portal";
import {
  homeworkStatusLabels,
  progressStatusLabels,
  sessionStatusLabels,
} from "@/lib/delivery-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Learning portal",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;

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

function progressScore(status: string) {
  if (status === "mastered") return 100;
  if (status === "comfortable") return 72;
  if (status === "developing") return 38;
  return 8;
}

export default async function StudentPortalPage({ params }: { params: Params }) {
  const { token } = await params;
  const context = await getPortalContext(token);

  if (!context) {
    return (
      <div className="student-portal-shell portal-unavailable-shell">
        <header className="portal-topbar"><strong>My Academic Tutor</strong><span>Learning portal</span></header>
        <div className="portal-unavailable">
          <span className="portal-kicker">Secure learning portal</span>
          <h1>This portal link is no longer available.</h1>
          <p>It may have expired or been replaced. Please contact your tutoring team for a fresh link.</p>
          <a className="button button-primary" href="/contact">Contact My Academic Tutor</a>
        </div>
      </div>
    );
  }

  const { student, engagement, plan, sessions, homework, resources, submissions, tutorName } = context;
  const now = Date.now();
  const upcomingSessions = sessions
    .filter((item) => item.status === "planned" && item.scheduled_for && new Date(item.scheduled_for).getTime() >= now)
    .sort((a, b) => new Date(a.scheduled_for || 0).getTime() - new Date(b.scheduled_for || 0).getTime());
  const completedSessions = sessions
    .filter((item) => item.status === "completed")
    .sort((a, b) => new Date(b.completed_at || b.scheduled_for || 0).getTime() - new Date(a.completed_at || a.scheduled_for || 0).getTime());
  const averageProgress = plan.length
    ? Math.round(plan.reduce((sum, item) => sum + progressScore(item.progress_status), 0) / plan.length)
    : 0;
  const mastered = plan.filter((item) => item.progress_status === "mastered").length;
  const submissionByHomework = Object.fromEntries(submissions.map((item) => [item.homework_id, item]));

  return (
    <div className="student-portal-shell">
      <header className="portal-topbar">
        <a href="/" className="portal-brand"><strong>My Academic Tutor</strong><span>Learning portal</span></a>
        <div className="portal-topbar-meta"><span>Private learning record</span><strong>{student.name}</strong></div>
      </header>

      <div className="portal-page">
        <section className="portal-welcome">
          <div>
            <span className="portal-kicker">Your tutoring plan</span>
            <h1>Welcome back, {student.name.split(" ")[0]}.</h1>
            <p>{engagement ? `This is your live ${engagement.subject} learning record — what you are working on, what comes next, and the materials your tutoring team has shared.` : "Your learning record is being prepared."}</p>
          </div>
          {engagement && (
            <div className="portal-progress-card">
              <span>Overall plan progress</span>
              <strong>{averageProgress}%</strong>
              <div className="portal-progress-track"><i style={{ width: `${averageProgress}%` }} /></div>
              <small>{mastered} of {plan.length} plan topics mastered</small>
            </div>
          )}
        </section>

        {!engagement ? (
          <section className="portal-panel portal-empty-state">
            <h2>Your plan is being set up</h2>
            <p>Your tutoring team has created your student record but has not yet activated a teaching engagement. Once they do, your learning plan, sessions, homework and materials will appear here.</p>
          </section>
        ) : (
          <>
            <section className="portal-summary-grid">
              <article><span>Subject</span><strong>{engagement.subject}</strong><small>{engagement.module || engagement.title}</small></article>
              <article><span>Current focus</span><strong>{engagement.current_focus || "Building your learning plan"}</strong><small>{engagement.goal || "Your goal will be kept here."}</small></article>
              <article><span>Next session</span><strong>{upcomingSessions[0] ? formatDateTime(upcomingSessions[0].scheduled_for) : "Not booked"}</strong><small>{upcomingSessions[0]?.topic || "Your tutoring team will update this."}</small></article>
              <article><span>Next deadline</span><strong>{formatDate(engagement.upcoming_deadline)}</strong><small>{engagement.confidence ? `Current confidence ${engagement.confidence}/5` : "Confidence not yet assessed"}</small></article>
            </section>

            <div className="portal-main-grid">
              <div className="portal-primary-column">
                <section className="portal-panel">
                  <div className="portal-panel-head"><div><span className="portal-kicker">Roadmap</span><h2>Your learning plan</h2></div><span>{plan.length} topics</span></div>
                  <div className="portal-plan-list">
                    {plan.map((item) => (
                      <article key={item.id}>
                        <div className={`portal-plan-marker progress-${item.progress_status}`} />
                        <div><strong>{item.topic}</strong>{item.objective && <p>{item.objective}</p>}<small>{item.priority} priority</small></div>
                        <span className={`portal-status progress-${item.progress_status}`}>{progressStatusLabels[item.progress_status]}</span>
                      </article>
                    ))}
                    {!plan.length && <div className="portal-empty">Your tutoring team has not added plan topics yet.</div>}
                  </div>
                </section>

                <section className="portal-panel">
                  <div className="portal-panel-head"><div><span className="portal-kicker">Practice</span><h2>Homework & independent work</h2></div><span>{homework.length} items</span></div>
                  <div className="portal-homework-list">
                    {homework.map((item) => {
                      const submission = submissionByHomework[item.id] || null;
                      return (
                        <article key={item.id}>
                          <div className="portal-homework-copy">
                            <div><strong>{item.title}</strong><span className={`portal-status homework-${item.status}`}>{homeworkStatusLabels[item.status]}</span></div>
                            <small>{item.due_date ? `Due ${formatDate(item.due_date)}` : "No due date"}</small>
                            {item.description && <p>{item.description}</p>}
                            {item.tutor_feedback && <div className="portal-feedback"><span>Tutor feedback</span><p>{item.tutor_feedback}</p></div>}
                            {submission && <small>Last submitted {formatDateTime(submission.submitted_at)}</small>}
                          </div>
                          {!(["completed", "skipped"] as string[]).includes(item.status) && (
                            <HomeworkSubmissionForm token={token} homeworkId={item.id} existing={submission ? { note: submission.note, submission_url: submission.submission_url } : null} />
                          )}
                        </article>
                      );
                    })}
                    {!homework.length && <div className="portal-empty">No homework has been assigned yet.</div>}
                  </div>
                </section>

                <section className="portal-panel">
                  <div className="portal-panel-head"><div><span className="portal-kicker">Lesson record</span><h2>Recent sessions</h2></div><span>{completedSessions.length} completed</span></div>
                  <div className="portal-session-timeline">
                    {completedSessions.slice(0, 8).map((item) => (
                      <article key={item.id}>
                        <div className="portal-session-date"><strong>{formatDateTime(item.completed_at || item.scheduled_for)}</strong><span>{item.duration_minutes} min</span></div>
                        <div className="portal-session-copy"><strong>{item.topic}</strong>{item.lesson_notes && <p>{item.lesson_notes}</p>}{item.next_topic && <small>Next focus: {item.next_topic}</small>}</div>
                        <div className="portal-session-meta"><span className={`portal-status session-${item.status}`}>{sessionStatusLabels[item.status]}</span>{item.understanding_rating && <small>Understanding {item.understanding_rating}/5</small>}</div>
                      </article>
                    ))}
                    {!completedSessions.length && <div className="portal-empty">Your completed lessons will build into a learning history here.</div>}
                  </div>
                </section>
              </div>

              <aside className="portal-side-column">
                <section className="portal-panel portal-focus-card">
                  <span className="portal-kicker">Current engagement</span>
                  <h2>{engagement.title}</h2>
                  <dl>
                    <div><dt>Tutor</dt><dd>{tutorName || "To be confirmed"}</dd></div>
                    <div><dt>Frequency</dt><dd>{engagement.frequency || "Flexible"}</dd></div>
                    <div><dt>Session length</dt><dd>{engagement.session_duration_minutes} minutes</dd></div>
                    <div><dt>Learning preference</dt><dd>{engagement.preferred_learning_style || "Being assessed"}</dd></div>
                  </dl>
                  {engagement.weak_topics?.length > 0 && <div className="portal-topic-tags">{engagement.weak_topics.map((topic) => <span key={topic}>{topic}</span>)}</div>}
                </section>

                <section className="portal-panel">
                  <div className="portal-panel-head compact"><div><span className="portal-kicker">Materials</span><h2>Resources</h2></div></div>
                  <div className="portal-resource-list">
                    {resources.map((item) => {
                      const href = safeExternalUrl(item.url);
                      return <article key={item.id}><div><span>{item.resource_type}</span><strong>{item.title}</strong>{item.note && <p>{item.note}</p>}</div>{href && <a href={href} target="_blank" rel="noopener noreferrer">Open ↗</a>}</article>;
                    })}
                    {!resources.length && <div className="portal-empty">Shared materials will appear here.</div>}
                  </div>
                </section>

                <section className="portal-panel portal-help-card">
                  <span className="portal-kicker">Need something?</span>
                  <h2>Ask your tutoring team</h2>
                  <p>Use this for lesson questions, homework, a missing resource or anything that needs follow-up.</p>
                  <StudentSupportForm token={token} />
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
