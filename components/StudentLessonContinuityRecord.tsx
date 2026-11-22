import PortalSessionRecordings from "@/components/PortalSessionRecordings";

type LinkedHomework = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
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

export default function StudentLessonContinuityRecord({
  token,
  sessionId,
  courseId,
  lessonNotes,
  understandingRating,
  homeworkSummary,
  nextTopic,
  linkedHomework,
}: {
  token: string;
  sessionId: string;
  courseId: string | null;
  lessonNotes: string | null;
  understandingRating: number | null;
  homeworkSummary: string | null;
  nextTopic: string | null;
  linkedHomework: LinkedHomework[];
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

      <PortalSessionRecordings
        token={token}
        sessionId={sessionId}
        embedded
      />

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
