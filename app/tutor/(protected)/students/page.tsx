import Link from "next/link";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "My students",
};

export const dynamic =
  "force-dynamic";

export default async function TutorStudentsPage() {
  const auth =
    await getTutorSession();

  if (!auth) {
    return null;
  }

  const {
    data,
    error,
  } =
    await createAdminClient()
      .from(
        "tutoring_engagements",
      )
      .select(
        "id,status,subject,title,module,goal,target,current_focus,frequency,session_duration_minutes,upcoming_deadline,students(id,name,email,academic_level,institution,programme)",
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .order(
        "created_at",
        {
          ascending: false,
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
    ) as any[];

  const activeCount =
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
            Learner workspace
          </span>

          <h1>
            My students
          </h1>

          <p>
            Open a student workspace to
            manage their learning focus,
            progress and shared
            materials.
          </p>
        </div>

        <span className="tutor-head-count">
          {activeCount} active
        </span>
      </header>

      <div className="tutor-card-grid">
        {rows.map(
          (row) => (
            <article
              className="tutor-student-card"
              key={row.id}
            >
              <div className="tutor-student-card-head">
                <div>
                  <span className="tutor-eyebrow">
                    {
                      row.subject
                    }
                  </span>

                  <h2>
                    {row.students
                      ?.name ||
                      "Student"}
                  </h2>

                  <p>
                    {row.students
                      ?.academic_level ||
                      "Level not recorded"}

                    {row.students
                      ?.institution
                      ? ` · ${row.students.institution}`
                      : ""}
                  </p>
                </div>

                <span
                  className={`tutor-status ${row.status}`}
                >
                  {
                    row.status
                  }
                </span>
              </div>

              <div className="tutor-student-focus">
                <span>
                  CURRENT FOCUS
                </span>

                <strong>
                  {row.current_focus ||
                    row.module ||
                    "Focus not yet set"}
                </strong>

                {row.goal && (
                  <p>
                    {row.goal}
                  </p>
                )}
              </div>

              <dl className="tutor-details">
                <div>
                  <dt>
                    Frequency
                  </dt>

                  <dd>
                    {row.frequency ||
                      "Not set"}
                  </dd>
                </div>

                <div>
                  <dt>
                    Typical session
                  </dt>

                  <dd>
                    {
                      row.session_duration_minutes
                    }{" "}
                    min
                  </dd>
                </div>

                <div>
                  <dt>
                    Deadline
                  </dt>

                  <dd>
                    {row.upcoming_deadline ||
                      "—"}
                  </dd>
                </div>
              </dl>

              <p className="tutor-contact-line">
                {row.students
                  ?.email ||
                  ""}
              </p>

              <div className="tutor-student-actions">
                <Link
                  className="tutor-primary-link"
                  href={`/tutor/materials?engagement=${encodeURIComponent(
                    row.id,
                  )}`}
                >
                  Weekly workspace →
                </Link>

                <Link
                  className="tutor-secondary-link"
                  href={`/tutor/progress/${row.id}`}
                >
                  Progress & reports
                </Link>
              </div>
            </article>
          ),
        )}

        {!rows.length && (
          <div className="tutor-panel tutor-empty">
            No students are currently
            assigned to you.
          </div>
        )}
      </div>
    </div>
  );
}
