import Link from "next/link";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIME_ZONE,
  dateKeyInTimeZone,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";

export const metadata = {
  title: "My sessions",
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

function timeOnly(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
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

export default async function TutorSessionsPage() {
  const auth = await getTutorSession();

  if (!auth) return null;

  const tutorTimeZone =
    normalizeTimeZone(
      auth.tutor.timezone,
      DEFAULT_TIME_ZONE,
    );

  const fmt = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      tutorTimeZone,
    );


  const { data, error } = await createAdminClient()
    .from("tutoring_sessions")
    .select(
      "id,scheduled_for,completed_at,duration_minutes,status,topic,meeting_url,zoom_ended_at,lesson_notes,understanding_rating,next_topic,tutoring_engagements(subject,students(name))"
    )
    .eq("tutor_id", auth.tutor.id)
    .order("scheduled_for", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as any[];
  const now = new Date();
  const nowMs = now.getTime();
  const todayKey = londonDateKey(now);

  const today = rows
    .filter(
      (row) =>
        row.status === "planned" &&
        row.scheduled_for &&
        londonDateKey(row.scheduled_for) === todayKey
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    );

  const needsCloseout = rows
    .filter(
      (row) =>
        row.status === "planned" &&
        row.scheduled_for &&
        (
          row.zoom_ended_at ||
          new Date(row.scheduled_for).getTime() < nowMs
        )
    )
    .sort(
      (a, b) =>
        new Date(b.scheduled_for).getTime() -
        new Date(a.scheduled_for).getTime()
    );

  const upcoming = rows
    .filter(
      (row) =>
        row.status === "planned" &&
        row.scheduled_for &&
        new Date(row.scheduled_for).getTime() >= nowMs &&
        londonDateKey(row.scheduled_for) !== todayKey
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    );

  const completed = rows
    .filter(
      (row) =>
        row.status === "completed"
    )
    .sort(
      (a, b) =>
        new Date(
          b.completed_at ||
            b.scheduled_for ||
            0
        ).getTime() -
        new Date(
          a.completed_at ||
            a.scheduled_for ||
            0
        ).getTime()
    );

  return (
    <div className="tutor-page tutor-sessions-workspace">
      <header className="tutor-page-head tutor-page-head-actions">
        <div>
          <span className="tutor-eyebrow">
            Teaching
          </span>
          <h1>My sessions</h1>
          <p>
            Prepare upcoming lessons, join live sessions and close out completed teaching.
          </p>
        </div>

        <Link
          className="tutor-secondary-button"
          href="/tutor/availability"
        >
          Update availability
        </Link>
      </header>

      <section className="tutor-session-metrics">
        <article>
          <span>Today</span>
          <strong>{today.length}</strong>
          <small>Scheduled lessons</small>
        </article>

        <article className={needsCloseout.length ? "attention" : ""}>
          <span>Needs close-out</span>
          <strong>{needsCloseout.length}</strong>
          <small>Lesson records waiting</small>
        </article>

        <article>
          <span>Upcoming</span>
          <strong>{upcoming.length}</strong>
          <small>Future lessons</small>
        </article>

        <article>
          <span>Completed</span>
          <strong>{completed.length}</strong>
          <small>Delivered sessions</small>
        </article>
      </section>

      {today.length > 0 && (
        <section className="tutor-panel tutor-session-section">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-eyebrow">Today</span>
              <h2>Teaching schedule</h2>
            </div>
          </div>

          <div className="tutor-session-cards">
            {today.map((row) => (
              <article
                className="tutor-session-card featured"
                key={row.id}
              >
                <div className="tutor-session-card-time">
                  <strong>{timeOnly(row.scheduled_for)}</strong>
                  <span>{row.duration_minutes} min</span>
                </div>

                <div className="tutor-session-card-copy">
                  <span className="tutor-eyebrow">
                    {row.tutoring_engagements?.subject ||
                      "Tutoring"}
                  </span>

                  <h3>{row.topic}</h3>

                  <p>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}
                  </p>
                </div>

                <div className="tutor-session-card-actions">
                  {row.meeting_url && (
                    <a
                      className="tutor-primary-button"
                      href={row.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join lesson ↗
                    </a>
                  )}

                  <Link
                    className="tutor-secondary-button"
                    href={`/tutor/sessions/${row.id}`}
                  >
                    Open record
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {needsCloseout.length > 0 && (
        <section className="tutor-panel tutor-session-section tutor-closeout-section">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-eyebrow">
                Action required
              </span>

              <h2>Complete lesson records</h2>
            </div>

            <span>
              {needsCloseout.length} waiting
            </span>
          </div>

          <div className="tutor-session-cards">
            {needsCloseout.map((row) => (
              <article
                className="tutor-session-card"
                key={row.id}
              >
                <div className="tutor-session-card-copy">
                  <span className="tutor-eyebrow">
                    {row.tutoring_engagements?.subject ||
                      "Tutoring"}
                  </span>

                  <h3>{row.topic}</h3>

                  <p>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}{" "}
                    · {fmt(row.scheduled_for)}
                  </p>
                </div>

                <Link
                  className="tutor-primary-button"
                  href={`/tutor/sessions/${row.id}`}
                >
                  Complete record
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="tutor-panel tutor-session-section">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              Calendar
            </span>
            <h2>Upcoming lessons</h2>
          </div>

          <span>{upcoming.length} booked</span>
        </div>

        <div className="tutor-table-wrap">
          <table className="tutor-table tutor-session-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Lesson</th>
                <th>Duration</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {upcoming.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{fmt(row.scheduled_for)}</strong>
                  </td>

                  <td>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}
                    <small>
                      {row.tutoring_engagements?.subject || ""}
                    </small>
                  </td>

                  <td>{row.topic}</td>

                  <td>
                    {row.duration_minutes} min
                  </td>

                  <td>
                    <Link
                      href={`/tutor/sessions/${row.id}`}
                    >
                      Prepare →
                    </Link>
                  </td>
                </tr>
              ))}

              {!upcoming.length && (
                <tr>
                  <td colSpan={5}>
                    <div className="tutor-empty">
                      No future lessons are booked.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tutor-panel tutor-session-section">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              History
            </span>
            <h2>Recent completed lessons</h2>
          </div>

          <span>{completed.length} completed</span>
        </div>

        <div className="tutor-table-wrap">
          <table className="tutor-table tutor-session-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Lesson</th>
                <th>Outcome</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {completed.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>{fmt(row.completed_at || row.scheduled_for)}</td>

                  <td>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}
                    <small>
                      {row.tutoring_engagements?.subject || ""}
                    </small>
                  </td>

                  <td>{row.topic}</td>

                  <td>
                    {row.understanding_rating
                      ? `Understanding ${row.understanding_rating}/5`
                      : row.next_topic
                        ? `Next: ${row.next_topic}`
                        : "Recorded"}
                  </td>

                  <td>
                    <Link
                      href={`/tutor/sessions/${row.id}`}
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}

              {!completed.length && (
                <tr>
                  <td colSpan={5}>
                    <div className="tutor-empty">
                      Completed lessons will appear here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
