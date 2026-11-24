import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  disableStudentAccount,
  sendStudentAccountInvite,
} from "@/app/admin/student-access-actions";

export const metadata = {
  title: "Student Portal Access",
};

export const dynamic =
  "force-dynamic";

type SearchParams =
  Promise<{
    student?: string;
    sent?: string;
    disabled?: string;
  }>;

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    },
  ).format(
    new Date(value),
  );
}

export default async function StudentAccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query =
    await searchParams;

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("students")
    .select(
      "id,name,email,status,auth_user_id,portal_enabled,portal_invited_at"
    )
    .order("name");

  if (error) {
    throw new Error(
      error.message,
    );
  }

  const students =
    data || [];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">
            Student access
          </span>

          <h1>
            Student Portal accounts
          </h1>

          <p>
            Activate login only for approved,
            active MAT students. Student accounts
            remain invitation-only.
          </p>
        </div>
      </header>

      {query.sent === "1" && (
        <div className="admin-inline-message success">
          Student Portal access email sent successfully.
        </div>
      )}

      {query.disabled === "1" && (
        <div className="admin-inline-message warning">
          Student Portal login access has been disabled.
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Status</th>
                <th>Portal login</th>
                <th>Last invite</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {students.map(
                (student) => (
                  <tr
                    key={
                      student.id
                    }
                    className={
                      student.id === query.student
                        ? "admin-table-row-focus"
                        : undefined
                    }
                  >
                    <td>
                      <strong>
                        {student.name}
                      </strong>

                      <div>
                        {student.email}
                      </div>
                    </td>

                    <td>
                      {student.status}
                    </td>

                    <td>
                      {student.portal_enabled
                        ? "Enabled"
                        : "Disabled"}

                      {student.auth_user_id
                        ? " · linked"
                        : ""}
                    </td>

                    <td>
                      {formatDateTime(
                        student.portal_invited_at,
                      )}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <form
                          action={
                            sendStudentAccountInvite
                          }
                        >
                          <input
                            type="hidden"
                            name="studentId"
                            value={
                              student.id
                            }
                          />

                          <button
                            type="submit"
                            className="admin-primary-button"
                            disabled={
                              student.status !==
                              "active"
                            }
                          >
                            {student.auth_user_id
                              ? "Reset access"
                              : "Activate login"}
                          </button>
                        </form>

                        {student.portal_enabled && (
                          <form
                            action={
                              disableStudentAccount
                            }
                          >
                            <input
                              type="hidden"
                              name="studentId"
                              value={
                                student.id
                              }
                            />

                            <button
                              type="submit"
                              className="admin-danger-button"
                            >
                              Disable
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )}

              {!students.length && (
                <tr>
                  <td
                    colSpan={5}
                  >
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
