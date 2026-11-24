import Link from "next/link";

import {
  currentMonthRange,
} from "@/lib/progress";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


type TutorHealthRow = {
  tutorId: string;
  tutorName: string;
  tutorEmail: string;
  students: number;
  courses: number;
  upcoming: number;
  noFuture: number;
  missingNotes: number;
  reportsDue: number;
  openRequests: number;
  score: number;
};


export default async function AdminTutorHealth() {
  const supabase =
    createAdminClient();


  const now =
    new Date();

  const nowMs =
    now.getTime();

  const nowIso =
    now.toISOString();


  const sevenDaysIso =
    new Date(
      nowMs +
      7 * 24 * 60 * 60 * 1000,
    ).toISOString();


  const notesCutoffMs =
    nowMs -
    3 * 60 * 60 * 1000;


  const month =
    currentMonthRange();


  const [
    tutorResult,
    engagementResult,
  ] =
    await Promise.all([

      supabase
        .from("tutors")
        .select(
          "id,name,email,status",
        )
        .eq(
          "status",
          "active",
        ),


      supabase
        .from(
          "tutoring_engagements",
        )
        .select(
          "id,student_id,tutor_id,subject,status",
        )
        .eq(
          "status",
          "active",
        ),
    ]);


  if (tutorResult.error) {
    throw new Error(
      tutorResult.error.message,
    );
  }


  if (engagementResult.error) {
    throw new Error(
      engagementResult.error.message,
    );
  }


  const tutors =
    (tutorResult.data || []) as any[];


  const engagements =
    (engagementResult.data || []) as any[];


  if (!tutors.length) {
    return (
      <section className="admin-panel admin-student-health">

        <div className="admin-card-head">

          <div>

            <span className="admin-eyebrow">
              Tutor operations
            </span>

            <h2>
              Tutor health
            </h2>

            <p>
              No active tutors are currently being monitored.
            </p>

          </div>

        </div>

      </section>
    );
  }


  const engagementIds =
    engagements.map(
      (item) =>
        item.id,
    );


  const [
    sessionResult,
    requestResult,
    reportResult,
  ] =
    engagementIds.length
      ? await Promise.all([

          supabase
            .from(
              "tutoring_sessions",
            )
            .select(
              "id,engagement_id,tutor_id,scheduled_for,completed_at,status,lesson_notes",
            )
            .in(
              "engagement_id",
              engagementIds,
            )
            .in(
              "status",
              [
                "planned",
                "completed",
              ],
            ),


          supabase
            .from(
              "student_support_requests",
            )
            .select(
              "id,engagement_id,status",
            )
            .in(
              "engagement_id",
              engagementIds,
            )
            .in(
              "status",
              [
                "new",
                "in_progress",
              ],
            ),


          supabase
            .from(
              "progress_reports",
            )
            .select(
              "id,engagement_id,tutor_id,period_start,period_end,student_visible,published_at",
            )
            .in(
              "engagement_id",
              engagementIds,
            )
            .gte(
              "period_end",
              month.start,
            )
            .lte(
              "period_start",
              month.end,
            ),
        ])

      : [
          {
            data: [],
            error: null,
          },
          {
            data: [],
            error: null,
          },
          {
            data: [],
            error: null,
          },
        ];


  const queryError =
    [
      sessionResult.error,
      requestResult.error,
      reportResult.error,
    ].find(Boolean);


  if (queryError) {
    throw new Error(
      queryError.message,
    );
  }


  const sessions =
    (sessionResult.data || []) as any[];


  const requests =
    (requestResult.data || []) as any[];


  const reports =
    (reportResult.data || []) as any[];


  const rows:
    TutorHealthRow[] =
      tutors.map(
        (tutor) => {

          const tutorEngagements =
            engagements.filter(
              (item) =>
                item.tutor_id ===
                tutor.id,
            );


          const tutorEngagementIds =
            new Set(
              tutorEngagements.map(
                (item) =>
                  item.id,
              ),
            );


          const tutorSessions =
            sessions.filter(
              (item) =>
                tutorEngagementIds.has(
                  item.engagement_id,
                ),
            );


          const studentIds =
            new Set(
              tutorEngagements.map(
                (item) =>
                  item.student_id,
              ),
            );


          let noFuture =
            0;


          let reportsDue =
            0;


          for (
            const engagement
            of tutorEngagements
          ) {

            const hasFuture =
              tutorSessions.some(
                (item) =>
                  item.engagement_id ===
                    engagement.id &&
                  item.status ===
                    "planned" &&
                  item.scheduled_for &&
                  item.scheduled_for >=
                    nowIso,
              );


            if (!hasFuture) {
              noFuture += 1;
            }


            const hasPublishedReport =
              reports.some(
                (item) =>
                  item.engagement_id ===
                    engagement.id &&
                  Boolean(
                    item.published_at ||
                    item.student_visible,
                  ),
              );


            if (!hasPublishedReport) {
              reportsDue += 1;
            }
          }


          const upcoming =
            tutorSessions.filter(
              (item) =>
                item.status ===
                  "planned" &&
                item.scheduled_for &&
                item.scheduled_for >=
                  nowIso &&
                item.scheduled_for <=
                  sevenDaysIso,
            ).length;


          const missingNotes =
            tutorSessions.filter(
              (item) => {

                if (
                  item.status !==
                    "completed" ||
                  item.lesson_notes
                ) {
                  return false;
                }


                const completed =
                  item.completed_at ||
                  item.scheduled_for;


                if (!completed) {
                  return false;
                }


                return (
                  new Date(
                    completed,
                  ).getTime() <=
                  notesCutoffMs
                );
              },
            ).length;


          const openRequests =
            requests.filter(
              (item) =>
                tutorEngagementIds.has(
                  item.engagement_id,
                ),
            ).length;


          const score =
            noFuture * 2 +
            missingNotes * 2 +
            reportsDue +
            openRequests * 2;


          return {
            tutorId:
              tutor.id,

            tutorName:
              tutor.name ||
              "Tutor",

            tutorEmail:
              tutor.email ||
              "",

            students:
              studentIds.size,

            courses:
              tutorEngagements.length,

            upcoming,

            noFuture,

            missingNotes,

            reportsDue,

            openRequests,

            score,
          };
        },
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );


  const attentionRows =
    rows
      .filter(
        (row) =>
          row.score > 0,
      )
      .slice(
        0,
        12,
      );


  const totalNoFuture =
    rows.reduce(
      (sum, row) =>
        sum +
        row.noFuture,
      0,
    );


  const totalMissingNotes =
    rows.reduce(
      (sum, row) =>
        sum +
        row.missingNotes,
      0,
    );


  const totalReportsDue =
    rows.reduce(
      (sum, row) =>
        sum +
        row.reportsDue,
      0,
    );


  const totalRequests =
    rows.reduce(
      (sum, row) =>
        sum +
        row.openRequests,
      0,
    );


  const totalUpcoming =
    rows.reduce(
      (sum, row) =>
        sum +
        row.upcoming,
      0,
    );


  function label(
    score: number,
  ) {
    if (score >= 8) {
      return "High attention";
    }

    if (score >= 4) {
      return "Needs attention";
    }

    return "Monitor";
  }


  return (
    <section
      className="admin-panel admin-student-health"
      aria-label="Tutor health"
    >

      <div className="admin-card-head">

        <div>

          <span className="admin-eyebrow">
            Tutor operations
          </span>

          <h2>
            Tutor health
          </h2>

          <p>
            Monitor tutor workload and outstanding delivery
            actions across active students.
          </p>

        </div>


        <Link href="/admin/tutors">
          View tutors →
        </Link>

      </div>


      <div className="admin-health-metrics">

        <div>
          <span>
            Active tutors
          </span>

          <strong>
            {rows.length}
          </strong>

          <small>
            Teaching
          </small>
        </div>


        <div>
          <span>
            Need attention
          </span>

          <strong>
            {attentionRows.length}
          </strong>

          <small>
            Tutors flagged
          </small>
        </div>


        <div>
          <span>
            Next 7 days
          </span>

          <strong>
            {totalUpcoming}
          </strong>

          <small>
            Planned lessons
          </small>
        </div>


        <div>
          <span>
            No future lesson
          </span>

          <strong>
            {totalNoFuture}
          </strong>

          <small>
            Active courses
          </small>
        </div>


        <div>
          <span>
            Missing notes
          </span>

          <strong>
            {totalMissingNotes}
          </strong>

          <small>
            Completed lessons
          </small>
        </div>


        <div>
          <span>
            Reports due
          </span>

          <strong>
            {totalReportsDue}
          </strong>

          <small>
            Current month
          </small>
        </div>


        <div>
          <span>
            Open requests
          </span>

          <strong>
            {totalRequests}
          </strong>

          <small>
            Student support
          </small>
        </div>

      </div>


      <div className="admin-health-list">

        {attentionRows.map(
          (row) => (
            <article
              className="admin-health-row"
              key={
                row.tutorId
              }
            >

              <div className="admin-health-person">

                <strong>
                  {row.tutorName}
                </strong>

                <span>
                  {row.tutorEmail ||
                    "No email"}
                </span>

                <small>
                  {row.students}{" "}
                  {row.students === 1
                    ? "student"
                    : "students"}{" "}
                  · {row.courses} active{" "}
                  {row.courses === 1
                    ? "course"
                    : "courses"}
                </small>

              </div>


              <div className="admin-health-signals">

                {row.upcoming > 0 && (
                  <span>
                    {row.upcoming} next 7 days
                  </span>
                )}


                {row.noFuture > 0 && (
                  <span>
                    {row.noFuture} no future lesson
                  </span>
                )}


                {row.missingNotes > 0 && (
                  <span className="is-risk">
                    {row.missingNotes} missing notes
                  </span>
                )}


                {row.reportsDue > 0 && (
                  <span>
                    {row.reportsDue} report due
                  </span>
                )}


                {row.openRequests > 0 && (
                  <span>
                    {row.openRequests} open request
                  </span>
                )}

              </div>


              <div className="admin-health-action">

                <span
                  className={
                    row.score >= 8
                      ? "is-high"
                      : row.score >= 4
                        ? "is-attention"
                        : ""
                  }
                >
                  {label(
                    row.score,
                  )}
                </span>


                <Link
                  href={`/admin/tutors/${row.tutorId}`}
                >
                  Open tutor →
                </Link>

              </div>

            </article>
          ),
        )}


        {!attentionRows.length && (
          <div className="admin-command-empty">
            No active tutors currently have outstanding
            delivery actions.
          </div>
        )}

      </div>

    </section>
  );
}
