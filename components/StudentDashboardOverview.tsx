"use client";

import { useSearchParams } from "next/navigation";

type SessionItem = {
  id: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  topic: string;
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

function formatDate(value: string | null, timeZone = "Europe/London") {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }).format(new Date(value));
}

function formatDateTime(value: string | null, timeZone = "Europe/London") {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
}

export default function StudentDashboardOverview({
  token,
  courseId,
  nextSession,
  nextMeetingUrl,
  nextHomework,
  timeZone = "Europe/London",
}: Props) {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") || "dashboard";

  if (activeView !== "dashboard") {
    return null;
  }

  const base = `/portal/${encodeURIComponent(token)}`;
  const course = encodeURIComponent(courseId);

  return (
    <div className="portal-dashboard-simple">

      <section className="portal-dashboard-simple-grid">

        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Next lesson</span>

          <h2>
            {nextSession
              ? nextSession.topic
              : "No lesson booked"}
          </h2>

          <p>
            {nextSession
              ? formatDateTime(nextSession.scheduled_for, timeZone)
              : "Your next lesson will appear here once it is scheduled."}
          </p>

          <div className="portal-dashboard-simple-actions">
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
              View sessions
            </a>
          </div>
        </article>


        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Assignment</span>

          <h2>
            {nextHomework
              ? nextHomework.title
              : "Nothing due"}
          </h2>

          <p>
            {nextHomework
              ? nextHomework.due_date
                ? `Due ${formatDate(nextHomework.due_date, timeZone)}`
                : "No due date"
              : "You have no open assignments."}
          </p>

          <div className="portal-dashboard-simple-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=assignments&course=${course}`}
            >
              View assignments
            </a>
          </div>
        </article>


        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Progress</span>

          <h2>Your learning progress</h2>

          <p>
            View your latest progress report, attendance,
            homework completion and tutor feedback.
          </p>

          <div className="portal-dashboard-simple-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=progress&course=${course}`}
            >
              View progress
            </a>
          </div>
        </article>


        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Resources</span>

          <h2>Learning materials</h2>

          <p>
            Access worksheets, lesson notes and other materials
            shared for your course.
          </p>

          <div className="portal-dashboard-simple-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=resources&course=${course}`}
            >
              View resources
            </a>
          </div>
        </article>


        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Need help?</span>

          <h2>Contact your tutoring team</h2>

          <p>
            Ask about a lesson, assignment, session or technical issue.
          </p>

          <div className="portal-dashboard-simple-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=help&course=${course}`}
            >
              Get help
            </a>
          </div>
        </article>

      </section>

    </div>
  );
}
