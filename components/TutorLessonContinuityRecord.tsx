import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";
import TutorSessionRecordings from "@/components/TutorSessionRecordings";

type HomeworkRow = {
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

export default async function TutorLessonContinuityRecord({
  sessionId,
  engagementId,
  studentName,
  subject,
  lessonNotes,
  understandingRating,
  homeworkSummary,
  nextTopic,
}: {
  sessionId: string;
  engagementId: string | null;
  studentName: string;
  subject: string;
  lessonNotes: string | null;
  understandingRating: number | null;
  homeworkSummary: string | null;
  nextTopic: string | null;
}) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("homework")
    .select("id,title,description,due_date,status")
    .eq("source_session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Could not load session-linked homework:", error);
  }

  const linkedHomework = (data || []) as HomeworkRow[];

  return (
    <section className="tutor-panel tutor-continuity-panel">
      <div className="tutor-panel-head">
        <div>
          <span className="tutor-eyebrow">
            Lesson continuity
          </span>
          <h2>One lesson record</h2>
          <p className="tutor-help">
            {studentName} · {subject}
          </p>
        </div>

        <div className="tutor-continuity-score">
          <span>Understanding</span>
          <strong>
            {understandingRating
              ? `${understandingRating}/5`
              : "Not rated"}
          </strong>
        </div>
      </div>

      <div className="tutor-continuity-grid">
        <section>
          <span className="tutor-continuity-label">
            What we covered
          </span>

          <p>
            {lessonNotes ||
              "Add lesson notes below to complete the academic record."}
          </p>
        </section>

        <section>
          <span className="tutor-continuity-label">
            Practice / homework
          </span>

          {linkedHomework.length > 0 ? (
            <div className="tutor-continuity-homework-list">
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

                  <span className={`tutor-status ${item.status}`}>
                    {statusLabel(item.status)}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p>
              {homeworkSummary ||
                "No practice has been recorded for this lesson yet."}
            </p>
          )}
        </section>

        <section className="tutor-continuity-next">
          <span className="tutor-continuity-label">
            Next teaching focus
          </span>

          <strong>
            {nextTopic ||
              "Set the next topic in the session record below."}
          </strong>
        </section>
      </div>

      <TutorSessionRecordings
        sessionId={sessionId}
        embedded
      />

      {engagementId && (
        <div className="tutor-continuity-footer">
          <Link
            className="tutor-primary-link"
            href={`/tutor/progress/${engagementId}`}
          >
            Update student progress →
          </Link>
        </div>
      )}
    </section>
  );
}
