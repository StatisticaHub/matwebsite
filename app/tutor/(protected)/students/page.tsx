import Link from "next/link";

import {
  getTutorSession,
} from "@/lib/tutor-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


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

  courses:
    EngagementRow[];
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
    return "—";
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


export default async function TutorStudentsPage() {
  const auth =
    await getTutorSession();

  if (!auth) {
    return null;
  }


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
        students(id,name,academic_level,institution,programme)
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


  /*
   * Group engagements by actual student.
   *
   * One student can therefore have:
   *
   * Statistics
   * Python
   * Econometrics
   *
   * without appearing as three
   * separate people.
   */
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


  return (
    <div className="tutor-page">

      <header className="tutor-page-head">

        <div>

          <span className="tutor-eyebrow">
            Learners
          </span>

          <h1>
            My students
          </h1>

          <p>
            Manage each student
            once, with separate
            course workspaces for
            every subject you teach
            them.
          </p>

        </div>

      </header>


      <section className="tutor-metric-grid tutor-student-summary-metrics">

        <article>

          <span>
            Students
          </span>

          <strong>
            {
              students.length
            }
          </strong>

        </article>


        <article>

          <span>
            Course workspaces
          </span>

          <strong>
            {
              rows.length
            }
          </strong>

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

        </article>

      </section>


      <div className="tutor-student-group-list">

        {students.map(
          ({
            student,
            courses,
          }) => (
            <article
              className="tutor-panel tutor-student-group-card"
              key={
                student.id
              }
            >

              <header className="tutor-student-group-head">

                <div className="tutor-student-identity">

                  <div className="tutor-student-avatar">
                    {student.name
                      .trim()
                      .slice(
                        0,
                        1,
                      )
                      .toUpperCase()}
                  </div>


                  <div>

                    <span className="tutor-eyebrow">
                      Student
                    </span>

                    <h2>
                      {
                        student.name
                      }
                    </h2>

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


                <div className="tutor-student-group-meta">

                  <strong>
                    {
                      courses.length
                    }{" "}
                    course
                    {courses.length ===
                    1
                      ? ""
                      : "s"}
                  </strong>

                  

                </div>

              </header>


              <div className="tutor-student-course-list">

                {courses.map(
                  (
                    course,
                  ) => (
                    <section
                      className="tutor-student-course-card"
                      key={
                        course.id
                      }
                    >

                      <div className="tutor-student-course-top">

                        <div>

                          <span className="tutor-eyebrow">
                            Course workspace
                          </span>

                          <h3>
                            {
                              course.subject
                            }
                          </h3>

                          <p>
                            {course.module ||
                              course.title}
                          </p>

                        </div>


                        <span
                          className={`tutor-status ${course.status}`}
                        >
                          {
                            course.status
                          }
                        </span>

                      </div>


                      <dl className="tutor-course-facts">

                        <div>

                          <dt>
                            Current focus
                          </dt>

                          <dd>
                            {course.current_focus ||
                              course.module ||
                              "Not set"}
                          </dd>

                        </div>


                        <div>

                          <dt>
                            Frequency
                          </dt>

                          <dd>
                            {course.frequency ||
                              "Not set"}
                          </dd>

                        </div>


                        <div>

                          <dt>
                            Session
                          </dt>

                          <dd>
                            {
                              course.session_duration_minutes
                            }{" "}
                            min
                          </dd>

                        </div>


                        <div>

                          <dt>
                            Deadline
                          </dt>

                          <dd>
                            {formatDeadline(
                              course.upcoming_deadline,
                            )}
                          </dd>

                        </div>

                      </dl>


                      {(course.goal ||
                        course.target) && (
                        <div className="tutor-course-goal">

                          <span>
                            Learning goal
                          </span>

                          <p>
                            {course.target ||
                              course.goal}
                          </p>

                        </div>
                      )}


                      <div className="tutor-course-actions">

                        <Link
                          className="tutor-primary-button"
                          href={`/tutor/students/${course.id}`}
                        >
                          Weekly workspace →
                        </Link>


                        <Link
                          className="tutor-secondary-button"
                          href={`/tutor/progress/${course.id}`}
                        >
                          Progress
                        </Link>


                        <Link
                          className="tutor-course-text-link"
                          href={`/tutor/materials?engagement=${encodeURIComponent(
                            course.id,
                          )}`}
                        >
                          Resources
                        </Link>

                      </div>

                    </section>
                  ),
                )}

              </div>

            </article>
          ),
        )}


        {!students.length && (
          <section className="tutor-panel tutor-empty">

            <h2>
              No students assigned
            </h2>

            <p>
              Students will appear
              here when an active
              tutoring engagement
              is assigned to you.
            </p>

          </section>
        )}

      </div>

    </div>
  );
}
