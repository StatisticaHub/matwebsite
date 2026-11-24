import Link from "next/link";

import {
  getTutorSession,
} from "@/lib/tutor-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";


type RecencyRow = {
  studentId: string;
  studentName: string;
  courses: number;
  firstEngagementId: string;

  hasFuture: boolean;

  lastCompleted:
    | string
    | null;

  daysSinceLast:
    | number
    | null;

  noCompleted: boolean;

  courseAgeDays: number;

  score: number;
};


function relationOne<T>(
  value:
    | T
    | T[]
    | null,
) {
  if (
    Array.isArray(
      value,
    )
  ) {
    return (
      value[0] ||
      null
    );
  }

  return value;
}


export default async function TutorStudentRecency() {

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


  const supabase =
    createAdminClient();


  const now =
    new Date();

  const nowMs =
    now.getTime();

  const nowIso =
    now.toISOString();


  const {
    data:
      engagementData,
    error:
      engagementError,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(`
        id,
        created_at,
        student_id,
        subject,
        students (
          id,
          name
        )
      `)
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .eq(
        "status",
        "active",
      );


  if (
    engagementError
  ) {
    throw new Error(
      engagementError.message,
    );
  }


  const engagements =
    (
      engagementData ||
      []
    ) as any[];


  const engagementIds =
    engagements.map(
      (item) =>
        item.id,
    );


  if (
    !engagementIds.length
  ) {
    return null;
  }


  const {
    data:
      sessionData,
    error:
      sessionError,
  } =
    await supabase
      .from(
        "tutoring_sessions",
      )
      .select(
        "id,engagement_id,status,scheduled_for,completed_at",
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
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
      );


  if (
    sessionError
  ) {
    throw new Error(
      sessionError.message,
    );
  }


  const sessions =
    (
      sessionData ||
      []
    ) as any[];


  const grouped =
    new Map<
      string,
      {
        studentId: string;
        studentName: string;
        engagements: any[];
      }
    >();


  for (
    const engagement
    of engagements
  ) {

    const student =
      relationOne<any>(
        engagement.students,
      );


    if (
      !student?.id
    ) {
      continue;
    }


    const existing =
      grouped.get(
        student.id,
      );


    if (
      existing
    ) {
      existing.engagements.push(
        engagement,
      );

      continue;
    }


    grouped.set(
      student.id,
      {
        studentId:
          student.id,

        studentName:
          student.name ||
          "Student",

        engagements: [
          engagement,
        ],
      },
    );
  }


  const rows:
    RecencyRow[] =
      [];


  for (
    const group
    of grouped.values()
  ) {

    const ids =
      new Set(
        group.engagements.map(
          (item) =>
            item.id,
        ),
      );


    const studentSessions =
      sessions.filter(
        (session) =>
          ids.has(
            session.engagement_id,
          ),
      );


    const future =
      studentSessions
        .filter(
          (session) =>
            session.status ===
              "planned" &&
            session.scheduled_for &&
            session.scheduled_for >=
              nowIso,
        );


    const completed =
      studentSessions
        .filter(
          (session) =>
            session.status ===
              "completed",
        )
        .map(
          (session) =>
            session.completed_at ||
            session.scheduled_for,
        )
        .filter(Boolean)
        .sort(
          (
            first,
            second,
          ) =>
            new Date(
              second,
            ).getTime() -
            new Date(
              first,
            ).getTime(),
        );


    const lastCompleted =
      completed[0] ||
      null;


    const daysSinceLast =
      lastCompleted
        ? Math.floor(
            (
              nowMs -
              new Date(
                lastCompleted,
              ).getTime()
            ) /
            (
              24 *
              60 *
              60 *
              1000
            ),
          )
        : null;


    const oldestCourse =
      group.engagements
        .map(
          (item) =>
            new Date(
              item.created_at,
            ).getTime(),
        )
        .filter(
          (value) =>
            Number.isFinite(
              value,
            ),
        )
        .sort(
          (
            first,
            second,
          ) =>
            first -
            second,
        )[0];


    const courseAgeDays =
      oldestCourse
        ? Math.floor(
            (
              nowMs -
              oldestCourse
            ) /
            (
              24 *
              60 *
              60 *
              1000
            ),
          )
        : 0;


    const noCompleted =
      !lastCompleted;


    let score =
      0;


    if (
      daysSinceLast !== null &&
      daysSinceLast >= 30
    ) {
      score += 4;
    } else if (
      daysSinceLast !== null &&
      daysSinceLast >= 14
    ) {
      score += 2;
    }


    if (
      !future.length
    ) {
      score += 3;
    }


    /*
     * Do not flag a genuinely brand-new learner merely because
     * their first lesson has not happened yet.
     */
    if (
      noCompleted &&
      courseAgeDays >= 7
    ) {
      score += 2;
    }


    rows.push({
      studentId:
        group.studentId,

      studentName:
        group.studentName,

      courses:
        group.engagements.length,

      firstEngagementId:
        group.engagements[0].id,

      hasFuture:
        future.length > 0,

      lastCompleted,

      daysSinceLast,

      noCompleted,

      courseAgeDays,

      score,
    });
  }


  const noFutureCount =
    rows.filter(
      (row) =>
        !row.hasFuture,
    ).length;


  const quiet14Count =
    rows.filter(
      (row) =>
        row.daysSinceLast !==
          null &&
        row.daysSinceLast >=
          14 &&
        row.daysSinceLast <
          30,
    ).length;


  const quiet30Count =
    rows.filter(
      (row) =>
        row.daysSinceLast !==
          null &&
        row.daysSinceLast >=
          30,
    ).length;


  const noCompletedCount =
    rows.filter(
      (row) =>
        row.noCompleted &&
        row.courseAgeDays >=
          7,
    ).length;


  const attentionRows =
    rows
      .filter(
        (row) =>
          row.score > 0,
      )
      .sort(
        (
          first,
          second,
        ) => {

          if (
            second.score !==
            first.score
          ) {
            return (
              second.score -
              first.score
            );
          }


          return (
            (
              second.daysSinceLast ||
              0
            ) -
            (
              first.daysSinceLast ||
              0
            )
          );
        },
      )
      .slice(
        0,
        8,
      );


  function attentionLabel(
    score: number,
  ) {

    if (
      score >= 6
    ) {
      return "High attention";
    }


    if (
      score >= 3
    ) {
      return "Needs attention";
    }


    return "Monitor";
  }


  return (
    <section
      className="tutor-panel tutor-student-recency"
      aria-label="Student recency"
    >

      <div className="tutor-panel-head">

        <div>

          <span className="tutor-eyebrow">
            Teaching continuity
          </span>

          <h2>
            Student recency
          </h2>

          <p>
            Learners who may need another lesson booked or a
            teaching follow-up.
          </p>

        </div>

      </div>


      <div className="tutor-student-recency-metrics">

        <div>

          <span>
            No future lesson
          </span>

          <strong>
            {noFutureCount}
          </strong>

          <small>
            Students
          </small>

        </div>


        <div>

          <span>
            14+ days quiet
          </span>

          <strong>
            {quiet14Count}
          </strong>

          <small>
            Last lesson
          </small>

        </div>


        <div>

          <span>
            30+ days quiet
          </span>

          <strong>
            {quiet30Count}
          </strong>

          <small>
            Last lesson
          </small>

        </div>


        <div>

          <span>
            No completed lesson
          </span>

          <strong>
            {noCompletedCount}
          </strong>

          <small>
            Course 7+ days old
          </small>

        </div>

      </div>


      <div className="tutor-student-recency-list">

        {attentionRows.map(
          (row) => (

            <article
              key={
                row.studentId
              }
              className="tutor-student-recency-row"
            >

              <div className="tutor-student-recency-person">

                <strong>
                  {row.studentName}
                </strong>

                <span>
                  {row.courses} active{" "}
                  {row.courses === 1
                    ? "course"
                    : "courses"}
                </span>

              </div>


              <div className="tutor-student-recency-signals">

                {!row.hasFuture && (
                  <span>
                    No future lesson
                  </span>
                )}


                {row.daysSinceLast !==
                  null &&
                  row.daysSinceLast >=
                    30 && (
                    <span className="is-risk">
                      {row.daysSinceLast} days since lesson
                    </span>
                  )}


                {row.daysSinceLast !==
                  null &&
                  row.daysSinceLast >=
                    14 &&
                  row.daysSinceLast <
                    30 && (
                    <span>
                      {row.daysSinceLast} days since lesson
                    </span>
                  )}


                {row.noCompleted &&
                  row.courseAgeDays >=
                    7 && (
                    <span>
                      No completed lesson yet
                    </span>
                  )}


                {row.lastCompleted && (
                  <small>
                    Last completed:{" "}
                    {formatDateTimeInTimeZone(
                      row.lastCompleted,
                      tutorTimeZone,
                    )}
                  </small>
                )}

              </div>


              <div className="tutor-student-recency-action">

                <span
                  className={
                    row.score >= 6
                      ? "is-high"
                      : row.score >= 3
                        ? "is-attention"
                        : ""
                  }
                >
                  {attentionLabel(
                    row.score,
                  )}
                </span>


                <Link
                  href={`/tutor/students/${row.firstEngagementId}`}
                >
                  Open student →
                </Link>

              </div>

            </article>
          ),
        )}


        {!attentionRows.length && (
          <div className="tutor-empty">
            All active learners currently have healthy lesson
            continuity.
          </div>
        )}

      </div>

    </section>
  );
}
