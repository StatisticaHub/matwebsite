type LinkedHomework = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
};

type LessonRecording = {
  id: string;
  file_type: string | null;
  file_extension: string | null;
  file_size_bytes: number | null;
};

function formatDate(value: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function recordingLabel(fileType: string | null) {
  const type = String(fileType || "").toUpperCase();

  if (type === "MP4") return "Lesson recording";
  if (type === "M4A") return "Audio recording";
  if (type === "VTT" || type === "TRANSCRIPT") return "Transcript";

  return "Lesson file";
}

function recordingAction(fileType: string | null) {
  const type = String(fileType || "").toUpperCase();

  if (type === "MP4") return "Watch recording ↗";
  if (type === "M4A") return "Listen to audio ↗";
  if (type === "VTT" || type === "TRANSCRIPT") return "Open transcript ↗";

  return "Open ↗";
}

function formatBytes(value: number | null) {
  if (value === null || value < 0) return null;

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StudentLessonContinuityRecord({
  token,
  courseId,
  lessonNotes,
  understandingRating,
  homeworkSummary,
  nextTopic,
  linkedHomework,
  recordings,
}: {
  token: string;
  sessionId: string;
  courseId: string | null;
  lessonNotes: string | null;
  understandingRating: number | null;
  homeworkSummary: string | null;
  nextTopic: string | null;
  linkedHomework: LinkedHomework[];
  recordings: LessonRecording[];
}) {
  const progressHref = courseId
    ? `/portal/${encodeURIComponent(token)}?view=progress&course=${encodeURIComponent(courseId)}`
    : `/portal/${encodeURIComponent(token)}?view=progress`;

  return (
    <div className="portal-lesson-continuity">
      <div className="portal-lesson-continuity-top">
        <div>
          <span className="portal-continuity-label">
            Lesson summary
          </span>

          <p>
            {lessonNotes ||
              "Your tutor has completed this lesson record."}
          </p>
        </div>

        <div className="portal-continuity-progress">
          <span>Understanding</span>
          <strong>
            {understandingRating
              ? `${understandingRating}/5`
              : "Not rated"}
          </strong>

          <a href={progressHref}>
            View progress →
          </a>
        </div>
      </div>

      {recordings.length > 0 && (
        <section className="portal-session-recordings portal-session-recordings-embedded">
          <span className="portal-session-recordings-label">
            Lesson recordings
          </span>

          <div className="portal-session-recordings-list">
            {recordings.map((recording) => {
              const size = formatBytes(recording.file_size_bytes);

              return (
                <div
                  className="portal-session-recording"
                  key={recording.id}
                >
                  <div>
                    <strong>
                      {recordingLabel(recording.file_type)}
                    </strong>

                    <small>
                      {[
                        recording.file_extension ||
                          recording.file_type,
                        size,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>

                  <a
                    className="button button-secondary portal-recording-button"
                    href={`/api/portal/${encodeURIComponent(
                      token
                    )}/recordings/${recording.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {recordingAction(recording.file_type)}
                  </a>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {(linkedHomework.length > 0 || homeworkSummary) && (
        <section className="portal-continuity-section">
          <span className="portal-continuity-label">
            Practice after this lesson
          </span>

          {linkedHomework.length > 0 ? (
            <div className="portal-continuity-homework-list">
              {linkedHomework.map((item) => (
                <article key={item.id}>
                  <div>
                    <strong>{item.title}</strong>

                    {item.description && (
                      <p>{item.description}</p>
                    )}

                    <small>
                      {item.due_date
                        ? `Due ${formatDate(item.due_date)}`
                        : "No due date"}
                    </small>
                  </div>

                  <span className={`portal-status homework-${item.status}`}>
                    {statusLabel(item.status)}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p>{homeworkSummary}</p>
          )}
        </section>
      )}

      <section className="portal-continuity-section portal-continuity-next">
        <span className="portal-continuity-label">
          What happens next
        </span>

        <strong>
          {nextTopic
            ? nextTopic
            : "Continue from this lesson in your next tutoring session."}
        </strong>

        <small>
          Review the recording and complete any assigned practice before
          your next lesson.
        </small>
      </section>
    </div>
  );
}
