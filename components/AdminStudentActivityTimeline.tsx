import Link from "next/link";

import {
  getAdminTimeZone,
} from "@/lib/admin-time-zone";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  formatDateTimeInTimeZone,
} from "@/lib/time-zone";


type TimelineEvent = {
  key: string;
  type:
    | "course"
    | "session"
    | "homework"
    | "request"
    | "report"
    | "communication";
  at: string;
  title: string;
  detail: string | null;
  meta: string | null;
  status: string | null;
  href: string | null;
};


function shortText(
  value: string | null,
  max = 180,
) {
  if (!value) {
    return null;
  }

  const clean =
    value
      .replace(/\s+/g, " ")
      .trim();

  if (clean.length <= max) {
    return clean;
  }

  return (
    clean.slice(
      0,
      max,
    ) + "…"
  );
}


function label(
  value: string,
) {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase(),
    );
}


export default async function AdminStudentActivityTimeline({
  studentId,
}: {
  studentId: string;
}) {
  const supabase =
    createAdminClient();

  const timeZone =
    await getAdminTimeZone();


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
        "id,created_at,student_id,subject,title,status",
      )
      .eq(
        "student_id",
        studentId,
      )
      .order(
        "created_at",
        {
          ascending: false,
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


  const engagementById =
    new Map(
      engagements.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );


  const emptyResult =
    Promise.resolve({
      data: [],
      error: null,
    });


  const [
    sessionResult,
    homeworkResult,
    requestResult,
    reportResult,
    communicationResult,
  ] =
    await Promise.all([

      engagementIds.length
        ? supabase
            .from(
              "tutoring_sessions",
            )
            .select(
              "id,created_at,engagement_id,scheduled_for,completed_at,status,topic,duration_minutes",
            )
            .in(
              "engagement_id",
              engagementIds,
            )
            .order(
              "scheduled_for",
              {
                ascending: false,
                nullsFirst: false,
              },
            )
            .limit(150)

        : emptyResult,


      engagementIds.length
        ? supabase
            .from(
              "homework",
            )
            .select(
              "id,created_at,updated_at,engagement_id,title,status,due_date",
            )
            .in(
              "engagement_id",
              engagementIds,
            )
            .order(
              "updated_at",
              {
                ascending: false,
              },
            )
            .limit(150)

        : emptyResult,


      supabase
        .from(
          "student_support_requests",
        )
        .select(
          "id,created_at,engagement_id,category,message,status",
        )
        .eq(
          "student_id",
          studentId,
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
          "id,created_at,student_id,engagement_id,title,period_start,period_end,student_visible,published_at",
        )
        .eq(
          "student_id",
          studentId,
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
          "id,created_at,engagement_id,communication_type,subject,status",
        )
        .eq(
          "student_id",
          studentId,
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        )
        .limit(100),
    ]);


  const queryError =
    [
      sessionResult.error,
      homeworkResult.error,
      requestResult.error,
      reportResult.error,
      communicationResult.error,
    ].find(Boolean);


  if (queryError) {
    throw new Error(
      queryError.message,
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


  const events:
    TimelineEvent[] =
      [];


  for (
    const engagement
    of engagements
  ) {
    events.push({
      key:
        `course-${engagement.id}`,

      type:
        "course",

      at:
        engagement.created_at,

      title:
        `Course added: ${engagement.subject}`,

      detail:
        engagement.title,

      meta:
        "Course workspace",

      status:
        engagement.status,

      href:
        `/admin/students/${studentId}?engagement=${engagement.id}`,
    });
  }


  for (
    const item
    of sessions
  ) {
    const course =
      engagementById.get(
        item.engagement_id,
      ) as any;


    const eventTime =
      item.completed_at ||
      item.scheduled_for ||
      item.created_at;


    events.push({
      key:
        `session-${item.id}`,

      type:
        "session",

      at:
        eventTime,

      title:
        item.topic ||
        "Tutoring session",

      detail:
        course?.subject
          ? `${course.subject} · ${item.duration_minutes} min`
          : `${item.duration_minutes} min`,

      meta:
        "Session",

      status:
        item.status,

      href:
        `/admin/sessions/${item.id}`,
    });
  }


  for (
    const item
    of homework
  ) {
    const course =
      engagementById.get(
        item.engagement_id,
      ) as any;


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
        course?.subject ||
        null,

      meta:
        item.due_date
          ? `Homework · due ${item.due_date}`
          : "Homework",

      status:
        item.status,

      href:
        item.engagement_id
          ? `/admin/students/${studentId}?engagement=${item.engagement_id}`
          : null,
    });
  }


  for (
    const item
    of requests
  ) {
    const course =
      item.engagement_id
        ? engagementById.get(
            item.engagement_id,
          ) as any
        : null;


    events.push({
      key:
        `request-${item.id}`,

      type:
        "request",

      at:
        item.created_at,

      title:
        `${label(
          item.category,
        )} request`,

      detail:
        shortText(
          item.message,
        ),

      meta:
        course?.subject
          ? `Student request · ${course.subject}`
          : "Student request",

      status:
        item.status,

      href:
        `/admin/requests`,
    });
  }


  for (
    const item
    of reports
  ) {
    const course =
      engagementById.get(
        item.engagement_id,
      ) as any;


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
        course?.subject ||
        null,

      meta:
        `${item.period_start} – ${item.period_end}`,

      status:
        item.published_at ||
        item.student_visible
          ? "published"
          : "draft",

      href:
        `/admin/progress/report/${item.id}`,
    });
  }


  for (
    const item
    of communications
  ) {
    const course =
      item.engagement_id
        ? engagementById.get(
            item.engagement_id,
          ) as any
        : null;


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
        course?.subject ||
        null,

      meta:
        label(
          item.communication_type,
        ),

      status:
        item.status,

      href:
        null,
    });
  }


  events.sort(
    (a, b) =>
      new Date(
        b.at,
      ).getTime() -
      new Date(
        a.at,
      ).getTime(),
  );


  const recentEvents =
    events.slice(
      0,
      30,
    );


  return (
    <section
      className="admin-panel admin-detail-card admin-student-activity"
      aria-label="Student activity timeline"
    >

      <div className="admin-card-head">

        <div>

          <span className="admin-eyebrow">
            Cross-course history
          </span>

          <h2>
            Activity timeline
          </h2>

          <p>
            Recent tutoring activity across all of this
            student&apos;s course workspaces.
          </p>

        </div>


        <span>
          {events.length} recorded events
        </span>

      </div>


      <div className="admin-student-activity-metrics">

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


        <div>
          <span>
            Communications
          </span>

          <strong>
            {communications.length}
          </strong>
        </div>

      </div>


      <div className="admin-student-activity-list">

        {recentEvents.map(
          (event) => (

            <article
              key={
                event.key
              }
              className={`admin-student-activity-row activity-${event.type}`}
            >

              <div className="admin-student-activity-marker">
                <span />
              </div>


              <div className="admin-student-activity-copy">

                <div className="admin-student-activity-top">

                  <span>
                    {event.meta}
                  </span>

                  <time>
                    {formatDateTimeInTimeZone(
                      event.at,
                      timeZone,
                    )}
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


              <div className="admin-student-activity-action">

                {event.status && (
                  <span
                    className={`admin-student-activity-status status-${event.status}`}
                  >
                    {label(
                      event.status,
                    )}
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


        {!recentEvents.length && (
          <div className="admin-empty compact">
            No tutoring activity has been recorded for this
            student yet.
          </div>
        )}

      </div>

    </section>
  );
}
