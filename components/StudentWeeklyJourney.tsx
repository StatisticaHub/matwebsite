import LearningMaterialUploadForm from "@/components/LearningMaterialUploadForm";

import StudentWeeklyHomework from "@/components/StudentWeeklyHomework";

import LearningMaterialsList, {
  type LearningMaterialListItem,
} from "@/components/LearningMaterialsList";

import { createAdminClient } from "@/lib/supabase/admin";
import { safeExternalUrl } from "@/lib/student-portal";
import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";


type WeekRow = {
  id: string;
  week_number: number;
  week_start: string;
  week_end: string;
  title: string;
  focus: string | null;
  objectives: string[];
  student_summary: string | null;
  status: "published" | "completed";
};


type SessionRow = {
  id: string;
  week_id: string | null;
  week_position: number | null;
  scheduled_for: string | null;
  duration_minutes: number;
  status: string;
  topic: string;
  lesson_notes: string | null;
  homework_summary: string | null;
  next_topic: string | null;
  meeting_url: string | null;
};


type MaterialRow =
  LearningMaterialListItem & {
    week_id: string | null;
    session_id: string | null;
  };


function formatDate(
  value: string | null,
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


function statusLabel(
  status: string,
) {
  if (status === "completed") {
    return "Completed";
  }

  if (status === "planned") {
    return "Upcoming";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  return status.replaceAll(
    "_",
    " ",
  );
}


export default async function StudentWeeklyJourney({
  token,
  engagementId,
  timeZone,
}: {
  token: string;
  engagementId: string;
  timeZone?: string | null;
}) {
  const viewerTimeZone =
    normalizeTimeZone(
      timeZone,
      DEFAULT_TIME_ZONE,
    );

  const formatDateTime = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      viewerTimeZone,
    );
  const supabase =
    createAdminClient();


  const [
    weekResult,
    sessionResult,
    materialResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "tutoring_weeks",
        )
        .select(`
          id,
          week_number,
          week_start,
          week_end,
          title,
          focus,
          objectives,
          student_summary,
          status
        `)
        .eq(
          "engagement_id",
          engagementId,
        )
        .in(
          "status",
          [
            "published",
            "completed",
          ],
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
          week_id,
          week_position,
          scheduled_for,
          duration_minutes,
          status,
          topic,
          lesson_notes,
          homework_summary,
          next_topic,
          meeting_url
        `)
        .eq(
          "engagement_id",
          engagementId,
        )
        .not(
          "week_id",
          "is",
          null,
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
          "visible_to_student",
          true,
        )
        .not(
          "week_id",
          "is",
          null,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        ),
    ]);


  if (
    weekResult.error ||
    sessionResult.error ||
    materialResult.error
  ) {
    console.error(
      "Could not load student weekly workspace:",
      {
        weeks:
          weekResult.error,
        sessions:
          sessionResult.error,
        materials:
          materialResult.error,
      },
    );

    return null;
  }


  const weeks =
    (
      weekResult.data ||
      []
    ) as WeekRow[];


  if (!weeks.length) {
    return null;
  }


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


  /*
   * Prefer the currently published week.
   * If every visible week is completed,
   * show the latest completed week as
   * the current/most recent learning week.
   */
  const currentWeek =
    weeks.find(
      (week) =>
        week.status ===
        "published",
    ) ||
    weeks[0];


  const previousWeeks =
    weeks.filter(
      (week) =>
        week.id !==
        currentWeek.id,
    );


  const downloadBaseUrl =
    `/api/portal/${encodeURIComponent(
      token,
    )}/materials`;


  function renderWeek(
    week: WeekRow,
    compact = false,
  ) {
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
          ) => {
            const position =
              Number(
                a.week_position ||
                  999,
              ) -
              Number(
                b.week_position ||
                  999,
              );

            if (position !== 0) {
              return position;
            }

            return (
              new Date(
                a.scheduled_for ||
                  0,
              ).getTime() -
              new Date(
                b.scheduled_for ||
                  0,
              ).getTime()
            );
          },
        );


    const weeklyMaterials =
      materials.filter(
        (material) =>
          material.week_id ===
            week.id &&
          !material.session_id,
      );


    return (
      <article
        className={
          compact
            ? "portal-week-card portal-week-card-history"
            : "portal-week-card portal-week-card-current"
        }
        key={week.id}
      >

        <header className="portal-week-head">

          <div className="portal-week-number">

            <span>
              Week
            </span>

            <strong>
              {
                week.week_number
              }
            </strong>

          </div>


          <div className="portal-week-heading">

            <span className="portal-kicker">
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
            className={`portal-week-state is-${week.status}`}
          >
            {week.status ===
            "completed"
              ? "Completed"
              : "This week"}
          </span>

        </header>


        {week.student_summary && (
          <div className="portal-week-summary">

            <span>
              Your plan
            </span>

            <p>
              {
                week.student_summary
              }
            </p>

          </div>
        )}


        {week.objectives?.length >
          0 && (
          <section className="portal-week-objectives">

            <div className="portal-week-section-title">

              <span className="portal-kicker">
                Focus
              </span>

              <h3>
                Objectives for this
                week
              </h3>

            </div>


            <div className="portal-week-objective-grid">

              {week.objectives.map(
                (
                  objective,
                  index,
                ) => (
                  <div
                    key={`${week.id}-${index}`}
                  >

                    <i>
                      {
                        index +
                        1
                      }
                    </i>

                    <span>
                      {
                        objective
                      }
                    </span>

                  </div>
                ),
              )}

            </div>

          </section>
        )}


        <section className="portal-week-session-area">

          <div className="portal-week-section-title">

            <span className="portal-kicker">
              Lessons
            </span>

            <h3>
              Weekly sessions
            </h3>

          </div>


          <div className="portal-week-session-list">

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


                const meetingUrl =
                  safeExternalUrl(
                    session.meeting_url,
                  );


                return (
                  <article
                    className="portal-week-session-card"
                    key={
                      session.id
                    }
                  >

                    <div className="portal-week-session-index">

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


                    <div className="portal-week-session-body">

                      <div className="portal-week-session-top">

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


                        <div className="portal-week-session-meta">

                          <span>
                            {statusLabel(
                              session.status,
                            )}
                          </span>

                          {meetingUrl &&
                            session.status ===
                              "planned" && (
                            <a
                              className="button button-primary"
                              href={
                                meetingUrl
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Join session ↗
                            </a>
                          )}

                        </div>

                      </div>


                      {session.lesson_notes && (
                        <div className="portal-week-note">

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
                        <div className="portal-week-note">

                          <strong>
                            Practice /
                            homework
                          </strong>

                          <p>
                            {
                              session.homework_summary
                            }
                          </p>

                        </div>
                      )}


                      {session.next_topic && (
                        <div className="portal-week-next-focus">

                          Next focus:{" "}
                          <strong>
                            {
                              session.next_topic
                            }
                          </strong>

                        </div>
                      )}


                      <div className="portal-week-session-files">

                        <div>

                          <strong>
                            Session
                            materials
                          </strong>

                          <span>
                            {
                              sessionMaterials.length
                            }{" "}
                            file
                            {sessionMaterials.length ===
                            1
                              ? ""
                              : "s"}
                          </span>

                        </div>


                        <LearningMaterialsList
                          materials={
                            sessionMaterials
                          }
                          viewerRole="student"
                          timeZone={viewerTimeZone}
                          downloadBaseUrl={
                            downloadBaseUrl
                          }
                          emptyText="Your tutor has not attached any files to this session yet."
                        />

                      </div>

                    </div>

                  </article>
                );
              },
            )}


            {!weekSessions.length && (
              <div className="portal-empty">
                Your tutor is still
                arranging the sessions
                for this week.
              </div>
            )}

          </div>

        </section>


        <StudentWeeklyHomework
          token={
            token
          }
          engagementId={
            engagementId
          }
          weekId={
            week.id
          }
          sessions={weekSessions.map(
            (session) => ({
              id:
                session.id,

              topic:
                session.topic,

              week_position:
                session.week_position,

              scheduled_for:
                session.scheduled_for,
            }),
          )}
            timeZone={viewerTimeZone}
        />


        {weeklyMaterials.length >
          0 && (
          <section className="portal-week-files">

            <div className="portal-week-section-title">

              <span className="portal-kicker">
                Shared learning
              </span>

              <h3>
                Weekly materials
              </h3>

            </div>


            <LearningMaterialsList
              materials={
                weeklyMaterials
              }
              viewerRole="student"
              timeZone={viewerTimeZone}
              downloadBaseUrl={
                downloadBaseUrl
              }
              emptyText=""
            />

          </section>
        )}


        {!compact && (
          <section className="portal-week-submit">

            <div>

              <span className="portal-kicker">
                Share with your tutor
              </span>

              <h3>
                Upload work for this
                week
              </h3>

              <p>
                Upload practice work,
                drafts, screenshots or
                datasets related to
                this week's learning.
              </p>

            </div>


            <LearningMaterialUploadForm
              role="student"
              endpoint={`/api/portal/${encodeURIComponent(
                token,
              )}/materials`}
              engagementId={
                engagementId
              }
              defaultCategory="submission"
              compact
            />

          </section>
        )}

      </article>
    );
  }


  return (
    <section
      className="portal-weekly-journey"
      id="weekly"
    >

      <div className="portal-weekly-intro">

        <div>

          <span className="portal-kicker">
            Your learning journey
          </span>

          <h2>
            This week
          </h2>

          <p>
            Your tutor organises your
            objectives, sessions and
            learning materials here
            week by week.
          </p>

        </div>


        <span>
          Published plans only
        </span>

      </div>


      {renderWeek(
        currentWeek,
      )}


      {previousWeeks.length >
        0 && (
        <section className="portal-week-history">

          <div className="portal-week-history-head">

            <div>

              <span className="portal-kicker">
                Learning record
              </span>

              <h2>
                Previous weeks
              </h2>

            </div>


            <span>
              {
                previousWeeks.length
              }
            </span>

          </div>


          <div className="portal-week-history-list">

            {previousWeeks.map(
              (week) =>
                renderWeek(
                  week,
                  true,
                ),
            )}

          </div>

        </section>
      )}

    </section>
  );
}
