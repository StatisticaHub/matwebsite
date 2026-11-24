import Link from "next/link";

import {
  updateTutorAssignmentFromWorkspace,
} from "@/app/tutor/actions";

import {
  getTutorSession,
} from "@/lib/tutor-auth";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  homeworkStatusLabels,
  homeworkStatuses,
  type HomeworkStatus,
} from "@/lib/delivery-data";

import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";

export const metadata = {
  title: "Assignments",
};

export const dynamic =
  "force-dynamic";

function dueLabel(
  value:
    | string
    | null,
) {
  if (!value) {
    return "No due date";
  }

  const date =
    new Date(
      `${value}T12:00:00`,
    );

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

function isOverdue(
  dueDate:
    | string
    | null,
  status:
    string,
) {
  if (
    !dueDate ||
    [
      "completed",
      "skipped",
    ].includes(
      status,
    )
  ) {
    return false;
  }

  const today =
    new Date();

  const todayKey =
    [
      today.getFullYear(),
      String(
        today.getMonth() + 1,
      ).padStart(
        2,
        "0",
      ),
      String(
        today.getDate(),
      ).padStart(
        2,
        "0",
      ),
    ].join(
      "-",
    );

  return (
    dueDate <
    todayKey
  );
}

export default async function TutorAssignmentsPage() {
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

  const fmt =
    (
      value:
        | string
        | null,
    ) =>
      formatDateTimeInTimeZone(
        value,
        tutorTimeZone,
      );

  const supabase =
    createAdminClient();

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
        student_id,
        subject,
        title,
        module,
        status,
        students(id,name,academic_level)
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

  if (engagementError) {
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
    return (
      <div className="tutor-page">
        <header className="tutor-page-head">
          <div>
            <span className="tutor-eyebrow">
              Learning workflow
            </span>

            <h1>
              Assignments
            </h1>

            <p>
              Review assigned work,
              submissions and tutor
              feedback across all of
              your students.
            </p>
          </div>
        </header>

        <section className="tutor-panel tutor-empty">
          No students are currently
          assigned to you.
        </section>
      </div>
    );
  }

  const {
    data:
      homeworkData,
    error:
      homeworkError,
  } =
    await supabase
      .from(
        "homework",
      )
      .select(
        "id,created_at,updated_at,engagement_id,title,description,due_date,status,tutor_feedback",
      )
      .in(
        "engagement_id",
        engagementIds,
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        },
      );

  if (homeworkError) {
    throw new Error(
      homeworkError.message,
    );
  }

  const homework =
    (
      homeworkData ||
      []
    ) as any[];

  const homeworkIds =
    homework.map(
      (item) =>
        item.id,
    );

  let submissions:
    any[] = [];

  if (
    homeworkIds.length
  ) {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          "homework_submissions",
        )
        .select(
          "id,homework_id,student_id,note,submission_url,submitted_at,updated_at",
        )
        .in(
          "homework_id",
          homeworkIds,
        )
        .order(
          "submitted_at",
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

    submissions =
      data ||
      [];
  }

  const engagementMap =
    new Map(
      engagements.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );

  const submissionMap =
    new Map<
      string,
      any
    >();

  for (
    const item
    of submissions
  ) {
    if (
      !submissionMap.has(
        item.homework_id,
      )
    ) {
      submissionMap.set(
        item.homework_id,
        item,
      );
    }
  }

  const awaitingReview =
    homework.filter(
      (item) =>
        item.status ===
        "submitted",
    );

  const overdue =
    homework.filter(
      (item) =>
        isOverdue(
          item.due_date,
          item.status,
        ),
    );

  const open =
    homework.filter(
      (item) =>
        ![
          "completed",
          "skipped",
        ].includes(
          item.status,
        ),
    );

  const completed =
    homework.filter(
      (item) =>
        item.status ===
        "completed",
    );

  const priorityRows =
    [
      ...awaitingReview,
      ...overdue.filter(
        (item) =>
          !awaitingReview.some(
            (submitted) =>
              submitted.id ===
              item.id,
          ),
      ),
      ...open.filter(
        (item) =>
          !awaitingReview.some(
            (submitted) =>
              submitted.id ===
              item.id,
          ) &&
          !overdue.some(
            (late) =>
              late.id ===
              item.id,
          ),
      ),
      ...homework.filter(
        (item) =>
          !open.some(
            (openItem) =>
              openItem.id ===
              item.id,
          ),
      ),
    ];

  return (
    <div className="tutor-page tutor-assignments-page">
      <header className="tutor-page-head tutor-page-head-actions">
        <div>
          <span className="tutor-eyebrow">
            Learning workflow
          </span>

          <h1>
            Assignments
          </h1>

          <p>
            Review assigned work,
            student submissions and
            feedback across your
            current learners.
          </p>
        </div>

        <Link
          className="tutor-secondary-button"
          href="/tutor/students"
        >
          Open students
        </Link>
      </header>

      <section className="tutor-command-metrics">
        <article className={
          awaitingReview.length
            ? "attention"
            : ""
        }>
          <span>
            Awaiting review
          </span>

          <strong>
            {awaitingReview.length}
          </strong>

          <small>
            Student submissions
          </small>
        </article>

        <article className={
          overdue.length
            ? "attention"
            : ""
        }>
          <span>
            Overdue
          </span>

          <strong>
            {overdue.length}
          </strong>

          <small>
            Open past due date
          </small>
        </article>

        <article>
          <span>
            Open
          </span>

          <strong>
            {open.length}
          </strong>

          <small>
            Active assignments
          </small>
        </article>

        <article>
          <span>
            Completed
          </span>

          <strong>
            {completed.length}
          </strong>

          <small>
            Finished work
          </small>
        </article>
      </section>

      <section className="tutor-panel tutor-assignment-workspace">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              Review queue
            </span>

            <h2>
              Student work
            </h2>
          </div>

          <span>
            {homework.length} total
          </span>
        </div>

        <div className="tutor-assignment-list">
          {priorityRows.map(
            (item) => {
              const engagement =
                engagementMap.get(
                  item.engagement_id,
                );

              const student =
                Array.isArray(
                  engagement?.students,
                )
                  ? engagement
                      .students[0]
                  : engagement
                      ?.students;

              const submission =
                submissionMap.get(
                  item.id,
                ) ||
                null;

              const late =
                isOverdue(
                  item.due_date,
                  item.status,
                );

              return (
                <article
                  className={
                    item.status ===
                      "submitted" ||
                    late
                      ? "tutor-assignment-card attention"
                      : "tutor-assignment-card"
                  }
                  key={item.id}
                >
                  <div className="tutor-assignment-card-main">
                    <div className="tutor-assignment-card-head">
                      <div>
                        <span className="tutor-eyebrow">
                          {engagement?.subject ||
                            "Tutoring"}
                        </span>

                        <h3>
                          {item.title}
                        </h3>

                        <p>
                          {student?.name ||
                            "Student"}
                          {student
                            ?.academic_level
                            ? ` · ${student.academic_level}`
                            : ""}
                        </p>
                      </div>

                      <span
                        className={`tutor-status ${item.status}`}
                      >
                        {homeworkStatusLabels[
                          item.status as
                            HomeworkStatus
                        ] ||
                          item.status}
                      </span>
                    </div>

                    <div className="tutor-assignment-meta">
                      <span>
                        {item.due_date
                          ? `Due ${dueLabel(
                              item.due_date,
                            )}`
                          : "No due date"}
                      </span>

                      {late && (
                        <strong>
                          Overdue
                        </strong>
                      )}

                      {submission && (
                        <span>
                          Submitted{" "}
                          {fmt(
                            submission
                              .submitted_at,
                          )}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="tutor-help">
                        {item.description}
                      </p>
                    )}

                    {submission && (
                      <div className="tutor-assignment-submission-review">
                        <strong>
                          Student submission
                        </strong>

                        {submission.note && (
                          <p>
                            {submission.note}
                          </p>
                        )}

                        <div className="tutor-assignment-review-links">
                          {submission
                            .submission_url && (
                            <a
                              href={
                                submission
                                  .submission_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open submitted link ↗
                            </a>
                          )}

                          <Link
                            href={`/tutor/materials?engagement=${encodeURIComponent(
                              item.engagement_id,
                            )}`}
                          >
                            Open files & resources →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <form
                    action={
                      updateTutorAssignmentFromWorkspace
                    }
                    className="tutor-assignment-review-form"
                  >
                    <input
                      type="hidden"
                      name="homeworkId"
                      value={item.id}
                    />

                    <label>
                      <span>
                        Status
                      </span>

                      <select
                        name="status"
                        defaultValue={
                          item.status
                        }
                      >
                        {homeworkStatuses.map(
                          (
                            status,
                          ) => (
                            <option
                              key={
                                status
                              }
                              value={
                                status
                              }
                            >
                              {
                                homeworkStatusLabels[
                                  status
                                ]
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label>
                      <span>
                        Feedback
                      </span>

                      <textarea
                        name="feedback"
                        defaultValue={
                          item.tutor_feedback ||
                          ""
                        }
                        placeholder="Give concise feedback, corrections or the next step."
                      />
                    </label>

                    <button
                      className="tutor-primary-button"
                      type="submit"
                    >
                      Save review
                    </button>

                    <div className="tutor-assignment-card-links">
                      <Link
                        href={`/tutor/students/${item.engagement_id}`}
                      >
                        Student workspace →
                      </Link>

                      
                    </div>
                  </form>
                </article>
              );
            },
          )}

          {!homework.length && (
            <div className="tutor-empty">
              No assignments have
              been created yet. Open
              a lesson record to
              assign practice or
              homework.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
