import TutorStudentRecency from "@/components/TutorStudentRecency";
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


export const metadata = {
  title: "My students",
};

export const dynamic =
  "force-dynamic";


type StudentInfo = {
  id: string;
  name: string;
  email: string;

  academic_level:
    | string
    | null;

  institution:
    | string
    | null;

  programme:
    | string
    | null;
};


type EngagementRow = {
  id: string;
  status: string;

  subject: string;
  title: string;

  module:
    | string
    | null;

  goal:
    | string
    | null;

  target:
    | string
    | null;

  current_focus:
    | string
    | null;

  frequency:
    | string
    | null;

  session_duration_minutes:
    number;

  upcoming_deadline:
    | string
    | null;

  students:
    | StudentInfo
    | StudentInfo[]
    | null;
};


type StudentGroup = {
  student: StudentInfo;
  courses: EngagementRow[];
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


function formatDeadline(
  value:
    | string
    | null,
) {
  if (!value) {
    return "Not set";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",
    },
  ).format(
    date,
  );
}


function deadlineTone(
  value:
    | string
    | null,
) {
  if (!value) {
    return "";
  }

  const deadline =
    new Date(value);

  if (
    Number.isNaN(
      deadline.getTime(),
    )
  ) {
    return "";
  }

  const diff =
    deadline.getTime() -
    Date.now();

  const days =
    Math.ceil(
      diff /
        (
          1000 *
          60 *
          60 *
          24
        ),
    );

  if (days < 0) {
    return "is-overdue";
  }

  if (days <= 14) {
    return "is-soon";
  }

  return "";
}


export default async function TutorStudentsPage() {
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


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "tutoring_engagements",
      )
      .select(`
        id,
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
        "tutor_id",
        auth.tutor.id,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );


  if (error) {
    throw new Error(
      error.message,
    );
  }


  const rows =
    (
      data ||
      []
    ) as unknown as
      EngagementRow[];


  const engagementIds =
    rows.map(
      (row) =>
        row.id,
    );


  let sessionRows:
    any[] = [];

  let homeworkRows:
    any[] = [];

  let progressRows:
    any[] = [];


  if (
    engagementIds.length
  ) {
    const [
      sessionResult,
      homeworkResult,
      progressResult,
    ] =
      await Promise.all([

        supabase
          .from(
            "tutoring_sessions",
          )
          .select(
            "id,engagement_id,scheduled_for,duration_minutes,status,topic",
          )
          .eq(
            "tutor_id",
            auth.tutor.id,
          )
          .in(
            "engagement_id",
            engagementIds,
          )
          .eq(
            "status",
            "planned",
          )
          .gte(
            "scheduled_for",
            new Date()
              .toISOString(),
          )
          .order(
            "scheduled_for",
            {
              ascending:
                true,
            },
          ),

        supabase
          .from(
            "homework",
          )
          .select(
            "id,engagement_id,title,due_date,status",
          )
          .in(
            "engagement_id",
            engagementIds,
          )
          .eq(
            "status",
            "submitted",
          ),

        supabase
          .from(
            "progress_reports",
          )
          .select(
            "id,engagement_id,overall_score,attendance_rate,homework_completion_rate,period_end,student_visible",
          )
          .eq(
            "tutor_id",
            auth.tutor.id,
          )
          .in(
            "engagement_id",
            engagementIds,
          )
          .order(
            "period_end",
            {
              ascending:
                false,
            },
          ),
      ]);


    if (
      sessionResult.error
    ) {
      throw new Error(
        sessionResult.error.message,
      );
    }


    if (
      homeworkResult.error
    ) {
      throw new Error(
        homeworkResult.error.message,
      );
    }


    if (
      progressResult.error
    ) {
      throw new Error(
        progressResult.error.message,
      );
    }


    sessionRows =
      sessionResult.data ||
      [];

    homeworkRows =
      homeworkResult.data ||
      [];

    progressRows =
      progressResult.data ||
      [];
  }


  const nextSessionByEngagement =
    new Map<
      string,
      any
    >();


  for (
    const session
    of sessionRows
  ) {
    if (
      !nextSessionByEngagement.has(
        session.engagement_id,
      )
    ) {
      nextSessionByEngagement.set(
        session.engagement_id,
        session,
      );
    }
  }


  const awaitingReviewByEngagement =
    new Map<
      string,
      number
    >();


  for (
    const homework
    of homeworkRows
  ) {
    awaitingReviewByEngagement.set(
      homework.engagement_id,
      (
        awaitingReviewByEngagement.get(
          homework.engagement_id,
        ) ||
        0
      ) +
        1,
    );
  }


  const latestProgressByEngagement =
    new Map<
      string,
      any
    >();


  for (
    const report
    of progressRows
  ) {
    if (
      !latestProgressByEngagement.has(
        report.engagement_id,
      )
    ) {
      latestProgressByEngagement.set(
        report.engagement_id,
        report,
      );
    }
  }


  const grouped =
    new Map<
      string,
      StudentGroup
    >();


  for (
    const row
    of rows
  ) {
    const student =
      relationOne(
        row.students,
      );

    if (!student) {
      continue;
    }

    const existing =
      grouped.get(
        student.id,
      );

    if (existing) {
      existing.courses.push(
        row,
      );

      continue;
    }

    grouped.set(
      student.id,
      {
        student,

        courses: [
          row,
        ],
      },
    );
  }


  const students =
    Array.from(
      grouped.values(),
    );


  const activeCourses =
    rows.filter(
      (row) =>
        row.status ===
        "active",
    ).length;


  const awaitingReviewTotal =
    homeworkRows.length;


  return (
    <div className="tutor-page tutor-students-v2">

      <header className="tutor-page-head tutor-students-v2-head">

        <div>

          <span className="tutor-eyebrow">
            Learners
          </span>

          <h1>
            My students
          </h1>

          <p>
            Your learners, courses and current teaching priorities in one place.
          </p>

        </div>

      </header>


      <section className="tutor-students-v2-metrics">

        <article>

          <span>
            Students
          </span>

          <strong>
            {
              students.length
            }
          </strong>

          <small>
            Learners assigned to you
          </small>

        </article>


        <article>

          <span>
            Active courses
          </span>

          <strong>
            {
              activeCourses
            }
          </strong>

          <small>
            Current teaching workspaces
          </small>

        </article>


        <article>

          <span>
            Awaiting review
          </span>

          <strong>
            {
              awaitingReviewTotal
            }
          </strong>

          <small>
            Student submissions waiting
          </small>

        </article>

      </section>


      <TutorStudentRecency />


      <div className="tutor-students-v2-list">

        {students.map(
          ({
            student,
            courses,
          }) => {

            const activeForStudent =
              courses.filter(
                (course) =>
                  course.status ===
                  "active",
              ).length;

            const initials =
              student.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(
                  (part) =>
                    part
                      .slice(0, 1)
                      .toUpperCase(),
                )
                .join("");

            return (
              <article
                className="tutor-students-v2-card"
                key={
                  student.id
                }
              >

                <header className="tutor-students-v2-student">

                  <div className="tutor-students-v2-identity">

                    <div className="tutor-students-v2-avatar">
                      {
                        initials ||
                        "S"
                      }
                    </div>


                    <div>

                      <div className="tutor-students-v2-name-row">

                        <h2>
                          {
                            student.name
                          }
                        </h2>

                        <span className="tutor-students-v2-count">
                          {
                            activeForStudent
                          }{" "}
                          active{" "}
                          {activeForStudent ===
                          1
                            ? "course"
                            : "courses"}
                        </span>

                      </div>


                      <p>
                        {student.academic_level ||
                          "Level not recorded"}

                        {student.programme
                          ? ` · ${student.programme}`
                          : ""}

                        {student.institution
                          ? ` · ${student.institution}`
                          : ""}
                      </p>

                    </div>

                  </div>


                  <a
                    className="tutor-students-v2-email"
                    href={`mailto:${student.email}`}
                  >
                    Email student
                  </a>

                </header>


                <div className="tutor-students-v2-courses">

                  {courses.map(
                    (
                      course,
                    ) => {

                      const courseTitle =
                        course.module ||
                        course.title;

                      const focus =
                        course.current_focus ||
                        course.module ||
                        course.title ||
                        "Not set";

                      const schedule =
                        [
                          course.frequency,
                          course.session_duration_minutes
                            ? `${course.session_duration_minutes} min`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                      const goal =
                        course.target ||
                        course.goal;


                      const nextSession =
                        nextSessionByEngagement.get(
                          course.id,
                        ) ||
                        null;


                      const awaitingReview =
                        awaitingReviewByEngagement.get(
                          course.id,
                        ) ||
                        0;


                      const latestProgress =
                        latestProgressByEngagement.get(
                          course.id,
                        ) ||
                        null;


                      return (
                        <section
                          className="tutor-students-v2-course"
                          key={
                            course.id
                          }
                        >

                          <div className="tutor-students-v2-course-main">

                            <div className="tutor-students-v2-course-heading">

                              <div>

                                <span className="tutor-students-v2-subject">
                                  {
                                    course.subject
                                  }
                                </span>

                                <h3>
                                  {
                                    courseTitle
                                  }
                                </h3>

                              </div>


                              <span
                                className={`tutor-status ${course.status}`}
                              >
                                {
                                  course.status
                                }
                              </span>

                            </div>


                            <div className="tutor-students-v2-focus">

                              <span>
                                Current focus
                              </span>

                              <strong>
                                {
                                  focus
                                }
                              </strong>

                            </div>

                          </div>


                          <div className="tutor-students-v2-course-info">

                            <div>

                              <span>
                                Schedule
                              </span>

                              <strong>
                                {schedule ||
                                  "Not set"}
                              </strong>

                            </div>


                            <div>

                              <span>
                                Deadline
                              </span>

                              <strong
                                className={deadlineTone(
                                  course.upcoming_deadline,
                                )}
                              >
                                {formatDeadline(
                                  course.upcoming_deadline,
                                )}
                              </strong>

                            </div>


                            <div>

                              <span>
                                Learning goal
                              </span>

                              <strong>
                                {goal ||
                                  "Not set"}
                              </strong>

                            </div>


                            <div>

                              <span>
                                Next lesson
                              </span>

                              <strong>
                                {nextSession
                                  ? formatDateTimeInTimeZone(
                                      nextSession.scheduled_for,
                                      tutorTimeZone,
                                    )
                                  : "Not scheduled"}
                              </strong>

                            </div>


                            <div>

                              <span>
                                Homework
                              </span>

                              <strong
                                className={
                                  awaitingReview
                                    ? "is-attention"
                                    : undefined
                                }
                              >
                                {awaitingReview
                                  ? `${awaitingReview} awaiting review`
                                  : "Nothing to review"}
                              </strong>

                            </div>


                            <div>

                              <span>
                                Latest progress
                              </span>

                              <strong>
                                {latestProgress?.overall_score ==
                                null
                                  ? "No report yet"
                                  : `${Math.round(
                                      latestProgress.overall_score,
                                    )}% overall`}
                              </strong>

                            </div>

                          </div>


                          <div className="tutor-students-v2-actions">

                            <Link
                              className="tutor-primary-button"
                              href={`/tutor/students/${course.id}`}
                            >
                              Open workspace →
                            </Link>


                            <Link
                              className="tutor-secondary-button"
                              href={`/tutor/progress/${course.id}`}
                            >
                              Progress
                            </Link>


                            <Link
                              className="tutor-students-v2-resource-link"
                              href={`/tutor/materials?engagement=${encodeURIComponent(
                                course.id,
                              )}`}
                            >
                              Resources
                            </Link>

                          </div>

                        </section>
                      );
                    },
                  )}

                </div>

              </article>
            );
          },
        )}


        {!students.length && (
          <section className="tutor-panel tutor-empty">

            <h2>
              No students assigned
            </h2>

            <p>
              Students will appear here when an active tutoring engagement is assigned to you.
            </p>

          </section>
        )}

      </div>

    </div>
  );
}
