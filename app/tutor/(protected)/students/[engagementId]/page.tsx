import TutorStudentActivityTimeline from "@/components/TutorStudentActivityTimeline";
import TutorStudentCommunicationTimeline from "@/components/TutorStudentCommunicationTimeline";
import TutorStudentSupportRequests from "@/components/TutorStudentSupportRequests";
import Link from "next/link";
import { notFound } from "next/navigation";

import LearningMaterialUploadForm from "@/components/LearningMaterialUploadForm";
import TutorWeeklyHomework from "@/components/TutorWeeklyHomework";
import LearningMaterialsList, {
  type LearningMaterialListItem,
} from "@/components/LearningMaterialsList";

import {
  assignTutorSessionToWeek,
  changeTutorWeekStatus,
  createTutorSessionInWeekManaged,
  createTutorWeek,
  removeTutorSessionFromWeek,
  updateTutorWeek,
} from "@/app/tutor/week-actions";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";


export const dynamic = "force-dynamic";


type Params = Promise<{
  engagementId: string;
}>;


type WeekRow = {
  id: string;
  engagement_id: string;

  week_number: number;

  week_start: string;
  week_end: string;

  title: string;

  focus: string | null;

  objectives: string[];

  student_summary:
    | string
    | null;

  tutor_notes:
    | string
    | null;

  status:
    | "draft"
    | "published"
    | "completed";
};


type SessionRow = {
  id: string;
  engagement_id: string;

  week_id:
    | string
    | null;

  week_position:
    | number
    | null;

  scheduled_for:
    | string
    | null;

  completed_at:
    | string
    | null;

  duration_minutes: number;

  status: string;

  topic: string;

  lesson_notes:
    | string
    | null;

  homework_summary:
    | string
    | null;

  next_topic:
    | string
    | null;
};


type MaterialRow =
  LearningMaterialListItem & {
    week_id:
      | string
      | null;

    session_id:
      | string
      | null;
  };


function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
    },
  ).format(
    new Date(
      `${value}T12:00:00`,
    ),
  );
}


function formatDateTime(
  value:
    | string
    | null,
) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone:
        "Europe/London",
    },
  ).format(
    new Date(value),
  );
}


function weekStatusLabel(
  status: string,
) {
  if (
    status === "published"
  ) {
    return "Published";
  }

  if (
    status === "completed"
  ) {
    return "Completed";
  }

  return "Draft";
}


export default async function TutorStudentWeeklyWorkspace({
  params,
}: {
  params: Params;
}) {
  const auth =
    await getTutorSession();

  if (!auth) {
    return null;
  }

  const tutorTimeZone =
    normalizeTimeZone(
      auth.tutor.timezone,
      DEFAULT_TIME_ZONE,
    );

  const formatDateTime = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      tutorTimeZone,
    );

  const {
    engagementId,
  } = await params;

  const supabase =
    createAdminClient();


  const [
    engagementResult,
    weekResult,
    sessionResult,
    materialResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "tutoring_engagements",
        )
        .select(`
          id,
          student_id,
          tutor_id,
          status,
          subject,
          title,
          module,
          goal,
          target,
          current_focus,
          frequency,
          session_duration_minutes,
          upcoming_deadline,
          students (
            id,
            name,
            email,
            academic_level,
            institution,
            programme
          )
        `)
        .eq(
          "id",
          engagementId,
        )
        .eq(
          "tutor_id",
          auth.tutor.id,
        )
        .maybeSingle(),

      supabase
        .from(
          "tutoring_weeks",
        )
        .select("*")
        .eq(
          "engagement_id",
          engagementId,
        )
        .order(
          "week_number",
          {
            ascending: false,
          },
        ),

      supabase
        .from(
          "tutoring_sessions",
        )
        .select(`
          id,
          engagement_id,
          week_id,
          week_position,
          scheduled_for,
          completed_at,
          duration_minutes,
          status,
          topic,
          lesson_notes,
          homework_summary,
          next_topic
        `)
        .eq(
          "engagement_id",
          engagementId,
        )
        .order(
          "scheduled_for",
          {
            ascending: true,
            nullsFirst: false,
          },
        ),

      supabase
        .from(
          "learning_materials",
        )
        .select(`
          id,
          created_at,
          title,
          description,
          category,
          uploaded_by_role,
          original_filename,
          mime_type,
          size_bytes,
          week_id,
          session_id
        `)
        .eq(
          "engagement_id",
          engagementId,
        )
        .eq(
          "status",
          "active",
        )
        .eq(
          "visible_to_tutor",
          true,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        ),
    ]);


  if (
    engagementResult.error ||
    !engagementResult.data
  ) {
    notFound();
  }


  if (weekResult.error) {
    throw new Error(
      weekResult.error.message,
    );
  }


  if (sessionResult.error) {
    throw new Error(
      sessionResult.error.message,
    );
  }


  if (materialResult.error) {
    throw new Error(
      materialResult.error.message,
    );
  }


  const engagement =
    engagementResult.data as any;


  const rawStudent =
    engagement.students;


  const student =
    Array.isArray(
      rawStudent,
    )
      ? rawStudent[0]
      : rawStudent;


  const weeks =
    (
      weekResult.data ||
      []
    ) as WeekRow[];


  const sessions =
    (
      sessionResult.data ||
      []
    ) as SessionRow[];


  const materials =
    (
      materialResult.data ||
      []
    ) as MaterialRow[];


  const unassignedSessions =
    sessions.filter(
      (session) =>
        !session.week_id,
    );


  const nextWeekNumber =
    weeks.length
      ? Math.max(
          ...weeks.map(
            (week) =>
              week.week_number,
          ),
        ) + 1
      : 1;


  const activeWeek =
    weeks.find(
      (week) =>
        week.status ===
        "published",
    ) ||
    weeks.find(
      (week) =>
        week.status ===
        "draft",
    ) ||
    null;


  return (
    <div className="tutor-page">

      <div className="tutor-breadcrumb">

        <Link href="/tutor/students">
          ← Students
        </Link>

        <span>
          {student?.name ||
            "Student"}
        </span>

      </div>


      <header className="tutor-page-head">

        <div>

          <span className="tutor-eyebrow">
            Weekly learning
            workspace
          </span>

          <h1>
            {student?.name ||
              "Student"}
          </h1>

          <p>
            {engagement.subject}
            {engagement.module
              ? ` · ${engagement.module}`
              : ""}
          </p>

        </div>


        <div className="tutor-head-actions">

          <Link
            className="tutor-secondary-button"
            href="/tutor/sessions"
          >
            Sessions
          </Link>

          <Link
            className="tutor-secondary-button"
            href={`/tutor/materials?engagement=${encodeURIComponent(
              engagement.id,
            )}`}
          >
            All materials
          </Link>

        </div>

      </header>


      <section className="tutor-metric-grid">

        <article>
          <span>
            Subject
          </span>

          <strong>
            {
              engagement.subject
            }
          </strong>
        </article>


        <article>
          <span>
            Current week
          </span>

          <strong>
            {activeWeek
              ? `Week ${activeWeek.week_number}`
              : "Not set"}
          </strong>
        </article>


        <article>
          <span>
            Total sessions
          </span>

          <strong>
            {
              sessions.length
            }
          </strong>
        </article>


        <article>
          <span>
            Needs organising
          </span>

          <strong>
            {
              unassignedSessions.length
            }
          </strong>
        </article>

      </section>


      <TutorStudentActivityTimeline
        engagementId={engagement.id}
      />


      <TutorStudentCommunicationTimeline
        engagementId={engagement.id}
      />


      <TutorStudentSupportRequests
        engagementId={engagement.id}
      />


      <details className="tutor-panel tutor-week-create">

        <summary>
          <strong>
            + Create Week {
              nextWeekNumber
            }
          </strong>

          <span>
            Plan the next stage of
            learning
          </span>
        </summary>


        <form
          action={
            createTutorWeek
          }
          className="tutor-form"
        >

          <input
            type="hidden"
            name="engagementId"
            value={
              engagement.id
            }
          />


          <div className="tutor-form-grid">

            <label>

              <span>
                Week number
              </span>

              <input
                name="weekNumber"
                type="number"
                min="1"
                defaultValue={
                  nextWeekNumber
                }
                required
              />

            </label>


            <label>

              <span>
                Week title
              </span>

              <input
                name="title"
                maxLength={200}
                placeholder="Regression inference"
                required
              />

            </label>

          </div>


          <div className="tutor-form-grid">

            <label>

              <span>
                Start date
              </span>

              <input
                name="weekStart"
                type="date"
                required
              />

            </label>


            <label>

              <span>
                End date
              </span>

              <input
                name="weekEnd"
                type="date"
                required
              />

            </label>

          </div>


          <label>

            <span>
              Weekly focus
            </span>

            <textarea
              name="focus"
              placeholder="Main topic or academic focus for this week"
            />

          </label>


          <label>

            <span>
              Objectives
            </span>

            <textarea
              name="objectives"
              placeholder={
                "One objective per line\nInterpret regression coefficients\nConstruct confidence intervals\nPractise hypothesis testing"
              }
            />

            <small>
              One objective per
              line.
            </small>

          </label>


          <label>

            <span>
              Student-visible
              summary
            </span>

            <textarea
              name="studentSummary"
              placeholder="Explain what the student will work on and what success should look like this week."
            />

          </label>


          <label>

            <span>
              Private tutor notes
            </span>

            <textarea
              name="tutorNotes"
              placeholder="Internal planning notes. These will not be shown to the student."
            />

          </label>


          <button
            className="tutor-primary-button"
            type="submit"
          >
            Create week
          </button>

        </form>

      </details>


      <div className="tutor-week-stack">

        {weeks.map(
          (week) => {

            const weekSessions =
              sessions
                .filter(
                  (session) =>
                    session.week_id ===
                    week.id,
                )
                .sort(
                  (
                    a,
                    b,
                  ) =>
                    Number(
                      a.week_position ||
                        999,
                    ) -
                    Number(
                      b.week_position ||
                        999,
                    ),
                );


            const generalWeekMaterials =
              materials.filter(
                (material) =>
                  material.week_id ===
                    week.id &&
                  !material.session_id,
              );


            return (
              <article
                className="tutor-panel tutor-week-card"
                key={
                  week.id
                }
              >

                <header className="tutor-week-head">

                  <div>

                    <span className="tutor-eyebrow">
                      Week{" "}
                      {
                        week.week_number
                      }
                      {" · "}
                      {formatDate(
                        week.week_start,
                      )}
                      {" – "}
                      {formatDate(
                        week.week_end,
                      )}
                    </span>

                    <h2>
                      {
                        week.title
                      }
                    </h2>

                    {week.focus && (
                      <p>
                        {
                          week.focus
                        }
                      </p>
                    )}

                  </div>


                  <span
                    className={`tutor-week-status is-${week.status}`}
                  >
                    {weekStatusLabel(
                      week.status,
                    )}
                  </span>

                </header>


                {week.objectives.length >
                  0 && (
                  <section className="tutor-week-objectives">

                    <span className="tutor-panel-kicker">
                      Objectives
                    </span>

                    <ol>

                      {week.objectives.map(
                        (
                          objective,
                          index,
                        ) => (
                          <li
                            key={`${week.id}-${index}`}
                          >
                            {
                              objective
                            }
                          </li>
                        ),
                      )}

                    </ol>

                  </section>
                )}


                {week.student_summary && (
                  <section className="tutor-week-summary">

                    <span className="tutor-panel-kicker">
                      Student summary
                    </span>

                    <p>
                      {
                        week.student_summary
                      }
                    </p>

                  </section>
                )}


                <section className="tutor-week-materials">

                  <div className="tutor-panel-head">

                    <div>

                      <span className="tutor-panel-kicker">
                        Whole week
                      </span>

                      <h3>
                        Weekly materials
                      </h3>

                    </div>

                  </div>


                  <LearningMaterialsList
                    materials={
                      generalWeekMaterials
                    }
                    viewerRole="tutor"
                    downloadBaseUrl="/api/tutor/materials"
                    emptyText="No general weekly materials yet."
                  />


                  <details>

                    <summary>
                      + Upload weekly
                      material
                    </summary>

                    <LearningMaterialUploadForm
                      role="tutor"
                      endpoint="/api/tutor/materials"
                      engagementId={
                        engagement.id
                      }
                      studentId={
                        engagement.student_id
                      }
                      weekId={
                        week.id
                      }
                      defaultCategory="lesson_material"
                      compact
                    />

                  </details>

                </section>


                <section className="tutor-week-sessions">

                  <div className="tutor-panel-head">

                    <div>

                      <span className="tutor-panel-kicker">
                        Teaching
                      </span>

                      <h3>
                        Sessions
                      </h3>

                    </div>

                    <span>
                      {
                        weekSessions.length
                      }{" "}
                      session
                      {weekSessions.length ===
                      1
                        ? ""
                        : "s"}
                    </span>

                  </div>


                  <TutorWeeklyHomework
                    engagementId={
                      engagement.id
                    }
                    weekId={
                      week.id
                    }
                    sessions={sessions
                      .filter(
                        (item) =>
                          item.week_id ===
                          week.id,
                      )
                      .map(
                        (item) => ({
                          id:
                            item.id,

                          topic:
                            item.topic,

                          scheduled_for:
                            item.scheduled_for,

                          week_position:
                            item.week_position,
                        }),
                      )}
                  />


                  <details className="tutor-week-create-session">

                    <summary>
                      + Schedule a new session in this week
                    </summary>


                    <form
                      action={
                        createTutorSessionInWeekManaged
                      }
                      className="tutor-form"
                    >

                      <input
                        type="hidden"
                        name="weekId"
                        value={
                          week.id
                        }
                      />


                      <div className="tutor-form-grid">

                        <label>

                          <span>
                            Date & time
                            (UK)
                          </span>

                          <input
                            name="scheduledFor"
                            type="datetime-local"
                            min={`${week.week_start}T00:00`}
                            max={`${week.week_end}T23:59`}
                            required
                          />

                        </label>


                        <label>

                          <span>
                            Duration
                          </span>

                          <input
                            name="durationMinutes"
                            type="number"
                            min="15"
                            max="480"
                            defaultValue={
                              engagement.session_duration_minutes ||
                              60
                            }
                            required
                          />

                        </label>

                      </div>


                      <label>

                        <span>
                          Session topic
                        </span>

                        <input
                          name="topic"
                          maxLength={500}
                          placeholder="e.g. Confidence intervals and hypothesis testing"
                          required
                        />

                      </label>


                      <label className="tutor-week-zoom-toggle">

                        <input
                          name="createZoomMeeting"
                          type="checkbox"
                          defaultChecked
                        />

                        <span>

                          <strong>
                            Create managed MAT Zoom meeting
                          </strong>

                          <small>
                            Recommended. MAT creates the student join link automatically and prevents clashes on the shared Zoom host.
                          </small>

                        </span>

                      </label>


                      <details className="tutor-week-manual-meeting">

                        <summary>
                          Use a manual meeting link instead
                        </summary>

                        <label>

                          <span>
                            Manual meeting link
                          </span>

                          <input
                            name="meetingUrl"
                            type="url"
                            placeholder="https://..."
                          />

                        </label>

                        <small>
                          Untick managed MAT Zoom above when using your own meeting link.
                        </small>

                      </details>


                      <label>

                        <span>
                          Preparation /
                          tutor note
                        </span>

                        <textarea
                          name="lessonNotes"
                          placeholder="What should be prepared or covered in this lesson?"
                        />

                      </label>


                      <label className="tutor-week-notify-toggle">

                        <input
                          name="notifyStudent"
                          type="checkbox"
                          defaultChecked
                        />

                        <span>
                          Email the student
                          when this session
                          is scheduled
                        </span>

                      </label>


                      <button
                        className="tutor-primary-button"
                        type="submit"
                      >
                        Schedule session
                      </button>

                    </form>

                  </details>


                  <div className="tutor-week-session-stack">

                    {weekSessions.map(
                      (
                        session,
                        index,
                      ) => {

                        const sessionMaterials =
                          materials.filter(
                            (material) =>
                              material.session_id ===
                              session.id,
                          );


                        return (
                          <article
                            className="tutor-week-session"
                            key={
                              session.id
                            }
                          >

                            <div className="tutor-week-session-number">

                              <span>
                                Session
                              </span>

                              <strong>
                                {
                                  index +
                                  1
                                }
                              </strong>

                            </div>


                            <div className="tutor-week-session-body">

                              <div className="tutor-week-session-title">

                                <div>

                                  <span>
                                    {formatDateTime(
                                      session.scheduled_for,
                                    )}
                                    {" · "}
                                    {
                                      session.duration_minutes
                                    }{" "}
                                    min
                                  </span>

                                  <h4>
                                    {
                                      session.topic
                                    }
                                  </h4>

                                </div>

                                <span>
                                  {
                                    session.status
                                  }
                                </span>

                              </div>


                              {session.lesson_notes && (
                                <div className="tutor-week-session-note">

                                  <strong>
                                    Lesson notes
                                  </strong>

                                  <p>
                                    {
                                      session.lesson_notes
                                    }
                                  </p>

                                </div>
                              )}


                              {session.homework_summary && (
                                <div className="tutor-week-session-note">

                                  <strong>
                                    Homework /
                                    practice
                                  </strong>

                                  <p>
                                    {
                                      session.homework_summary
                                    }
                                  </p>

                                </div>
                              )}


                              <div className="tutor-week-session-materials">

                                <strong>
                                  Session
                                  materials
                                </strong>

                                <LearningMaterialsList
                                  materials={
                                    sessionMaterials
                                  }
                                  viewerRole="tutor"
                                  downloadBaseUrl="/api/tutor/materials"
                                  emptyText="No material attached to this session yet."
                                />


                                <details>

                                  <summary>
                                    + Add material
                                    to this session
                                  </summary>

                                  <LearningMaterialUploadForm
                                    role="tutor"
                                    endpoint="/api/tutor/materials"
                                    engagementId={
                                      engagement.id
                                    }
                                    studentId={
                                      engagement.student_id
                                    }
                                    weekId={
                                      week.id
                                    }
                                    sessionId={
                                      session.id
                                    }
                                    defaultCategory="lesson_material"
                                    compact
                                  />

                                </details>

                              </div>


                              <div className="tutor-week-session-actions">

                                <Link
                                  href={`/tutor/sessions/${session.id}`}
                                >
                                  Open session
                                  →
                                </Link>


                                <form
                                  action={
                                    removeTutorSessionFromWeek
                                  }
                                >

                                  <input
                                    type="hidden"
                                    name="weekId"
                                    value={
                                      week.id
                                    }
                                  />

                                  <input
                                    type="hidden"
                                    name="sessionId"
                                    value={
                                      session.id
                                    }
                                  />

                                  <button
                                    type="submit"
                                  >
                                    Remove from
                                    week
                                  </button>

                                </form>

                              </div>

                            </div>

                          </article>
                        );
                      },
                    )}


                    {!weekSessions.length && (
                      <div className="tutor-empty">
                        No sessions have
                        been assigned to
                        this week yet.
                      </div>
                    )}

                  </div>


                  {unassignedSessions.length >
                    0 && (
                    <form
                      action={
                        assignTutorSessionToWeek
                      }
                      className="tutor-week-assign"
                    >

                      <input
                        type="hidden"
                        name="weekId"
                        value={
                          week.id
                        }
                      />


                      <label>

                        <span>
                          Add an existing
                          session
                        </span>

                        <select
                          name="sessionId"
                          defaultValue=""
                          required
                        >

                          <option
                            value=""
                            disabled
                          >
                            Select session…
                          </option>

                          {unassignedSessions.map(
                            (
                              session,
                            ) => (
                              <option
                                key={
                                  session.id
                                }
                                value={
                                  session.id
                                }
                              >
                                {formatDateTime(
                                  session.scheduled_for,
                                )}
                                {" — "}
                                {
                                  session.topic
                                }
                              </option>
                            ),
                          )}

                        </select>

                      </label>


                      <button
                        className="tutor-secondary-button"
                        type="submit"
                      >
                        Add to week
                      </button>

                    </form>
                  )}

                </section>


                <footer className="tutor-week-footer">

                  <details>

                    <summary>
                      Edit weekly plan
                    </summary>


                    <form
                      action={
                        updateTutorWeek
                      }
                      className="tutor-form"
                    >

                      <input
                        type="hidden"
                        name="weekId"
                        value={
                          week.id
                        }
                      />


                      <div className="tutor-form-grid">

                        <label>

                          <span>
                            Start date
                          </span>

                          <input
                            name="weekStart"
                            type="date"
                            defaultValue={
                              week.week_start
                            }
                            required
                          />

                        </label>


                        <label>

                          <span>
                            End date
                          </span>

                          <input
                            name="weekEnd"
                            type="date"
                            defaultValue={
                              week.week_end
                            }
                            required
                          />

                        </label>

                      </div>


                      <label>

                        <span>
                          Title
                        </span>

                        <input
                          name="title"
                          defaultValue={
                            week.title
                          }
                          required
                        />

                      </label>


                      <label>

                        <span>
                          Focus
                        </span>

                        <textarea
                          name="focus"
                          defaultValue={
                            week.focus ||
                            ""
                          }
                        />

                      </label>


                      <label>

                        <span>
                          Objectives
                        </span>

                        <textarea
                          name="objectives"
                          defaultValue={
                            week.objectives.join(
                              "\n",
                            )
                          }
                        />

                      </label>


                      <label>

                        <span>
                          Student summary
                        </span>

                        <textarea
                          name="studentSummary"
                          defaultValue={
                            week.student_summary ||
                            ""
                          }
                        />

                      </label>


                      <label>

                        <span>
                          Private notes
                        </span>

                        <textarea
                          name="tutorNotes"
                          defaultValue={
                            week.tutor_notes ||
                            ""
                          }
                        />

                      </label>


                      <button
                        className="tutor-primary-button"
                        type="submit"
                      >
                        Save changes
                      </button>

                    </form>

                  </details>


                  <div className="tutor-week-status-actions">

                    {week.status !==
                      "draft" && (
                      <form
                        action={
                          changeTutorWeekStatus
                        }
                      >

                        <input
                          type="hidden"
                          name="weekId"
                          value={
                            week.id
                          }
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="draft"
                        />

                        <button
                          type="submit"
                        >
                          Draft
                        </button>

                      </form>
                    )}


                    {week.status !==
                      "published" && (
                      <form
                        action={
                          changeTutorWeekStatus
                        }
                      >

                        <input
                          type="hidden"
                          name="weekId"
                          value={
                            week.id
                          }
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="published"
                        />

                        <button
                          className="tutor-primary-button"
                          type="submit"
                        >
                          Publish
                        </button>

                      </form>
                    )}


                    {week.status !==
                      "completed" && (
                      <form
                        action={
                          changeTutorWeekStatus
                        }
                      >

                        <input
                          type="hidden"
                          name="weekId"
                          value={
                            week.id
                          }
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="completed"
                        />

                        <button
                          type="submit"
                        >
                          Complete
                        </button>

                      </form>
                    )}

                  </div>

                </footer>

              </article>
            );
          },
        )}

      </div>


      {!weeks.length && (
        <section className="tutor-panel tutor-empty">

          <h2>
            No weekly plan yet
          </h2>

          <p>
            Create Week 1 above and
            then place this student's
            sessions and materials
            inside it.
          </p>

        </section>
      )}


      {unassignedSessions.length >
        0 && (
        <section className="tutor-panel tutor-unsorted-sessions">

          <div className="tutor-panel-head">

            <div>

              <span className="tutor-panel-kicker">
                Needs organising
              </span>

              <h2>
                Sessions not assigned
                to a week
              </h2>

            </div>

            <strong>
              {
                unassignedSessions.length
              }
            </strong>

          </div>


          <div className="tutor-list">

            {unassignedSessions.map(
              (session) => (
                <Link
                  href={`/tutor/sessions/${session.id}`}
                  key={
                    session.id
                  }
                >

                  <div>

                    <strong>
                      {
                        session.topic
                      }
                    </strong>

                    <span>
                      {formatDateTime(
                        session.scheduled_for,
                      )}
                    </span>

                  </div>


                  <span>
                    {
                      session.duration_minutes
                    }{" "}
                    min
                  </span>

                </Link>
              ),
            )}

          </div>

        </section>
      )}

    </div>
  );
}
