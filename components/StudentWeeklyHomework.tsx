import HomeworkSubmissionForm from "@/components/HomeworkSubmissionForm";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  homeworkStatusLabels,
  type HomeworkStatus,
} from "@/lib/delivery-data";

import {
  resolvePortalLink,
} from "@/lib/student-portal";


type SessionOption = {
  id: string;
  topic: string;

  week_position:
    | number
    | null;

  scheduled_for:
    | string
    | null;
};


type HomeworkRow = {
  id: string;

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
  value: string,
) {
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


export default async function StudentWeeklyHomework({
  token,
  engagementId,
  weekId,
  sessions,
}: {
  token: string;
  engagementId: string;
  weekId: string;

  sessions:
    SessionOption[];
}) {
  const link =
    await resolvePortalLink(
      token,
    );


  if (!link) {
    return null;
  }


  const supabase =
    createAdminClient();


  /*
   * Re-prove course and week access.
   * The component never trusts IDs
   * from the URL/UI alone.
   */
  const [
    engagementResult,
    weekResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "tutoring_engagements",
        )
        .select(
          "id",
        )
        .eq(
          "id",
          engagementId,
        )
        .eq(
          "student_id",
          link.student_id,
        )
        .maybeSingle(),

      supabase
        .from(
          "tutoring_weeks",
        )
        .select(
          "id,status",
        )
        .eq(
          "id",
          weekId,
        )
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
        .maybeSingle(),
    ]);


  if (
    engagementResult.error ||
    weekResult.error ||
    !engagementResult.data ||
    !weekResult.data
  ) {
    return null;
  }


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
            true,
        },
      );


  if (
    error ||
    !data?.length
  ) {
    return null;
  }


  const homework =
    data as HomeworkRow[];


  const {
    data:
      submissionData,
  } =
    await supabase
      .from(
        "homework_submissions",
      )
      .select(`
        homework_id,
        note,
        submission_url,
        submitted_at
      `)
      .eq(
        "student_id",
        link.student_id,
      )
      .in(
        "homework_id",
        homework.map(
          (item) =>
            item.id,
        ),
      );


  const submissions =
    (
      submissionData ||
      []
    ) as SubmissionRow[];


  const submissionByHomework =
    new Map(
      submissions.map(
        (item) => [
          item.homework_id,
          item,
        ],
      ),
    );


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
    <section className="portal-week-homework">

      <div className="portal-week-section-title">

        <span className="portal-kicker">
          Practice
        </span>

        <h3>
          Homework &
          assignments
        </h3>

      </div>


      <div className="portal-week-homework-list">

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


            return (
              <article
                className="portal-week-homework-card"
                key={
                  item.id
                }
              >

                <div className="portal-week-homework-top">

                  <div>

                    <span>
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
                        : "Weekly practice"}
                    </span>

                    <h4>
                      {
                        item.title
                      }
                    </h4>

                  </div>


                  <span
                    className={`portal-status homework-${item.status}`}
                  >
                    {
                      homeworkStatusLabels[
                        item.status
                      ]
                    }
                  </span>

                </div>


                {session && (
                  <small className="portal-week-homework-session">
                    {
                      session.topic
                    }
                  </small>
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


                {item.tutor_feedback && (
                  <div className="portal-feedback">

                    <span>
                      Tutor feedback
                    </span>

                    <p>
                      {
                        item.tutor_feedback
                      }
                    </p>

                  </div>
                )}


                {submission && (
                  <small className="portal-week-homework-submitted">
                    Last submitted{" "}
                    {formatDateTime(
                      submission.submitted_at,
                    )}
                  </small>
                )}


                {![
                  "completed",
                  "skipped",
                ].includes(
                  item.status,
                ) && (
                  <HomeworkSubmissionForm
                    token={
                      token
                    }
                    homeworkId={
                      item.id
                    }
                    existing={
                      submission
                        ? {
                            note:
                              submission.note,

                            submission_url:
                              submission.submission_url,
                          }
                        : null
                    }
                  />
                )}

              </article>
            );
          },
        )}

      </div>

    </section>
  );
}
