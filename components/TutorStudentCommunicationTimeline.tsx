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


type CommunicationEvent = {
  key: string;

  kind:
    | "email"
    | "request";

  at: string;

  title: string;

  detail:
    | string
    | null;

  meta: string;

  status:
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
  max = 220,
) {
  if (!value) {
    return null;
  }

  const cleaned =
    value
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  if (
    cleaned.length <=
    max
  ) {
    return cleaned;
  }

  return (
    cleaned.slice(
      0,
      max,
    ) + "…"
  );
}


export default async function TutorStudentCommunicationTimeline({
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
   * Course ownership gate.
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
        "id,student_id,tutor_id,subject",
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
    communicationResult,
    requestResult,
  ] =
    await Promise.all([

      supabase
        .from(
          "student_communications",
        )
        .select(
          "id,created_at,communication_type,channel,subject,status,error",
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
          "student_support_requests",
        )
        .select(
          "id,created_at,category,message,status,resolved_at",
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


  if (
    communicationResult.error
  ) {
    throw new Error(
      communicationResult.error.message,
    );
  }


  if (
    requestResult.error
  ) {
    throw new Error(
      requestResult.error.message,
    );
  }


  const communications =
    (
      communicationResult.data ||
      []
    ) as any[];


  const requests =
    (
      requestResult.data ||
      []
    ) as any[];


  const events:
    CommunicationEvent[] =
      [];


  for (
    const item
    of communications
  ) {

    events.push({
      key:
        `email-${item.id}`,

      kind:
        "email",

      at:
        item.created_at,

      title:
        item.subject ||
        "Student email",

      detail:
        item.status ===
          "failed"
          ? shortText(
              item.error,
            )
          : null,

      meta:
        `${titleCase(
          item.communication_type,
        )} · ${titleCase(
          item.channel ||
          "email",
        )}`,

      status:
        item.status,
    });
  }


  for (
    const item
    of requests
  ) {

    events.push({
      key:
        `request-${item.id}`,

      kind:
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
        "Student → tutor",

      status:
        item.status,
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
      20,
    );


  const openRequests =
    requests.filter(
      (item) =>
        item.status ===
          "new" ||
        item.status ===
          "in_progress",
    ).length;


  const failedEmails =
    communications.filter(
      (item) =>
        item.status ===
        "failed",
    ).length;


  return (
    <section
      className="tutor-panel tutor-communication-timeline"
      aria-label="Student communication timeline"
    >

      <div className="tutor-panel-head">

        <div>

          <span className="tutor-eyebrow">
            Student contact
          </span>

          <h2>
            Communication timeline
          </h2>

          <p>
            Course-specific emails and requests exchanged
            with this student.
          </p>

        </div>


        <span>
          {events.length} records
        </span>

      </div>


      <div className="tutor-communication-metrics">

        <div>

          <span>
            Emails
          </span>

          <strong>
            {communications.length}
          </strong>

          <small>
            Delivery records
          </small>

        </div>


        <div>

          <span>
            Requests
          </span>

          <strong>
            {requests.length}
          </strong>

          <small>
            Student messages
          </small>

        </div>


        <div>

          <span>
            Open requests
          </span>

          <strong>
            {openRequests}
          </strong>

          <small>
            Need response
          </small>

        </div>


        <div>

          <span>
            Failed emails
          </span>

          <strong>
            {failedEmails}
          </strong>

          <small>
            Delivery issues
          </small>

        </div>

      </div>


      <div className="tutor-communication-list">

        {recent.map(
          (event) => (

            <article
              key={
                event.key
              }
              className={`tutor-communication-row communication-${event.kind}`}
            >

              <div className="tutor-communication-marker">

                <span />

              </div>


              <div className="tutor-communication-copy">

                <div className="tutor-communication-meta">

                  <span>
                    {event.meta}
                  </span>

                  <time>
                    {formatDateTimeInTimeZone(
                      event.at,
                      tutorTimeZone,
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


              <div className="tutor-communication-state">

                {event.status && (
                  <span
                    className={`status-${event.status}`}
                  >
                    {titleCase(
                      event.status,
                    )}
                  </span>
                )}

              </div>

            </article>
          ),
        )}


        {!recent.length && (
          <div className="tutor-empty">
            No course-specific communication has been
            recorded yet.
          </div>
        )}

      </div>

    </section>
  );
}
