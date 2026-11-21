import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  homeworkStatusLabels,
  homeworkStatuses,
  type HomeworkStatus,
} from "@/lib/delivery-data";

import {
  safeExternalUrl,
} from "@/lib/student-portal";

import {
  createTutorHomeworkInWeek,
  reviewTutorHomeworkInWeek,
} from "@/app/tutor/week-actions";


type SessionOption = {
  id: string;
  topic: string;

  scheduled_for:
    | string
    | null;

  week_position:
    | number
    | null;
};


type HomeworkRow = {
  id: string;
  created_at: string;

  engagement_id: string;

  week_id:
    | string
    | null;

  session_id:
    | string
    | null;

  title: string;

  description:
    | string
    | null;

  due_date:
    | string
    | null;

  status:
    HomeworkStatus;

  tutor_feedback:
    | string
    | null;
};


type SubmissionRow = {
  id: string;
  homework_id: string;

  note:
    | string
    | null;

  submission_url:
    | string
    | null;

  submitted_at: string;
};


function formatDate(
  value:
    | string
    | null,
) {
  if (!value) {
    return "No due date";
  }


  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",
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
    return "Not submitted";
  }


  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",

      timeZone:
        "Europe/London",
    },
  ).format(
    new Date(value),
  );
}


export default async function TutorWeeklyHomework({
  engagementId,
  weekId,
  sessions,
}: {
  engagementId: string;
  weekId: string;
  sessions:
    SessionOption[];
}) {
  const supabase =
    createAdminClient();


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "homework",
      )
      .select(`
        id,
        created_at,
        engagement_id,
        week_id,
        session_id,
        title,
        description,
        due_date,
        status,
        tutor_feedback
      `)
      .eq(
        "engagement_id",
        engagementId,
      )
      .eq(
        "week_id",
        weekId,
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


  const homework =
    (
      data ||
      []
    ) as HomeworkRow[];


  const homeworkIds =
    homework.map(
      (item) =>
        item.id,
    );


  const {
    data:
      submissionData,

    error:
      submissionError,
  } =
    homeworkIds.length
      ? await supabase
          .from(
            "homework_submissions",
          )
          .select(`
            id,
            homework_id,
            note,
            submission_url,
            submitted_at
          `)
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
          )
      : {
          data:
            [] as SubmissionRow[],

          error:
            null,
        };


  if (submissionError) {
    throw new Error(
      submissionError.message,
    );
  }


  const submissions =
    (
      submissionData ||
      []
    ) as SubmissionRow[];


  const submissionByHomework =
    new Map<
      string,
      SubmissionRow
    >();


  for (
    const submission
    of submissions
  ) {
    if (
      !submissionByHomework.has(
        submission.homework_id,
      )
    ) {
      submissionByHomework.set(
        submission.homework_id,
        submission,
      );
    }
  }


  const sessionById =
    new Map(
      sessions.map(
        (session) => [
          session.id,
          session,
        ],
      ),
    );


  return (
    <section className="tutor-week-homework">

      <div className="tutor-week-homework-head">

        <div>

          <span className="tutor-eyebrow">
            Practice
          </span>

          <h3>
            Homework &
            assignments
          </h3>

          <p>
            Assign work to the
            whole week or attach it
            to a specific session.
          </p>

        </div>


        <strong>
          {
            homework.length
          }{" "}
          item
          {homework.length === 1
            ? ""
            : "s"}
        </strong>

      </div>


      <details className="tutor-week-homework-create">

        <summary>
          + Assign homework
        </summary>


        <form
          action={
            createTutorHomeworkInWeek
          }
          className="tutor-form"
        >

          <input
            type="hidden"
            name="weekId"
            value={
              weekId
            }
          />


          <label>

            <span>
              Attach to
            </span>

            <select
              name="sessionId"
              defaultValue=""
            >

              <option value="">
                Whole week
              </option>


              {sessions.map(
                (
                  session,
                  index,
                ) => (
                  <option
                    key={
                      session.id
                    }
                    value={
                      session.id
                    }
                  >
                    Session{" "}
                    {session.week_position ||
                      index +
                        1}
                    {" — "}
                    {session.topic}
                  </option>
                ),
              )}

            </select>

          </label>


          <label>

            <span>
              Homework title
            </span>

            <input
              name="title"
              maxLength={500}
              placeholder="e.g. Regression practice — Questions 1–10"
              required
            />

          </label>


          <label>

            <span>
              Instructions
            </span>

            <textarea
              name="description"
              placeholder="What should the student complete, revise, read, code or submit?"
            />

          </label>


          <label>

            <span>
              Due date
            </span>

            <input
              name="dueDate"
              type="date"
            />

          </label>


          <label className="tutor-week-notify-toggle">

            <input
              type="checkbox"
              name="notifyStudent"
              defaultChecked
            />

            <span>
              Email the student
              when this homework
              is assigned
            </span>

          </label>


          <button
            className="tutor-primary-button"
            type="submit"
          >
            Assign homework
          </button>

        </form>

      </details>


      <div className="tutor-week-homework-list">

        {homework.map(
          (item) => {

            const session =
              item.session_id
                ? sessionById.get(
                    item.session_id,
                  ) ||
                  null
                : null;


            const submission =
              submissionByHomework.get(
                item.id,
              ) ||
              null;


            const submissionUrl =
              safeExternalUrl(
                submission
                  ?.submission_url,
              );


            return (
              <article
                className="tutor-week-homework-card"
                key={
                  item.id
                }
              >

                <div className="tutor-week-homework-card-head">

                  <div>

                    <span className="tutor-week-homework-context">
                      {session
                        ? `Session ${
                            session.week_position ||
                            sessions.findIndex(
                              (
                                candidate,
                              ) =>
                                candidate.id ===
                                session.id,
                            ) +
                              1
                          }`
                        : "Whole week"}
                    </span>

                    <h4>
                      {
                        item.title
                      }
                    </h4>

                  </div>


                  <span
                    className={`tutor-status ${item.status}`}
                  >
                    {
                      homeworkStatusLabels[
                        item.status
                      ]
                    }
                  </span>

                </div>


                {session && (
                  <p className="tutor-week-homework-session">
                    {
                      session.topic
                    }
                  </p>
                )}


                <small>
                  {item.due_date
                    ? `Due ${formatDate(
                        item.due_date,
                      )}`
                    : "No due date"}
                </small>


                {item.description && (
                  <p>
                    {
                      item.description
                    }
                  </p>
                )}


                {submission && (
                  <div className="tutor-week-submission">

                    <strong>
                      Student submission
                    </strong>

                    <span>
                      {formatDateTime(
                        submission.submitted_at,
                      )}
                    </span>

                    {submission.note && (
                      <p>
                        {
                          submission.note
                        }
                      </p>
                    )}

                    {submissionUrl && (
                      <a
                        href={
                          submissionUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open submitted
                        work ↗
                      </a>
                    )}

                  </div>
                )}


                {item.tutor_feedback && (
                  <div className="tutor-week-feedback-preview">

                    <strong>
                      Current feedback
                    </strong>

                    <p>
                      {
                        item.tutor_feedback
                      }
                    </p>

                  </div>
                )}


                <details className="tutor-week-homework-review">

                  <summary>
                    Review / update
                  </summary>


                  <form
                    action={
                      reviewTutorHomeworkInWeek
                    }
                    className="tutor-form"
                  >

                    <input
                      type="hidden"
                      name="homeworkId"
                      value={
                        item.id
                      }
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
                        Tutor feedback
                      </span>

                      <textarea
                        name="feedback"
                        defaultValue={
                          item.tutor_feedback ||
                          ""
                        }
                        placeholder="Feedback, corrections, strengths and what to do next."
                      />

                    </label>


                    <label className="tutor-week-notify-toggle">

                      <input
                        type="checkbox"
                        name="notifyStudent"
                        defaultChecked
                      />

                      <span>
                        Email this update
                        to the student
                      </span>

                    </label>


                    <button
                      className="tutor-secondary-button"
                      type="submit"
                    >
                      Save homework
                      update
                    </button>

                  </form>

                </details>

              </article>
            );
          },
        )}


        {!homework.length && (
          <div className="tutor-empty">
            No homework has been
            assigned for this week.
          </div>
        )}

      </div>

    </section>
  );
}
