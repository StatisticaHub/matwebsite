type SessionItem = {
  id: string;
  created_at?: string | null;
  scheduled_for: string | null;
  completed_at?: string | null;
  duration_minutes: number;
  status: string;
  topic: string;
};

type HomeworkItem = {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
};

type MaterialItem = {
  created_at?: string | null;
};

type SubmissionItem = {
  submitted_at: string;
};

type RecordingItem = {
  id: string;
};

type Props = {
  token: string;
  courseId: string;
  nextSession: SessionItem | null;
  nextMeetingUrl: string | null;
  openHomework: HomeworkItem[];
  sessions: SessionItem[];
  learningMaterials: MaterialItem[];
  submissions: SubmissionItem[];
  recordingsBySession: Map<string, RecordingItem[]>;
  tutorName?: string | null;
};

function londonParts(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

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

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

function mondayFor(value: string | Date) {
  const { year, month, day } = londonParts(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = date.getUTCDay();
  const offset = weekday === 0 ? -6 : 1 - weekday;
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}

function inCurrentWeek(value: string | null | undefined) {
  if (!value) return false;

  const nowMonday = mondayFor(new Date()).getTime();
  const itemMonday = mondayFor(value).getTime();

  return itemMonday === nowMonday;
}

function weekLabel() {
  const start = mondayFor(new Date());
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const startText = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(start);

  const endText = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(end);

  return `${startText} – ${endText}`;
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

function formatDate(value: string | null) {
  if (!value) return "No due date";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default function StudentThisWeekCommandCentre({
  token,
  courseId,
  nextSession,
  nextMeetingUrl,
  openHomework,
  sessions,
  learningMaterials,
  submissions,
  recordingsBySession,
  tutorName,
}: Props) {
  const thisWeekSessions = sessions.filter((item) =>
    inCurrentWeek(
      item.completed_at ||
        item.scheduled_for ||
        item.created_at ||
        null
    )
  );

  const thisWeekRecordingCount = thisWeekSessions.reduce(
    (sum, session) =>
      sum + (recordingsBySession.get(session.id)?.length || 0),
    0
  );

  const filesThisWeek = learningMaterials.filter((item) =>
    inCurrentWeek(item.created_at)
  ).length;

  const submissionsThisWeek = submissions.filter((item) =>
    inCurrentWeek(item.submitted_at)
  ).length;

  const nextHomework = openHomework[0] || null;

  const base = `/portal/${encodeURIComponent(token)}`;
  const course = encodeURIComponent(courseId);

  return (
    <section className="portal-this-week-command" id="this-week">
      <div className="portal-this-week-head">
        <div>
          <span className="portal-kicker">This week</span>
          <h2>{weekLabel()}</h2>
          <p>
            Everything you need for the week — lesson, practice,
            recordings, files and submitted work.
          </p>
        </div>

        <a
          className="portal-this-week-history-link"
          href="#weekly"
        >
          View weekly learning record ↓
        </a>
      </div>

      <div className="portal-this-week-main">
        <article className="portal-this-week-session">
          <div className="portal-this-week-card-label">
            Next lesson
          </div>

          {nextSession ? (
            <>
              <h3>{nextSession.topic}</h3>

              <p className="portal-this-week-session-time">
                {formatDateTime(nextSession.scheduled_for)}
              </p>

              <small>
                {nextSession.duration_minutes} minutes
                {tutorName ? ` · ${tutorName}` : ""}
              </small>

              <div className="portal-this-week-actions">
                {nextMeetingUrl && (
                  <a
                    className="button button-primary"
                    href={nextMeetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join lesson ↗
                  </a>
                )}

                <a
                  className="button button-secondary"
                  href={`${base}?view=timetable&course=${course}`}
                >
                  Open timetable →
                </a>
              </div>
            </>
          ) : (
            <>
              <h3>No lesson booked yet</h3>
              <p>
                Request your next lesson when you are ready to continue.
              </p>

              <div className="portal-this-week-actions">
                <a
                  className="button button-primary"
                  href={`${base}?view=dashboard&course=${course}#session-request`}
                >
                  Request next lesson →
                </a>

                <a
                  className="button button-secondary"
                  href={`${base}?view=timetable&course=${course}`}
                >
                  View timetable →
                </a>
              </div>
            </>
          )}
        </article>

        <div className="portal-this-week-priority-grid">
          <a
            className="portal-this-week-priority is-homework"
            href={`${base}?view=assignments&course=${course}`}
          >
            <span>Homework</span>
            <strong>
              {nextHomework ? nextHomework.title : "Nothing due"}
            </strong>
            <small>
              {nextHomework
                ? nextHomework.due_date
                  ? `Due ${formatDate(nextHomework.due_date)}`
                  : "No due date"
                : "You're clear for now"}
            </small>
          </a>

          <a
            className="portal-this-week-priority"
            href={`${base}/recordings?course=${course}`}
          >
            <span>Recordings</span>
            <strong>{thisWeekRecordingCount}</strong>
            <small>
              {thisWeekRecordingCount === 1
                ? "recording available this week"
                : "recordings available this week"}
            </small>
          </a>

          <a
            className="portal-this-week-priority"
            href={`${base}?view=files&course=${course}`}
          >
            <span>Files</span>
            <strong>{filesThisWeek}</strong>
            <small>
              {filesThisWeek === 1
                ? "file added this week"
                : "files added this week"}
            </small>
          </a>

          <a
            className="portal-this-week-priority"
            href={`${base}?view=assignments&course=${course}`}
          >
            <span>Your work</span>
            <strong>{submissionsThisWeek}</strong>
            <small>
              {submissionsThisWeek === 1
                ? "submission this week"
                : "submissions this week"}
            </small>
          </a>
        </div>
      </div>
    </section>
  );
}
