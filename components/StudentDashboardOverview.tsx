"use client";

import { useSearchParams } from "next/navigation";
import { DEFAULT_TIME_ZONE } from "@/lib/time-zone";

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
  timeZone = DEFAULT_TIME_ZONE,
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
  ).format(new Date(dateValue));
}

function formatDateTime(
  value: string | null,
  timeZone = DEFAULT_TIME_ZONE,
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
  ).format(new Date(value));
}

function shortText(
  value: string | null | undefined,
  max = 170,
) {
  const clean = String(value || "").trim();

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
  nextDeadline,
  confidence,
  nextSession,
  nextMeetingUrl,
  nextHomework,
  recentSession,
  averageProgress,
  mastered,
  planCount,
  timeZone = DEFAULT_TIME_ZONE,
}: Props) {
  const searchParams = useSearchParams();

  const activeView =
    searchParams.get("view") || "dashboard";

  if (activeView !== "dashboard") {
    return null;
  }

  const base =
    `/portal/${encodeURIComponent(token)}`;

  const course =
    encodeURIComponent(courseId);

  const latestFeedback =
    shortText(recentSession?.lesson_notes);

  const nextTopic =
    recentSession?.next_topic || null;

  const focusTitle =
    currentFocus ||
    nextTopic ||
    subject;

  const progressDetail =
    planCount > 0
      ? `${mastered} of ${planCount} plan topics mastered`
      : "Your learning plan will build as your tutoring progresses.";

  return (
    <section
      className="portal-home-command"
      aria-labelledby="portal-home-command-title"
    >
      <div className="portal-home-command-head">
        <div>
          <span className="portal-kicker">
            Your learning dashboard
          </span>

          <h2 id="portal-home-command-title">
            What needs your attention now
          </h2>

          <p>
            Start with your next lesson or assignment,
            then keep track of where your learning is heading.
          </p>
        </div>

        <span className="portal-home-live-note">
          Updated from your tutoring record
        </span>
      </div>

      <div className="portal-home-priority-grid">
        <article className="portal-home-priority-card is-session">
          <div className="portal-home-card-label">
            <span>01</span>
            <strong>Next lesson</strong>
          </div>

          <div className="portal-home-priority-copy">
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
                : "Your next scheduled lesson will appear here."}
            </p>

            {nextSession && (
              <small>
                {nextSession.duration_minutes} minute session
              </small>
            )}
          </div>

          <div className="portal-home-priority-actions">
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
                : "Open sessions"}
            </a>
          </div>
        </article>

        <article
          className={`portal-home-priority-card ${
            nextHomework
              ? "is-homework"
              : "is-clear"
          }`}
        >
          <div className="portal-home-card-label">
            <span>02</span>
            <strong>Homework</strong>
          </div>

          <div className="portal-home-priority-copy">
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
                  : "No due date has been set."
                : "You have no open assignments at the moment."}
            </p>

            {!nextHomework && (
              <small>
                You are clear for now.
              </small>
            )}
          </div>

          <div className="portal-home-priority-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=assignments&course=${course}`}
            >
              Open assignments
            </a>
          </div>
        </article>
      </div>

      <div className="portal-home-continuity-head">
        <div>
          <span className="portal-kicker">
            Learning continuity
          </span>

          <h3>
            Keep the thread between lessons
          </h3>
        </div>

        <p>
          Your focus, tutor feedback and learning-plan
          progress stay together here.
        </p>
      </div>

      <div className="portal-home-continuity-grid">
        <article className="portal-home-continuity-card">
          <span>Current focus</span>

          <strong>
            {focusTitle}
          </strong>

          <p>
            {nextTopic &&
            nextTopic !== currentFocus
              ? `Next: ${nextTopic}`
              : "Your current teaching priority."}
          </p>

          <div className="portal-home-continuity-meta">
            {nextDeadline && (
              <small>
                Deadline{" "}
                {formatDate(
                  nextDeadline,
                  timeZone,
                )}
              </small>
            )}

            {confidence !== null && (
              <small>
                Confidence {confidence}/5
              </small>
            )}
          </div>

          <a
            href={`${base}?view=progress&course=${course}`}
          >
            View learning plan →
          </a>
        </article>

        <article className="portal-home-continuity-card">
          <span>Latest tutor feedback</span>

          <strong>
            {recentSession
              ? recentSession.topic
              : "Your feedback will build here"}
          </strong>

          <p>
            {latestFeedback ||
              (recentSession
                ? "Your tutor has not added detailed lesson notes yet."
                : "Feedback will appear after your first completed lesson.")}
          </p>

          <div className="portal-home-continuity-meta">
            {recentSession?.understanding_rating && (
              <small>
                Understanding{" "}
                {recentSession.understanding_rating}/5
              </small>
            )}
          </div>

          <a
            href={`${base}?view=lessons&course=${course}`}
          >
            Open lesson record →
          </a>
        </article>

        <article className="portal-home-continuity-card is-progress">
          <span>Your progress</span>

          <div className="portal-home-progress-value">
            <strong>
              {averageProgress}%
            </strong>

            <small>
              overall plan progress
            </small>
          </div>

          <div
            className="portal-home-progress-track"
            aria-label={`${averageProgress}% overall learning plan progress`}
          >
            <i
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    averageProgress,
                  ),
                )}%`,
              }}
            />
          </div>

          <p>
            {progressDetail}
          </p>

          <a
            href={`${base}?view=progress&course=${course}`}
          >
            View full progress →
          </a>
        </article>
      </div>

      <div className="portal-home-help-strip">
        <div>
          <span className="portal-kicker">
            Need support?
          </span>

          <strong>
            Your tutoring team is available between lessons.
          </strong>

          <p>
            Ask about a topic, homework, scheduling,
            resources or a technical problem.
          </p>
        </div>

        <a
          className="button button-secondary"
          href={`${base}?view=help&course=${course}`}
        >
          Get help
        </a>
      </div>
    </section>
  );
}
