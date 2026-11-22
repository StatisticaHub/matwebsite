type SessionItem = {
  id: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  topic: string;
  lesson_notes?: string | null;
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
};

function formatDate(value: string | null) {
  if (!value) return "Not set";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/London",
  }).format(new Date(value));
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
}: Props) {
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
              ? formatDateTime(nextSession.scheduled_for)
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
              href={`${base}?view=timetable&course=${course}`}
            >
              Open timetable
            </a>
          </div>
        </article>

        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Next homework</span>

          <h2>
            {nextHomework
              ? nextHomework.title
              : "Nothing due"}
          </h2>

          <p>
            {nextHomework
              ? nextHomework.due_date
                ? `Due ${formatDate(nextHomework.due_date)}`
                : "No due date"
              : "You have no open homework right now."}
          </p>

          <div className="portal-dashboard-simple-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=assignments&course=${course}`}
            >
              Open assignments
            </a>
          </div>
        </article>

        <article className="portal-dashboard-simple-card">
          <span className="portal-kicker">Current focus</span>

          <h2>
            {currentFocus || subject}
          </h2>

          <p>
            {nextDeadline
              ? `Next deadline ${formatDate(nextDeadline)}`
              : confidence
                ? `Current confidence ${confidence}/5`
                : "Your tutor will keep your current learning priority here."}
          </p>

          <div className="portal-dashboard-simple-actions">
            <a
              className="button button-secondary"
              href={`${base}?view=progress&course=${course}`}
            >
              Open progress
            </a>
          </div>
        </article>
      </section>

      <section className="portal-dashboard-simple-lower">
        <article className="portal-dashboard-recent">
          <div>
            <span className="portal-kicker">Recent lesson</span>

            {recentSession ? (
              <>
                <h2>{recentSession.topic}</h2>

                <p>
                  {formatDateTime(
                    recentSession.completed_at ||
                      recentSession.scheduled_for
                  )}
                  {" · "}
                  {recentSession.duration_minutes} min
                </p>

                {recentSession.lesson_notes && (
                  <small>
                    {recentSession.lesson_notes}
                  </small>
                )}
              </>
            ) : (
              <>
                <h2>No completed lessons yet</h2>
                <p>
                  Your recent learning history will appear here.
                </p>
              </>
            )}
          </div>

          <a
            className="button button-secondary"
            href={`${base}?view=timetable&course=${course}`}
          >
            View lesson history
          </a>
        </article>

        <article className="portal-dashboard-progress-mini">
          <span className="portal-kicker">
            Learning progress
          </span>

          <div className="portal-dashboard-progress-number">
            {averageProgress}%
          </div>

          <div className="portal-progress-track">
            <i
              style={{
                width: `${averageProgress}%`,
              }}
            />
          </div>

          <p>
            {mastered} of {planCount} plan topics mastered
          </p>

          <a
            href={`${base}?view=progress&course=${course}`}
          >
            View full progress
          </a>
        </article>
      </section>

      <section className="portal-dashboard-destinations">
        <a
          href={`${base}?view=files&course=${course}`}
        >
          Files
          <span>Worksheets, notes and uploads</span>
        </a>

        <a
          href={`${base}/recordings?course=${course}`}
        >
          Recordings
          <span>Video and audio lesson library</span>
        </a>

        <a
          href={`${base}?view=support&course=${course}`}
        >
          Support
          <span>Ask your tutoring team</span>
        </a>
      </section>
    </div>
  );
}
