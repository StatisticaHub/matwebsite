"use client";

import { useSearchParams } from "next/navigation";

type SessionItem = {
  id: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  topic: string;
  lesson_notes?: string | null;
  understanding_rating?: number | null;
  next_topic?: string | null;
  homework_summary?: string | null;
};

type HomeworkItem = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
};

type Props = {
  token: string;
  courseId: string;
  subject: string;
  currentFocus: string | null;
  nextDeadline: string | null;
  confidence: number | null;
  nextSession: SessionItem | null;
  nextMeetingUrl: string | null;
  nextHomework: HomeworkItem | null;
  recentSession: SessionItem | null;
  averageProgress: number;
  mastered: number;
  planCount: number;
  timeZone?: string;
};

function formatDate(
  value: string | null,
  timeZone = "Europe/London",
) {
  if (!value) return "No due date";

  const dateValue =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T12:00:00`
      : value;

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone,
    },
  ).format(
    new Date(dateValue),
  );
}

function formatDateTime(
  value: string | null,
  timeZone = "Europe/London",
) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone,
    },
  ).format(
    new Date(value),
  );
}

function shortText(
  value: string | null | undefined,
  max = 180,
) {
  const clean =
    String(value || "").trim();

  if (!clean) return null;

  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max).trim()}…`;
}

export default function StudentDashboardOverview({
  token,
  courseId,
  subject,
  currentFocus,
  nextSession,
  nextMeetingUrl,
  nextHomework,
  recentSession,
  timeZone = "Europe/London",
}: Props) {
  const searchParams =
    useSearchParams();

  const activeView =
    searchParams.get("view") ||
    "dashboard";

  if (activeView !== "dashboard") {
    return null;
  }

  const base =
    `/portal/${encodeURIComponent(token)}`;

  const course =
    encodeURIComponent(courseId);

  const latestFeedback =
    shortText(
      recentSession?.lesson_notes,
    );

  const nextTopic =
    recentSession?.next_topic ||
    currentFocus ||
    null;

  return (
    <section className="portal-next-actions">
      <div className="portal-next-actions-head">
        <div>
          <span className="portal-kicker">
            Next actions
          </span>

          <h2>
            What to do next
          </h2>

          <p>
            Your most useful next steps for{" "}
            {subject}.
          </p>
        </div>

        <span className="portal-next-actions-note">
          Updated from your tutoring record
        </span>
      </div>

      <div className="portal-next-actions-grid">

        <article className="portal-next-action-card is-primary">
          <div className="portal-next-action-top">
            <span className="portal-next-action-number">
              1
            </span>

            <span className="portal-kicker">
              Upcoming session
            </span>
          </div>

          <h3>
            {nextSession
              ? nextSession.topic
              : "No lesson booked"}
          </h3>

          <p>
            {nextSession
              ? formatDateTime(
                  nextSession.scheduled_for,
                  timeZone,
                )
              : "There is no upcoming lesson scheduled yet."}
          </p>

          <div className="portal-next-action-buttons">
            {nextMeetingUrl && (
              <a
                className="button button-primary"
                href={nextMeetingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Join lesson
              </a>
            )}

            <a
              className="button button-secondary"
              href={`${base}?view=calendar&course=${course}`}
            >
              {nextSession
                ? "View session"
                : "View calendar"}
            </a>
          </div>
        </article>


        <article className="portal-next-action-card">
          <div className="portal-next-action-top">
            <span className="portal-next-action-number">
              2
            </span>

            <span className="portal-kicker">
              Outstanding homework
            </span>
          </div>

          <h3>
            {nextHomework
              ? nextHomework.title
              : "Nothing currently due"}
          </h3>

          <p>
            {nextHomework
              ? nextHomework.due_date
                ? `Due ${formatDate(
                    nextHomework.due_date,
                    timeZone,
                  )}`
                : "This assignment does not have a due date."
              : "You have no open assignments at the moment."}
          </p>

          <div className="portal-next-action-buttons">
            <a
              className="button button-secondary"
              href={`${base}?view=assignments&course=${course}`}
            >
              View assignments
            </a>
          </div>
        </article>


        <article className="portal-next-action-card">
          <div className="portal-next-action-top">
            <span className="portal-next-action-number">
              3
            </span>

            <span className="portal-kicker">
              Latest tutor feedback
            </span>
          </div>

          <h3>
            {recentSession
              ? recentSession.topic
              : "No completed lesson yet"}
          </h3>

          <p>
            {latestFeedback ||
              (
                recentSession
                  ? "Your tutor has not added detailed lesson notes yet."
                  : "Tutor feedback will appear here after your first completed lesson."
              )}
          </p>

          {recentSession?.understanding_rating && (
            <small className="portal-next-action-meta">
              Understanding recorded:{" "}
              {recentSession.understanding_rating}/5
            </small>
          )}

          <div className="portal-next-action-buttons">
            <a
              className="button button-secondary"
              href={`${base}?view=lessons&course=${course}`}
            >
              View lesson record
            </a>
          </div>
        </article>


        <article className="portal-next-action-card">
          <div className="portal-next-action-top">
            <span className="portal-next-action-number">
              4
            </span>

            <span className="portal-kicker">
              Next topic
            </span>
          </div>

          <h3>
            {nextTopic ||
              "Next focus not set yet"}
          </h3>

          <p>
            {nextTopic
              ? "This is the next teaching focus currently recorded for your course."
              : "Your tutor will add the next focus as your learning plan develops."}
          </p>

          <div className="portal-next-action-buttons">
            <a
              className="button button-secondary"
              href={`${base}?view=progress&course=${course}`}
            >
              View learning progress
            </a>
          </div>
        </article>


        <article className="portal-next-action-card is-support">
          <div className="portal-next-action-top">
            <span className="portal-next-action-number">
              5
            </span>

            <span className="portal-kicker">
              Need help?
            </span>
          </div>

          <h3>
            Ask your tutoring team
          </h3>

          <p>
            Ask about a lesson, homework,
            scheduling, learning resources or
            a technical problem.
          </p>

          <div className="portal-next-action-buttons">
            <a
              className="button button-secondary"
              href={`${base}?view=help&course=${course}`}
            >
              Ask for support
            </a>
          </div>
        </article>

      </div>
    </section>
  );
}
