import Link from "next/link";
import { notFound } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedPortalStudent } from "@/lib/student-portal-auth";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Lesson recordings",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: "no-referrer",
};

type Params = Promise<{
  token: string;
}>;

type SearchParams = Promise<{
  course?: string | string[];
}>;

type EngagementRow = {
  id: string;
  subject: string;
  title: string | null;
  status: string;
  tutor_id: string | null;
  tutors:
    | { name: string | null }
    | Array<{ name: string | null }>
    | null;
};

type SessionRow = {
  id: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  topic: string;
  lesson_notes: string | null;
  next_topic: string | null;
  homework_summary: string | null;
  understanding_rating: number | null;
};

type RecordingRow = {
  id: string;
  session_id: string;
  file_type: string | null;
  file_extension: string | null;
  file_size_bytes: number | null;
};

function one<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function formatDateTime(value: string | null) {
  if (!value) return "Date not recorded";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function formatBytes(value: number | null) {
  if (value === null || value < 0) return null;

  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function recordingLabel(fileType: string | null) {
  const value = String(fileType || "").toUpperCase();

  if (value === "MP4") return "Lesson recording";
  if (value === "M4A") return "Audio recording";
  if (value === "VTT" || value === "TRANSCRIPT") return "Transcript";

  return "Lesson file";
}

function actionLabel(fileType: string | null) {
  const value = String(fileType || "").toUpperCase();

  if (value === "MP4") return "Watch recording ↗";
  if (value === "M4A") return "Listen to audio ↗";
  if (value === "VTT" || value === "TRANSCRIPT") return "Open transcript ↗";

  return "Open ↗";
}

export default async function StudentRecordingsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { token } = await params;
  const query = await searchParams;

  const portalAuth =
    await getAuthenticatedPortalStudent(token);

  if (!portalAuth) {
    notFound();
  }

  const link = portalAuth.link;
  const supabase = createAdminClient();

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id,name")
    .eq("id", link.student_id)
    .maybeSingle();

  if (studentError || !student) {
    notFound();
  }

  const { data: engagementData, error: engagementError } = await supabase
    .from("tutoring_engagements")
    .select("id,subject,title,status,tutor_id,tutors(name)")
    .eq("student_id", link.student_id)
    .order("created_at", { ascending: false });

  if (engagementError) {
    throw new Error(engagementError.message);
  }

  const engagements = (engagementData || []) as EngagementRow[];

  const requestedCourse = Array.isArray(query.course)
    ? query.course[0]
    : query.course;

  const selectedEngagement =
    engagements.find((item) => item.id === requestedCourse) ||
    engagements.find((item) => item.status === "active") ||
    engagements[0] ||
    null;

  if (!selectedEngagement) {
    return (
      <div className="student-portal-shell">
        <header className="portal-topbar">
          <Link href="/" className="portal-brand">
            <strong>My Academic Tutor</strong>
            <span>Learning portal</span>
          </Link>

          <div className="portal-topbar-meta">
            <span>Private learning record</span>
            <strong>{student.name}</strong>
          </div>
        </header>

        <main className="portal-recordings-page">
          <div className="portal-recordings-toolbar">
            <Link href={`/portal/${encodeURIComponent(token)}`}>
              ← Back to dashboard
            </Link>
          </div>

          <section className="portal-panel">
            <div className="portal-empty">
              No tutoring courses are available yet.
            </div>
          </section>
        </main>
      </div>
    );
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from("tutoring_sessions")
    .select(
      "id,scheduled_for,completed_at,duration_minutes,topic,lesson_notes,next_topic,homework_summary,understanding_rating"
    )
    .eq("engagement_id", selectedEngagement.id)
    .eq("status", "completed")
    .order("completed_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("scheduled_for", {
      ascending: false,
      nullsFirst: false,
    });

  if (sessionError) {
    throw new Error(sessionError.message);
  }

  const sessions = (sessionData || []) as SessionRow[];
  const sessionIds = sessions.map((item) => item.id);

  let recordingRows: RecordingRow[] = [];

  if (sessionIds.length) {
    const { data, error } = await supabase
      .from("session_recordings")
      .select(
        "id,session_id,file_type,file_extension,file_size_bytes"
      )
      .in("session_id", sessionIds)
      .eq("student_visible", true)
      .eq("status", "completed")
      .in("file_type", [
        "MP4",
        "M4A",
        "VTT",
        "TRANSCRIPT",
      ])
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      throw new Error(error.message);
    }

    recordingRows = (data || []) as RecordingRow[];
  }

  const recordingsBySession = new Map<string, RecordingRow[]>();

  for (const recording of recordingRows) {
    const existing =
      recordingsBySession.get(recording.session_id) || [];

    existing.push(recording);

    recordingsBySession.set(
      recording.session_id,
      existing
    );
  }

  const sessionsWithRecordings = sessions.filter(
    (session) =>
      (recordingsBySession.get(session.id) || []).length > 0
  );

  const tutor = one(selectedEngagement.tutors);

  return (
    <div className="student-portal-shell">
      <header className="portal-topbar">
        <Link href="/" className="portal-brand">
          <strong>My Academic Tutor</strong>
          <span>Learning portal</span>
        </Link>

        <nav
          className="portal-upgrade-nav"
          aria-label="Student portal"
        >
          <Link
            href={`/portal/${encodeURIComponent(
              token
            )}?view=dashboard&course=${encodeURIComponent(
              selectedEngagement.id
            )}`}
          >
            Home
          </Link>

          <span
            className="portal-nav-current"
            aria-current="page"
          >
            Sessions
          </span>

          <Link
            href={`/portal/${encodeURIComponent(
              token
            )}?view=assignments&course=${encodeURIComponent(
              selectedEngagement.id
            )}`}
          >
            Assignments
          </Link>

          <Link
            href={`/portal/${encodeURIComponent(
              token
            )}?view=progress&course=${encodeURIComponent(
              selectedEngagement.id
            )}`}
          >
            Progress
          </Link>

          <Link
            href={`/portal/${encodeURIComponent(
              token
            )}?view=help&course=${encodeURIComponent(
              selectedEngagement.id
            )}`}
          >
            Help
          </Link>
        </nav>


        <div className="portal-topbar-meta">
          <span>Private learning record</span>
          <strong>{student.name}</strong>

          <Link
            href="/portal/logout"
            className="portal-signout"
          >
            Sign out
          </Link>
        </div>
      </header>

      <main className="portal-recordings-page">
        <div className="portal-recordings-toolbar">
          <Link
            href={`/portal/${encodeURIComponent(
              token
            )}?view=calendar&course=${encodeURIComponent(
              selectedEngagement.id
            )}`}
          >
            ← Back to Sessions
          </Link>
        </div>

        <section className="portal-recordings-hero">
          <div>
            <span className="portal-kicker">
              Session archive
            </span>

            <h1>Recordings & transcripts</h1>

            <p>
              Recordings stay connected to completed lessons in
              Sessions. Use this archive when you want to browse all
              available lesson media together.
            </p>
          </div>

          <div className="portal-recordings-summary">
            <span>Available recordings</span>
            <strong>{recordingRows.length}</strong>
            <small>
              {selectedEngagement.subject}
              {tutor?.name ? ` · ${tutor.name}` : ""}
            </small>
          </div>
        </section>

        {engagements.length > 1 && (
          <section className="portal-panel">
            <div className="portal-panel-head">
              <div>
                <span className="portal-kicker">
                  Your courses
                </span>
                <h2>Switch course</h2>
              </div>
            </div>

            <div className="portal-recordings-course-list">
              {engagements.map((item) => {
                const itemTutor = one(item.tutors);

                return (
                  <Link
                    key={item.id}
                    className={
                      item.id === selectedEngagement.id
                        ? "current"
                        : ""
                    }
                    href={`/portal/${encodeURIComponent(
                      token
                    )}/recordings?course=${item.id}`}
                  >
                    <strong>{item.subject}</strong>
                    <span>
                      {itemTutor?.name
                        ? `Tutor: ${itemTutor.name}`
                        : item.title || "Tutoring"}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="portal-panel portal-recordings-library">
          <div className="portal-panel-head">
            <div>
              <span className="portal-kicker">
                Past lessons
              </span>

              <h2>
                {selectedEngagement.subject} lesson media
              </h2>
            </div>

            <span>
              {sessionsWithRecordings.length} lesson
              {sessionsWithRecordings.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="portal-recordings-session-list">
            {sessionsWithRecordings.map((session) => {
              const recordings =
                recordingsBySession.get(session.id) || [];

              return (
                <article
                  className="portal-recordings-session-card"
                  key={session.id}
                >
                  <div className="portal-recordings-session-head">
                    <div>
                      <span>
                        {formatDateTime(
                          session.completed_at ||
                            session.scheduled_for
                        )}
                      </span>

                      <h3>{session.topic}</h3>

                      <small>
                        {session.duration_minutes} min
                        {session.understanding_rating
                          ? ` · Understanding ${session.understanding_rating}/5`
                          : ""}
                      </small>
                    </div>

                    <span className="portal-status session-completed">
                      Completed
                    </span>
                  </div>

                  {session.lesson_notes && (
                    <div className="portal-recordings-note">
                      <span>Lesson summary</span>
                      <p>{session.lesson_notes}</p>
                    </div>
                  )}

                  <div className="portal-recordings-file-list">
                    {recordings.map((recording) => {
                      const size =
                        formatBytes(recording.file_size_bytes);

                      return (
                        <div
                          className="portal-recordings-file"
                          key={recording.id}
                        >
                          <div>
                            <strong>
                              {recordingLabel(
                                recording.file_type
                              )}
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
                            className="button button-secondary"
                            href={`/api/portal/${encodeURIComponent(
                              token
                            )}/recordings/${recording.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {actionLabel(
                              recording.file_type
                            )}
                          </a>
                        </div>
                      );
                    })}
                  </div>

                  {(session.homework_summary ||
                    session.next_topic) && (
                    <div className="portal-recordings-followup">
                      {session.homework_summary && (
                        <div>
                          <span>Practice</span>
                          <p>{session.homework_summary}</p>
                        </div>
                      )}

                      {session.next_topic && (
                        <div>
                          <span>Next focus</span>
                          <p>{session.next_topic}</p>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}

            {!sessionsWithRecordings.length && (
              <div className="portal-empty">
                No lesson recordings are available for this course yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
