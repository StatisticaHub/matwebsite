import Link from "next/link";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sessionStatusLabels,
  type SessionStatus,
} from "@/lib/delivery-data";

export const metadata = {
  title: "Tutor dashboard",
};

export const dynamic = "force-dynamic";

function fmt(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function londonDateKey(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${map.year}-${map.month}-${map.day}`;
}

export default async function TutorDashboardPage() {
  const auth = await getTutorSession();

  if (!auth) return null;

  const supabase = createAdminClient();

  const [
    sessionResult,
    engagementResult,
  ] = await Promise.all([
    supabase
      .from("tutoring_sessions")
      .select(
        "id,scheduled_for,completed_at,duration_minutes,status,topic,meeting_url,zoom_ended_at,lesson_notes,understanding_rating,next_topic,tutoring_engagements(id,subject,title,students(name))"
      )
      .eq("tutor_id", auth.tutor.id)
      .order("scheduled_for", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(300),

    supabase
      .from("tutoring_engagements")
      .select(
        "id,status,subject,title,current_focus,upcoming_deadline,students(name,academic_level)"
      )
      .eq("tutor_id", auth.tutor.id)
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (sessionResult.error) {
    throw new Error(sessionResult.error.message);
  }

  if (engagementResult.error) {
    throw new Error(engagementResult.error.message);
  }

  const sessions =
    (sessionResult.data || []) as any[];

  const engagements =
    (engagementResult.data || []) as any[];

  const now = new Date();
  const nowMs = now.getTime();
  const todayKey =
    londonDateKey(now);

  const upcoming =
    sessions
      .filter(
        (item) =>
          item.status === "planned" &&
          item.scheduled_for &&
          new Date(item.scheduled_for).getTime() >= nowMs
      )
      .sort(
        (a, b) =>
          new Date(a.scheduled_for).getTime() -
          new Date(b.scheduled_for).getTime()
      );

  const today =
    upcoming.filter(
      (item) =>
        londonDateKey(item.scheduled_for) === todayKey
    );

  const needsCloseout =
    sessions
      .filter(
        (item) =>
          item.status === "planned" &&
          item.scheduled_for &&
          (
            item.zoom_ended_at ||
            new Date(item.scheduled_for).getTime() < nowMs
          )
      )
      .sort(
        (a, b) =>
          new Date(b.scheduled_for).getTime() -
          new Date(a.scheduled_for).getTime()
      );

  const recentCompleted =
    sessions
      .filter(
        (item) =>
          item.status === "completed"
      )
      .slice(0, 5);

  const todayMinutes =
    today.reduce(
      (sum, item) =>
        sum + Number(item.duration_minutes || 0),
      0
    );

  return (
    <div className="tutor-page tutor-dashboard-page">
      <header className="tutor-dashboard-hero">
        <div>
          <span className="tutor-eyebrow">
            Teaching workspace
          </span>

          <h1>
            Welcome back, {auth.tutor.name}.
          </h1>

          <p>
            Your sessions, students and lesson follow-up in one place.
          </p>
        </div>

        <div className="tutor-dashboard-hero-actions">
          <Link
            className="tutor-primary-button"
            href="/tutor/sessions"
          >
            Open sessions
          </Link>

          <Link
            className="tutor-secondary-button"
            href="/tutor/students"
          >
            My students
          </Link>
        </div>
      </header>

      <section className="tutor-command-metrics">
        <article>
          <span>Today</span>
          <strong>{today.length}</strong>
          <small>{todayMinutes} teaching minutes</small>
        </article>

        <article className={needsCloseout.length ? "attention" : ""}>
          <span>Needs close-out</span>
          <strong>{needsCloseout.length}</strong>
          <small>
            {needsCloseout.length
              ? "Complete lesson records"
              : "Nothing waiting"}
          </small>
        </article>

        <article>
          <span>Active students</span>
          <strong>{engagements.length}</strong>
          <small>Current tutoring engagements</small>
        </article>

        <article>
          <span>Next lesson</span>
          <strong>
            {upcoming[0]
              ? fmt(upcoming[0].scheduled_for)
              : "—"}
          </strong>
          <small>
            {upcoming[0]?.tutoring_engagements?.students?.name ||
              "No lesson booked"}
          </small>
        </article>
      </section>

      <div className="tutor-dashboard-grid">
        <div className="tutor-dashboard-main">
          <section className="tutor-panel tutor-dashboard-section">
            <div className="tutor-panel-head">
              <div>
                <span className="tutor-eyebrow">
                  Today
                </span>
                <h2>Teaching schedule</h2>
              </div>

              <Link href="/tutor/sessions">
                View all →
              </Link>
            </div>

            <div className="tutor-command-list">
              {today.map((item) => (
                <article key={item.id}>
                  <div className="tutor-command-time">
                    <strong>
                      {new Intl.DateTimeFormat("en-GB", {
                        timeStyle: "short",
                        timeZone: "Europe/London",
                      }).format(new Date(item.scheduled_for))}
                    </strong>
                    <span>
                      {item.duration_minutes} min
                    </span>
                  </div>

                  <div className="tutor-command-copy">
                    <span className="tutor-eyebrow">
                      {item.tutoring_engagements?.subject ||
                        "Tutoring"}
                    </span>
                    <strong>{item.topic}</strong>
                    <small>
                      {item.tutoring_engagements?.students?.name ||
                        "Student"}
                    </small>
                  </div>

                  <div className="tutor-command-actions">
                    {item.meeting_url && (
                      <a
                        className="tutor-secondary-button"
                        href={item.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join ↗
                      </a>
                    )}

                    <Link
                      className="tutor-primary-link"
                      href={`/tutor/sessions/${item.id}`}
                    >
                      Open →
                    </Link>
                  </div>
                </article>
              ))}

              {!today.length && (
                <div className="tutor-empty tutor-command-empty">
                  No lessons scheduled for today.
                </div>
              )}
            </div>
          </section>

          <section className="tutor-panel tutor-dashboard-section">
            <div className="tutor-panel-head">
              <div>
                <span className="tutor-eyebrow">
                  Follow-up
                </span>
                <h2>Needs close-out</h2>
              </div>

              <span>
                {needsCloseout.length} waiting
              </span>
            </div>

            <div className="tutor-command-list compact">
              {needsCloseout.slice(0, 6).map((item) => (
                <article key={item.id}>
                  <div className="tutor-command-copy">
                    <strong>{item.topic}</strong>
                    <small>
                      {item.tutoring_engagements?.students?.name ||
                        "Student"}{" "}
                      · {fmt(item.scheduled_for)}
                    </small>
                  </div>

                  <Link
                    className="tutor-primary-button"
                    href={`/tutor/sessions/${item.id}`}
                  >
                    Complete record
                  </Link>
                </article>
              ))}

              {!needsCloseout.length && (
                <div className="tutor-empty">
                  All recent lessons are up to date.
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="tutor-dashboard-side">
          <section className="tutor-panel tutor-dashboard-section">
            <div className="tutor-panel-head">
              <div>
                <span className="tutor-eyebrow">
                  Students
                </span>
                <h2>Current learners</h2>
              </div>

              <Link href="/tutor/students">
                All →
              </Link>
            </div>

            <div className="tutor-learner-list">
              {engagements.slice(0, 6).map((item) => (
                <Link
                  key={item.id}
                  href={`/tutor/progress/${item.id}`}
                >
                  <strong>
                    {item.students?.name || "Student"}
                  </strong>

                  <span>{item.subject}</span>

                  <small>
                    {item.current_focus ||
                      item.title ||
                      "Learning plan"}
                  </small>
                </Link>
              ))}

              {!engagements.length && (
                <div className="tutor-empty">
                  No active students assigned.
                </div>
              )}
            </div>
          </section>

          <section className="tutor-panel tutor-dashboard-section">
            <div className="tutor-panel-head">
              <div>
                <span className="tutor-eyebrow">
                  Recently delivered
                </span>
                <h2>Completed lessons</h2>
              </div>
            </div>

            <div className="tutor-recent-list">
              {recentCompleted.map((item) => (
                <Link
                  href={`/tutor/sessions/${item.id}`}
                  key={item.id}
                >
                  <div>
                    <strong>{item.topic}</strong>
                    <small>
                      {item.tutoring_engagements?.students?.name ||
                        "Student"}
                    </small>
                  </div>

                  <span
                    className={`tutor-status ${
                      item.status
                    }`}
                  >
                    {sessionStatusLabels[
                      item.status as SessionStatus
                    ] || item.status}
                  </span>
                </Link>
              ))}

              {!recentCompleted.length && (
                <div className="tutor-empty">
                  Completed lessons will appear here.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
