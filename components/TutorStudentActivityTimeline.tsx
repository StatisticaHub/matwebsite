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


type TimelineEvent = {
  key: string;

  type:
    | "session"
    | "homework"
    | "submission"
    | "request"
    | "report"
    | "communication";

  at: string;

  title: string;

  detail:
    | string
    | null;

  meta:
    | string
    | null;

  status:
    | string
    | null;

  href:
    | string
    | null;
};


function titleCase(
  value: string,
) {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}


function shortText(
  value:
    | string
    | null,
  max = 170,
) {
  if (!value) {
    return null;
  }

  const clean =
    value
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  if (
    clean.length <= max
  ) {
    return clean;
  }

  return (
    clean.slice(
      0,
      max,
    ) + "…"
  );
}


export default async function TutorStudentActivityTimeline({
  engagementId,
}: {
  engagementId: string;
}) {

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


  /*
   * Ownership gate:
   * tutor must currently own this course workspace.
   */
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
      .select(
        "id,student_id,tutor_id,subject,title",
      )
      .eq(
        "id",
        engagementId,
      )
      .eq(
        "tutor_id",
        auth.tutor.id,
      )
      .maybeSingle();


  if (
    engagementError
  ) {
    throw new Error(
      engagementError.message,
    );
  }


  if (
    !engagementData
  ) {
    return null;
  }


  const engagement =
    engagementData as any;


  const [
    sessionResult,
    homeworkResult,
    requestResult,
    reportResult,
    communicationResult,
  ] =
    await Promise.all([

      supabase
        .from(
          "tutoring_sessions",
        )
        .select(
          "id,created_at,scheduled_for,completed_at,duration_minutes,status,topic,lesson_notes",
        )
        .eq(
          "engagement_id",
          engagementId,
        )
        .order(
          "scheduled_for",
          {
            ascending: false,
            nullsFirst: false,
          },
        )
        .limit(150),


      supabase
        .from(
          "homework",
        )
        .select(
          "id,created_at,updated_at,title,description,due_date,status,tutor_feedback",
        )
        .eq(
          "engagement_id",
          engagementId,
        )
        .order(
          "updated_at",
          {
            ascending: false,
          },
        )
        .limit(150),


      supabase
        .from(
          "student_support_requests",
        )
        .select(
          "id,created_at,category,message,status",
        )
        .eq(
          "student_id",
          engagement.student_id,
        )
        .eq(
          "engagement_id",
          engagementId,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(100),


      supabase
        .from(
          "progress_reports",
        )
        .select(
          "id,created_at,title,period_start,period_end,student_visible,published_at",
        )
        .eq(
          "engagement_id",
          engagementId,
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
        )
        .limit(100),


      supabase
        .from(
          "student_communications",
        )
        .select(
          "id,created_at,communication_type,subject,status",
        )
        .eq(
          "student_id",
          engagement.student_id,
        )
        .eq(
          "engagement_id",
          engagementId,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(100),
    ]);


  const firstError =
    [
      sessionResult.error,
      homeworkResult.error,
      requestResult.error,
      reportResult.error,
      communicationResult.error,
    ].find(Boolean);


  if (
    firstError
  ) {
    throw new Error(
      firstError.message,
    );
  }


  const sessions =
    (
      sessionResult.data ||
      []
    ) as any[];


  const homework =
    (
      homeworkResult.data ||
      []
    ) as any[];


  const requests =
    (
      requestResult.data ||
      []
    ) as any[];


  const reports =
    (
      reportResult.data ||
      []
    ) as any[];


  const communications =
    (
      communicationResult.data ||
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
      data:
        submissionData,
      error:
        submissionError,
    } =
      await supabase
        .from(
          "homework_submissions",
        )
        .select(
          "id,homework_id,submitted_at,note",
        )
        .eq(
          "student_id",
          engagement.student_id,
        )
        .in(
          "homework_id",
          homeworkIds,
        )
        .order(
          "submitted_at",
          {
            ascending: false,
          },
        );


    if (
      submissionError
    ) {
      throw new Error(
        submissionError.message,
      );
    }


    submissions =
      submissionData ||
      [];
  }


  const homeworkById =
    new Map(
      homework.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );


  const events:
    TimelineEvent[] =
      [];


  for (
    const item
    of sessions
  ) {

    const when =
      item.completed_at ||
      item.scheduled_for ||
      item.created_at;


    events.push({
      key:
        `session-${item.id}`,

      type:
        "session",

      at:
        when,

      title:
        item.topic ||
        "Tutoring session",

      detail:
        item.lesson_notes
          ? shortText(
              item.lesson_notes,
            )
          : `${item.duration_minutes} minute lesson`,

      meta:
        `${item.duration_minutes} min session`,

      status:
        item.status,

      href:
        `/tutor/sessions/${item.id}`,
    });
  }


  for (
    const item
    of homework
  ) {

    events.push({
      key:
        `homework-${item.id}`,

      type:
        "homework",

      at:
        item.updated_at ||
        item.created_at,

      title:
        item.title ||
        "Homework",

      detail:
        shortText(
          item.tutor_feedback ||
          item.description,
        ),

      meta:
        item.due_date
          ? `Homework · due ${item.due_date}`
          : "Homework",

      status:
        item.status,

      href:
        "/tutor/assignments",
    });
  }


  for (
    const item
    of submissions
  ) {

    const task =
      homeworkById.get(
        item.homework_id,
      ) as any;


    events.push({
      key:
        `submission-${item.id}`,

      type:
        "submission",

      at:
        item.submitted_at,

      title:
        task?.title
          ? `Submitted: ${task.title}`
          : "Homework submitted",

      detail:
        shortText(
          item.note,
        ),

      meta:
        "Student submission",

      status:
        "submitted",

      href:
        "/tutor/assignments",
    });
  }


  for (
    const item
    of requests
  ) {

    events.push({
      key:
        `request-${item.id}`,

      type:
        "request",

      at:
        item.created_at,

      title:
        `${titleCase(
          item.category,
        )} request`,

      detail:
        shortText(
          item.message,
        ),

      meta:
        "Student request",

      status:
        item.status,

      href:
        null,
    });
  }


  for (
    const item
    of reports
  ) {

    events.push({
      key:
        `report-${item.id}`,

      type:
        "report",

      at:
        item.published_at ||
        item.created_at,

      title:
        item.title ||
        "Progress report",

      detail:
        `${item.period_start} – ${item.period_end}`,

      meta:
        "Progress report",

      status:
        item.published_at ||
        item.student_visible
          ? "published"
          : "draft",

      href:
        `/tutor/progress/report/${item.id}`,
    });
  }


  for (
    const item
    of communications
  ) {

    events.push({
      key:
        `communication-${item.id}`,

      type:
        "communication",

      at:
        item.created_at,

      title:
        item.subject ||
        "Student communication",

      detail:
        null,

      meta:
        titleCase(
          item.communication_type,
        ),

      status:
        item.status,

      href:
        null,
    });
  }


  events.sort(
    (
      first,
      second,
    ) =>
      new Date(
        second.at,
      ).getTime() -
      new Date(
        first.at,
      ).getTime(),
  );


  const recent =
    events.slice(
      0,
      30,
    );


  return (
    <section
      className="tutor-panel tutor-course-activity"
      aria-label="Course activity timeline"
    >

      <div className="tutor-panel-head tutor-course-activity-head">

        <div>

          <span className="tutor-eyebrow">
            Course history
          </span>

          <h2>
            Activity timeline
          </h2>

          <p>
            Recent teaching, homework, student requests,
            progress and communication for this course.
          </p>

        </div>


        <span>
          {events.length} events
        </span>

      </div>


      <div className="tutor-course-activity-metrics">

        <div>

          <span>
            Sessions
          </span>

          <strong>
            {sessions.length}
          </strong>

        </div>


        <div>

          <span>
            Homework
          </span>

          <strong>
            {homework.length}
          </strong>

        </div>


        <div>

          <span>
            Submissions
          </span>

          <strong>
            {submissions.length}
          </strong>

        </div>


        <div>

          <span>
            Requests
          </span>

          <strong>
            {requests.length}
          </strong>

        </div>


        <div>

          <span>
            Reports
          </span>

          <strong>
            {reports.length}
          </strong>

        </div>

      </div>


      <div className="tutor-course-activity-list">

        {recent.map(
          (event) => (

            <article
              className={`tutor-course-activity-row activity-${event.type}`}
              key={
                event.key
              }
            >

              <div className="tutor-course-activity-marker">
                <span />
              </div>


              <div className="tutor-course-activity-copy">

                <div className="tutor-course-activity-top">

                  <span>
                    {event.meta}
                  </span>

                  <time>
                    {
                      formatDateTimeInTimeZone(
                        event.at,
                        tutorTimeZone,
                      )
                    }
                  </time>

                </div>


                <strong>
                  {event.title}
                </strong>


                {event.detail && (
                  <p>
                    {event.detail}
                  </p>
                )}

              </div>


              <div className="tutor-course-activity-action">

                {event.status && (
                  <span
                    className={`tutor-course-activity-status status-${event.status}`}
                  >
                    {
                      titleCase(
                        event.status,
                      )
                    }
                  </span>
                )}


                {event.href && (
                  <Link
                    href={
                      event.href
                    }
                  >
                    Open →
                  </Link>
                )}

              </div>

            </article>
          ),
        )}


        {!recent.length && (
          <div className="tutor-empty">
            No course activity has been recorded yet.
          </div>
        )}

      </div>

    </section>
  );
}
