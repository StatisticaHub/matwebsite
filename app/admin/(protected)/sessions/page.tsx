import Link from "next/link";
import ViewerLocalDateTime from "@/components/ViewerLocalDateTime";
import { createAdminClient } from "@/lib/supabase/admin";
import { isZoomConfigured } from "@/lib/zoom";
import {
  sessionStatusLabels,
  sessionStatuses,
  type SessionStatus,
} from "@/lib/delivery-data";
import {
  acceptSessionCancellationRequest,
  acceptSessionRescheduleRequest,
  createTutoringSessionFromAdmin,
} from "@/app/admin/session-management-actions";
import {
  updateSupportRequest,
} from "@/app/admin/portal-actions";

export const metadata = {
  title: "Sessions",
};

export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  scheduled_for: string | null;
  duration_minutes: number;
  status: SessionStatus;
  topic: string;
  understanding_rating: number | null;
  zoom_meeting_id: string | null;
  zoom_started_at: string | null;
  zoom_ended_at: string | null;
  engagement_id: string;
  tutor_id: string | null;
  session_tutor: {
    name: string;
  } | null;
  tutoring_engagements: {
    student_id: string;
    subject: string;
    title: string;
    students: {
      name: string;
    } | null;
    tutors: {
      name: string;
    } | null;
  } | null;
};

type EngagementOption = {
  id: string;
  student_id: string;
  tutor_id: string | null;
  subject: string;
  title: string;
  session_duration_minutes: number;
  students: {
    name: string;
  } | null;
  tutors: {
    name: string;
  } | null;
};

type SessionRequestRow = {
  id: string;
  created_at: string;
  student_id: string;
  engagement_id: string | null;
  message: string;
  status: "new" | "in_progress" | "resolved";
  admin_note: string | null;
};

type ParsedSessionRequest = {
  preferredDate: string | null;
  preferredTime: string | null;
  timezone: string | null;
  preferredUtc: string | null;
  durationMinutes: number | null;
  urgency: string | null;
  topic: string | null;
  notes: string | null;
};

type ParsedSessionChangeRequest = {
  changeType: "Reschedule" | "Cancellation" | null;
  sessionId: string | null;
  currentScheduledUtc: string | null;
  sessionTopic: string | null;
  requestedDate: string | null;
  requestedTime: string | null;
  timezone: string | null;
  requestedUtc: string | null;
  reason: string | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function formatDateTimeInZone(
  value: string | null,
  timeZone: string
) {
  if (!value) {
    return "Not specified";
  }

  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone,
      }
    ).format(
      new Date(value)
    );
  } catch {
    return "Not specified";
  }
}

function toDateTimeLocalInZone(
  value: string | null,
  timeZone: string
) {
  if (!value) {
    return "";
  }

  try {
    const parts =
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hourCycle: "h23",
        }
      ).formatToParts(
        new Date(value)
      );

    const map =
      Object.fromEntries(
        parts
          .filter(
            (part) =>
              part.type !==
              "literal"
          )
          .map(
            (part) => [
              part.type,
              part.value,
            ]
          )
      );

    return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
  } catch {
    return "";
  }
}

function ukDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${map.year}-${map.month}-${map.day}`;
}

function hours(minutes: number) {
  return (
    Math.round((minutes / 60) * 10) / 10
  ).toFixed(1);
}

function messageLine(message: string, label: string) {
  const prefix = `${label}:`;

  const line = message
    .split(/\r?\n/)
    .find((item) =>
      item.trim().startsWith(prefix)
    );

  if (!line) return null;

  const value = line
    .trim()
    .slice(prefix.length)
    .trim();

  return value || null;
}

function messageSection(
  message: string,
  startLabel: string,
  endLabel?: string
) {
  const startToken = `${startLabel}:`;
  const start = message.indexOf(startToken);

  if (start < 0) return null;

  const contentStart =
    start + startToken.length;

  let contentEnd =
    message.length;

  if (endLabel) {
    const endToken = `${endLabel}:`;
    const found = message.indexOf(
      endToken,
      contentStart
    );

    if (found >= 0) {
      contentEnd = found;
    }
  }

  const value = message
    .slice(
      contentStart,
      contentEnd
    )
    .trim();

  return value || null;
}

function parseSessionRequest(
  message: string
): ParsedSessionRequest {
  const durationText =
    messageLine(
      message,
      "Session length"
    );

  const durationMatch =
    durationText?.match(
      /(\d{1,3})/
    );

  const durationMinutes =
    durationMatch
      ? Number(
          durationMatch[1]
        )
      : null;

  return {
    preferredDate:
      messageLine(
        message,
        "Preferred local date"
      ) ||
      messageLine(
        message,
        "Preferred date"
      ),

    preferredTime:
      messageLine(
        message,
        "Preferred local time"
      ) ||
      messageLine(
        message,
        "Preferred time"
      ),

    timezone:
      messageLine(
        message,
        "Student timezone"
      ) ||
      messageLine(
        message,
        "Timezone"
      ),

    preferredUtc:
      messageLine(
        message,
        "Preferred UTC"
      ),

    durationMinutes:
      durationMinutes &&
      durationMinutes >= 15 &&
      durationMinutes <= 480
        ? durationMinutes
        : null,

    urgency:
      messageLine(
        message,
        "Urgency"
      ),

    topic:
      messageSection(
        message,
        "Topic / goal",
        "Additional notes"
      ),

    notes:
      messageSection(
        message,
        "Additional notes"
      ),
  };
}

function parseSessionChangeRequest(
  message: string
): ParsedSessionChangeRequest {
  const rawType =
    messageLine(
      message,
      "Change type"
    );

  const changeType =
    rawType ===
      "Reschedule" ||
    rawType ===
      "Cancellation"
      ? rawType
      : null;

  return {
    changeType,

    sessionId:
      messageLine(
        message,
        "Session ID"
      ),

    currentScheduledUtc:
      messageLine(
        message,
        "Current scheduled UTC"
      ),

    sessionTopic:
      messageLine(
        message,
        "Session topic"
      ),

    requestedDate:
      messageLine(
        message,
        "Requested local date"
      ),

    requestedTime:
      messageLine(
        message,
        "Requested local time"
      ),

    timezone:
      messageLine(
        message,
        "Student timezone"
      ),

    requestedUtc:
      messageLine(
        message,
        "Requested UTC"
      ),

    reason:
      messageSection(
        message,
        "Reason"
      ),
  };
}

function requestStatusLabel(
  status: SessionRequestRow["status"]
) {
  if (status === "in_progress") {
    return "In progress";
  }

  if (status === "resolved") {
    return "Resolved";
  }

  return "New";
}

export default async function SessionsPage() {
  const supabase =
    createAdminClient();

  const zoomReady =
    isZoomConfigured();

  const [
    {
      data,
      error,
    },
    {
      data: engagementData,
    },
    {
      data: tutorData,
    },
    {
      data: requestData,
      error: requestError,
    },
  ] = await Promise.all([
    supabase
      .from(
        "tutoring_sessions"
      )
      .select(
        "id,scheduled_for,duration_minutes,status,topic,understanding_rating,zoom_meeting_id,zoom_started_at,zoom_ended_at,engagement_id,tutor_id,session_tutor:tutors(name),tutoring_engagements(student_id,subject,title,students(name),tutors(name))"
      )
      .order(
        "scheduled_for",
        {
          ascending: false,
          nullsFirst: false,
        }
      )
      .limit(500),

    supabase
      .from(
        "tutoring_engagements"
      )
      .select(
        "id,student_id,tutor_id,subject,title,session_duration_minutes,students(name),tutors(name)"
      )
      .eq(
        "status",
        "active"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),

    supabase
      .from("tutors")
      .select("id,name")
      .eq(
        "status",
        "active"
      )
      .order("name"),

    supabase
      .from(
        "student_support_requests"
      )
      .select(
        "id,created_at,student_id,engagement_id,message,status,admin_note"
      )
      .eq(
        "category",
        "session_request"
      )
      .neq(
        "status",
        "resolved"
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )
      .limit(100),
  ]);

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (requestError) {
    throw new Error(
      requestError.message
    );
  }

  const sessions =
    (data || []) as unknown as SessionRow[];

  const engagements =
    (engagementData ||
      []) as unknown as EngagementOption[];

  const tutors =
    (tutorData || []) as Array<{
      id: string;
      name: string;
    }>;

  const allSessionRequests =
    (requestData ||
      []) as SessionRequestRow[];

  const sessionChangeRequests =
    allSessionRequests.filter(
      (item) =>
        item.message.startsWith(
          "SESSION CHANGE REQUEST"
        )
    );

  const sessionRequests =
    allSessionRequests.filter(
      (item) =>
        !item.message.startsWith(
          "SESSION CHANGE REQUEST"
        )
    );

  const openSessionOperations =
    sessionRequests.length +
    sessionChangeRequests.length;

  const engagementById =
    new Map(
      engagements.map(
        (item) => [
          item.id,
          item,
        ]
      )
    );

  const sessionById =
    new Map(
      sessions.map(
        (item) => [
          item.id,
          item,
        ]
      )
    );

  const now = new Date();

  const todayKey =
    ukDateKey(now);

  const needsCloseOut = sessions
    .filter(
      (item) =>
        item.status === "planned" &&
        Boolean(item.zoom_ended_at)
    )
    .sort(
      (a, b) =>
        new Date(
          b.zoom_ended_at || 0
        ).getTime() -
        new Date(
          a.zoom_ended_at || 0
        ).getTime()
    );

  const today = sessions
    .filter(
      (item) =>
        item.scheduled_for &&
        ukDateKey(
          new Date(
            item.scheduled_for
          )
        ) === todayKey &&
        item.status === "planned" &&
        !item.zoom_ended_at
    )
    .sort(
      (a, b) =>
        new Date(
          a.scheduled_for || 0
        ).getTime() -
        new Date(
          b.scheduled_for || 0
        ).getTime()
    );

  const upcoming = sessions
    .filter(
      (item) =>
        item.status === "planned" &&
        !item.zoom_ended_at &&
        item.scheduled_for &&
        new Date(
          item.scheduled_for
        ) > now &&
        ukDateKey(
          new Date(
            item.scheduled_for
          )
        ) !== todayKey
    )
    .sort(
      (a, b) =>
        new Date(
          a.scheduled_for || 0
        ).getTime() -
        new Date(
          b.scheduled_for || 0
        ).getTime()
    );

  const completed =
    sessions.filter(
      (item) =>
        item.status ===
        "completed"
    );

  const completedMinutes =
    completed.reduce(
      (sum, item) =>
        sum +
        item.duration_minutes,
      0
    );

  const noShows =
    sessions.filter(
      (item) =>
        item.status ===
        "no_show"
    ).length;

  const tutorHours =
    new Map<
      string,
      number
    >();

  const studentHours =
    new Map<
      string,
      number
    >();

  for (const item of completed) {
    const tutorName =
      item.session_tutor
        ?.name ||
      item
        .tutoring_engagements
        ?.tutors?.name ||
      "Unassigned tutor";

    const studentName =
      item
        .tutoring_engagements
        ?.students?.name ||
      "Student";

    tutorHours.set(
      tutorName,
      (tutorHours.get(
        tutorName
      ) || 0) +
        item.duration_minutes
    );

    studentHours.set(
      studentName,
      (studentHours.get(
        studentName
      ) || 0) +
        item.duration_minutes
    );
  }

  const topTutors = [
    ...tutorHours.entries(),
  ]
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(0, 8);

  const topStudents = [
    ...studentHours.entries(),
  ]
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .slice(0, 8);

  return (
    <div className="admin-page">

      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">
            Tutoring delivery
          </span>

          <h1>
            Session management
          </h1>

          <p>
            Schedule lessons, review
            student session requests,
            monitor today&apos;s
            teaching, update outcomes
            and track delivered
            tutoring hours.
          </p>
        </div>
      </header>


      <section className="admin-metrics admin-metrics-4">
        <div>
          <span>
            Today
          </span>

          <strong>
            {today.length}
          </strong>
        </div>

        <div>
          <span>
            Upcoming
          </span>

          <strong>
            {upcoming.length}
          </strong>
        </div>

        <div>
          <span>
            Delivered hours
          </span>

          <strong>
            {hours(
              completedMinutes
            )}
          </strong>
        </div>

        <div>
          <span>
            Session requests
          </span>

          <strong>
            {
              openSessionOperations
            }
          </strong>
        </div>
      </section>


      {needsCloseOut.length > 0 && (
        <section
          className="admin-panel admin-detail-card"
          id="session-closeout"
        >
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Zoom activity
              </span>

              <h2>
                Sessions waiting for close-out
              </h2>
            </div>

            <span>
              {needsCloseOut.length} waiting
            </span>
          </div>

          <p className="admin-help">
            Zoom has reported that these meetings ended, but the
            tutoring record is still planned. Open each session,
            review the lesson outcome and mark it completed or
            no-show.
          </p>

          <div className="admin-session-queue">
            {needsCloseOut.map(
              (item) => (
                <Link
                  key={item.id}
                  href={`/admin/sessions/${item.id}`}
                >
                  <div>
                    <strong>
                      {item.tutoring_engagements
                        ?.students?.name ||
                        "Student"}
                    </strong>

                    <span>
                      {item.tutoring_engagements
                        ?.subject ||
                        "Tutoring"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {item.topic}
                    </strong>

                    <span>
                      Zoom ended{" "}
                      <ViewerLocalDateTime value={
                        item.zoom_ended_at
                      } />
                    </span>
                  </div>

                  <b>
                    Close out →
                  </b>
                </Link>
              )
            )}
          </div>
        </section>
      )}


      {/* ================================================================
          STUDENT SESSION CHANGE QUEUE
         ================================================================ */}

      <section
        className="admin-panel admin-detail-card"
        id="session-changes"
      >
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Existing bookings
            </span>

            <h2>
              Session changes
            </h2>
          </div>

          <span>
            {
              sessionChangeRequests.length
            }{" "}
            open
          </span>
        </div>


        <div className="admin-support-list">

          {sessionChangeRequests.map(
            (request) => {

              const details =
                parseSessionChangeRequest(
                  request.message
                );

              const sessionRecord =
                details.sessionId
                  ? sessionById.get(
                      details.sessionId
                    )
                  : undefined;

              const engagement =
                request.engagement_id
                  ? engagementById.get(
                      request.engagement_id
                    )
                  : undefined;

              const studentName =
                sessionRecord
                  ?.tutoring_engagements
                  ?.students?.name ||
                engagement
                  ?.students?.name ||
                "Student";

              const subject =
                sessionRecord
                  ?.tutoring_engagements
                  ?.subject ||
                engagement?.subject ||
                "Tutoring";

              const currentScheduled =
                sessionRecord
                  ?.scheduled_for ||
                details.currentScheduledUtc;

              const requestedWhen = [
                details.requestedDate,
                details.requestedTime,
              ]
                .filter(Boolean)
                .join(" · ");

              const ukEquivalent =
                details.requestedUtc
                  ? formatDateTimeInZone(
                      details.requestedUtc,
                      "Europe/London"
                    )
                  : null;

              const defaultUkDateTime =
                details.requestedUtc
                  ? toDateTimeLocalInZone(
                      details.requestedUtc,
                      "Europe/London"
                    )
                  : "";

              const canApply =
                Boolean(
                  details.sessionId
                ) &&
                Boolean(
                  details.changeType
                );

              return (
                <article
                  key={request.id}
                >
                  <div className="admin-support-copy">

                    <div>
                      <span>
                        {requestStatusLabel(
                          request.status
                        )}
                      </span>

                      <strong>
                        {studentName}
                      </strong>

                      <small>
                        <ViewerLocalDateTime value={
                          request.created_at
                        } />
                      </small>
                    </div>


                    <p>
                      <strong>
                        {subject}
                      </strong>
                    </p>


                    <dl className="admin-details-list">

                      <div>
                        <dt>
                          Change
                        </dt>

                        <dd>
                          {details.changeType ||
                            "Unknown"}
                        </dd>
                      </div>


                      <div>
                        <dt>
                          Current booking
                        </dt>

                        <dd>
                          {currentScheduled
                            ? formatDateTimeInZone(
                                currentScheduled,
                                "Europe/London"
                              )
                            : "Not available"}
                        </dd>
                      </div>


                      {details.changeType ===
                        "Reschedule" && (
                        <>
                          <div>
                            <dt>
                              Student preference
                            </dt>

                            <dd>
                              {requestedWhen ||
                                "Not specified"}
                            </dd>
                          </div>


                          <div>
                            <dt>
                              Student timezone
                            </dt>

                            <dd>
                              {details.timezone ||
                                "Not provided"}
                            </dd>
                          </div>


                          <div>
                            <dt>
                              UK equivalent
                            </dt>

                            <dd>
                              {ukEquivalent ||
                                "Not available"}
                            </dd>
                          </div>
                        </>
                      )}

                    </dl>


                    <p
                      style={{
                        whiteSpace:
                          "pre-line",
                      }}
                    >
                      <strong>
                        Session
                      </strong>
                      <br />
                      {sessionRecord?.topic ||
                        details.sessionTopic ||
                        "Tutoring session"}
                    </p>


                    <p
                      style={{
                        whiteSpace:
                          "pre-line",
                      }}
                    >
                      <strong>
                        Reason
                      </strong>
                      <br />
                      {details.reason ||
                        "No reason provided."}
                    </p>


                    <Link
                      href={`/admin/students/${request.student_id}`}
                    >
                      Open student record →
                    </Link>

                  </div>


                  <div className="admin-support-action">

                    {!canApply && (
                      <div className="admin-empty compact">
                        This request is
                        missing the session
                        details required to
                        apply it.
                      </div>
                    )}


                    {canApply &&
                      details.changeType ===
                        "Reschedule" && (
                        <form
                          action={
                            acceptSessionRescheduleRequest
                          }
                          className="admin-compact-form"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={
                              request.id
                            }
                          />

                          <input
                            type="hidden"
                            name="sessionId"
                            value={
                              details.sessionId ||
                              ""
                            }
                          />


                          <label>
                            <span>
                              Confirmed new
                              date & time (UK)
                            </span>

                            <input
                              name="scheduledFor"
                              type="datetime-local"
                              required
                              defaultValue={
                                defaultUkDateTime
                              }
                            />
                          </label>


                          <label className="admin-email-toggle admin-email-toggle-block">
                            <input
                              name="notifyStudent"
                              type="checkbox"
                              defaultChecked
                            />

                            Email the student
                            when the new time
                            is confirmed
                          </label>


                          <button
                            className="admin-primary-button"
                            type="submit"
                          >
                            Accept new time
                          </button>
                        </form>
                      )}


                    {canApply &&
                      details.changeType ===
                        "Cancellation" && (
                        <form
                          action={
                            acceptSessionCancellationRequest
                          }
                          className="admin-compact-form"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={
                              request.id
                            }
                          />

                          <input
                            type="hidden"
                            name="sessionId"
                            value={
                              details.sessionId ||
                              ""
                            }
                          />


                          <label className="admin-email-toggle admin-email-toggle-block">
                            <input
                              name="notifyStudent"
                              type="checkbox"
                              defaultChecked
                            />

                            Email the student
                            when cancellation
                            is confirmed
                          </label>


                          <button
                            className="admin-danger-button"
                            type="submit"
                          >
                            Cancel session
                          </button>
                        </form>
                      )}


                    {request.status !==
                      "in_progress" && (
                      <form
                        action={
                          updateSupportRequest
                        }
                      >
                        <input
                          type="hidden"
                          name="requestId"
                          value={
                            request.id
                          }
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="in_progress"
                        />

                        <input
                          type="hidden"
                          name="adminNote"
                          value={
                            request.admin_note ||
                            ""
                          }
                        />

                        <button
                          type="submit"
                        >
                          Mark in progress
                        </button>
                      </form>
                    )}


                    <form
                      action={
                        updateSupportRequest
                      }
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={
                          request.id
                        }
                      />

                      <input
                        type="hidden"
                        name="status"
                        value="resolved"
                      />

                      <input
                        type="hidden"
                        name="adminNote"
                        value={
                          request.admin_note ||
                          ""
                        }
                      />

                      <button
                        type="submit"
                      >
                        Resolve without
                        applying change
                      </button>
                    </form>

                  </div>
                </article>
              );
            }
          )}


          {!sessionChangeRequests.length && (
            <div className="admin-empty compact">
              No open session change
              requests.
            </div>
          )}

        </div>
      </section>


      {/* ================================================================
          STUDENT SESSION REQUEST QUEUE
         ================================================================ */}

      <section
        className="admin-panel admin-detail-card"
        id="session-requests"
      >
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Student portal
            </span>

            <h2>
              Session requests
            </h2>
          </div>

          <span>
            {
              sessionRequests.length
            }{" "}
            open
          </span>
        </div>


        <div className="admin-support-list">

          {sessionRequests.map(
            (request) => {

              const engagement =
                request.engagement_id
                  ? engagementById.get(
                      request.engagement_id
                    )
                  : undefined;

              const details =
                parseSessionRequest(
                  request.message
                );

              const studentName =
                engagement
                  ?.students
                  ?.name ||
                "Student";

              const subject =
                engagement
                  ?.subject ||
                "Tutoring";

              const requestedWhen = [
                details.preferredDate,
                details.preferredTime,
              ]
                .filter(Boolean)
                .join(" · ");

              const ukEquivalent =
                details.preferredUtc
                  ? formatDateTimeInZone(
                      details.preferredUtc,
                      "Europe/London"
                    )
                  : null;

              const defaultUkDateTime =
                details.preferredUtc
                  ? toDateTimeLocalInZone(
                      details.preferredUtc,
                      "Europe/London"
                    )
                  : "";

              const lessonNotes = [
                details.preferredDate ||
                details.preferredTime
                  ? `Student requested: ${
                      requestedWhen ||
                      "Not specified"
                    }`
                  : null,

                details.timezone
                  ? `Student timezone: ${details.timezone}`
                  : null,

                details.urgency
                  ? `Urgency: ${details.urgency}`
                  : null,

                details.notes &&
                details.notes !==
                  "None"
                  ? `Student note: ${details.notes}`
                  : null,
              ]
                .filter(Boolean)
                .join("\n");

              return (
                <article
                  key={request.id}
                >
                  <div className="admin-support-copy">

                    <div>
                      <span>
                        {requestStatusLabel(
                          request.status
                        )}
                      </span>

                      <strong>
                        {studentName}
                      </strong>

                      <small>
                        <ViewerLocalDateTime value={
                          request.created_at
                        } />
                      </small>
                    </div>


                    <p>
                      <strong>
                        {subject}
                      </strong>
                    </p>


                    <dl className="admin-details-list">

                      <div>
                        <dt>
                          Preferred
                        </dt>

                        <dd>
                          {requestedWhen ||
                            "Not specified"}
                        </dd>
                      </div>


                      <div>
                        <dt>
                          Timezone
                        </dt>

                        <dd>
                          {details.timezone ||
                            "Not provided"}
                        </dd>
                      </div>


                      <div>
                        <dt>
                          UK equivalent
                        </dt>

                        <dd>
                          {ukEquivalent ||
                            "Not available"}
                        </dd>
                      </div>


                      <div>
                        <dt>
                          Duration
                        </dt>

                        <dd>
                          {details.durationMinutes
                            ? `${details.durationMinutes} minutes`
                            : `${engagement?.session_duration_minutes || 60} minutes`}
                        </dd>
                      </div>


                      <div>
                        <dt>
                          Urgency
                        </dt>

                        <dd>
                          {details.urgency ||
                            "Flexible"}
                        </dd>
                      </div>

                    </dl>


                    <p
                      style={{
                        whiteSpace:
                          "pre-line",
                      }}
                    >
                      <strong>
                        Topic / goal
                      </strong>
                      <br />
                      {details.topic ||
                        "Student did not provide a topic."}
                    </p>


                    {details.notes &&
                      details.notes !==
                        "None" && (
                        <p
                          style={{
                            whiteSpace:
                              "pre-line",
                          }}
                        >
                          <strong>
                            Additional
                            notes
                          </strong>
                          <br />
                          {
                            details.notes
                          }
                        </p>
                      )}


                    <Link
                      href={`/admin/students/${request.student_id}`}
                    >
                      Open student record →
                    </Link>

                  </div>


                  <div className="admin-support-action">

                    {engagement ? (

                      <form
                        action={
                          createTutoringSessionFromAdmin
                        }
                        className="admin-compact-form"
                      >
                        <input
                          type="hidden"
                          name="supportRequestId"
                          value={
                            request.id
                          }
                        />

                        <input
                          type="hidden"
                          name="engagementId"
                          value={
                            engagement.id
                          }
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="planned"
                        />


                        <label>
                          <span>
                            Confirmed date &
                            time (UK)
                          </span>

                          <input
                            name="scheduledFor"
                            type="datetime-local"
                            required
                            defaultValue={
                              defaultUkDateTime
                            }
                          />
                        </label>


                        <label>
                          <span>
                            Duration
                          </span>

                          <input
                            name="durationMinutes"
                            type="number"
                            min="15"
                            max="480"
                            defaultValue={
                              details.durationMinutes ||
                              engagement.session_duration_minutes ||
                              60
                            }
                          />
                        </label>


                        <label>
                          <span>
                            Topic / lesson
                            title
                          </span>

                          <input
                            name="topic"
                            required
                            defaultValue={
                              details.topic ||
                              subject
                            }
                          />
                        </label>


                        <label>
                          <span>
                            Tutor override
                          </span>

                          <select
                            name="tutorId"
                            defaultValue=""
                          >
                            <option value="">
                              Use engagement
                              tutor
                            </option>

                            {tutors.map(
                              (tutor) => (
                                <option
                                  key={
                                    tutor.id
                                  }
                                  value={
                                    tutor.id
                                  }
                                >
                                  {
                                    tutor.name
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </label>



                        <label className="admin-email-toggle admin-email-toggle-block">
                          <input
                            name="createZoomMeeting"
                            type="checkbox"
                            defaultChecked={
                              zoomReady
                            }
                            disabled={
                              !zoomReady
                            }
                          />

                          {zoomReady
                            ? "Create Zoom meeting automatically using the shared MAT Pro account"
                            : "Zoom automation is not configured yet"}
                        </label>


                        <label>
                          <span>
                            Meeting link
                          </span>

                          <input
                            name="meetingUrl"
                            type="url"
                            placeholder="Manual fallback link if Zoom automation is off"
                          />
                        </label>


                        <label>
                          <span>
                            Preparation /
                            internal note
                          </span>

                          <textarea
                            name="lessonNotes"
                            defaultValue={
                              lessonNotes
                            }
                          />
                        </label>


                        <label className="admin-email-toggle admin-email-toggle-block">
                          <input
                            name="notifyStudent"
                            type="checkbox"
                            defaultChecked
                          />

                          Email the student
                          when this session is
                          scheduled
                        </label>


                        <button
                          className="admin-primary-button"
                          type="submit"
                        >
                          Schedule session
                        </button>

                      </form>

                    ) : (

                      <div className="admin-empty compact">
                        This request is not
                        linked to an active
                        engagement. Open the
                        student record before
                        scheduling.
                      </div>

                    )}


                    {request.status !==
                      "in_progress" && (
                      <form
                        action={
                          updateSupportRequest
                        }
                      >
                        <input
                          type="hidden"
                          name="requestId"
                          value={
                            request.id
                          }
                        />

                        <input
                          type="hidden"
                          name="status"
                          value="in_progress"
                        />

                        <input
                          type="hidden"
                          name="adminNote"
                          value={
                            request.admin_note ||
                            ""
                          }
                        />

                        <button
                          type="submit"
                        >
                          Mark in progress
                        </button>
                      </form>
                    )}


                    <form
                      action={
                        updateSupportRequest
                      }
                    >
                      <input
                        type="hidden"
                        name="requestId"
                        value={
                          request.id
                        }
                      />

                      <input
                        type="hidden"
                        name="status"
                        value="resolved"
                      />

                      <input
                        type="hidden"
                        name="adminNote"
                        value={
                          request.admin_note ||
                          ""
                        }
                      />

                      <button
                        type="submit"
                      >
                        Resolve without
                        scheduling
                      </button>
                    </form>

                  </div>
                </article>
              );
            }
          )}


          {!sessionRequests.length && (
            <div className="admin-empty compact">
              No open student session
              requests.
            </div>
          )}

        </div>
      </section>


      {/* ================================================================
          MANUAL SESSION SCHEDULER
         ================================================================ */}

      <section className="admin-panel admin-detail-card admin-session-create-panel">

        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              New lesson
            </span>

            <h2>
              Schedule a session
            </h2>
          </div>

          <span>
            {engagements.length} active
            engagements
          </span>
        </div>


        <form
          action={
            createTutoringSessionFromAdmin
          }
          className="admin-compact-form admin-session-scheduler"
        >
          <label>
            <span>
              Student / engagement
            </span>

            <select
              name="engagementId"
              required
              defaultValue=""
            >
              <option
                value=""
                disabled
              >
                Select an active
                student
              </option>

              {engagements.map(
                (item) => (
                  <option
                    key={
                      item.id
                    }
                    value={
                      item.id
                    }
                  >
                    {item.students
                      ?.name ||
                      "Student"}{" "}
                    —{" "}
                    {
                      item.subject
                    }
                    {item.tutors
                      ?.name
                      ? ` — ${item.tutors.name}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>


          <div className="admin-form-grid-3">

            <label>
              <span>
                Date & time (UK)
              </span>

              <input
                name="scheduledFor"
                type="datetime-local"
                required
              />
            </label>


            <label>
              <span>
                Status
              </span>

              <select
                name="status"
                defaultValue="planned"
              >
                {sessionStatuses.map(
                  (status) => (
                    <option
                      key={
                        status
                      }
                      value={
                        status
                      }
                    >
                      {
                        sessionStatusLabels[
                          status
                        ]
                      }
                    </option>
                  )
                )}
              </select>
            </label>


            <label>
              <span>
                Duration
              </span>

              <input
                name="durationMinutes"
                type="number"
                min="15"
                max="480"
                defaultValue="60"
              />
            </label>

          </div>


          <label>
            <span>
              Topic / lesson title
            </span>

            <input
              name="topic"
              required
              placeholder="Regression inference and confidence intervals"
            />
          </label>


          <label>
            <span>
              Tutor override
              (optional)
            </span>

            <select
              name="tutorId"
              defaultValue=""
            >
              <option value="">
                Use engagement tutor
              </option>

              {tutors.map(
                (tutor) => (
                  <option
                    key={
                      tutor.id
                    }
                    value={
                      tutor.id
                    }
                  >
                    {
                      tutor.name
                    }
                  </option>
                )
              )}
            </select>
          </label>



          <label className="admin-email-toggle admin-email-toggle-block">
            <input
              name="createZoomMeeting"
              type="checkbox"
              defaultChecked={
                zoomReady
              }
              disabled={
                !zoomReady
              }
            />

            {zoomReady
              ? "Create Zoom meeting automatically using the shared MAT Pro account"
              : "Zoom automation is not configured yet"}
          </label>


          <label>
            <span>
              Meeting link
              (optional)
            </span>

            <input
              name="meetingUrl"
              type="url"
              placeholder="Manual fallback link if Zoom automation is off"
            />
          </label>


          <label>
            <span>
              Preparation / internal
              note
            </span>

            <textarea
              name="lessonNotes"
              placeholder="What should the tutor prepare or cover?"
            />
          </label>


          <label className="admin-email-toggle admin-email-toggle-block">
            <input
              name="notifyStudent"
              type="checkbox"
              defaultChecked
            />

            Email the student when
            this session is scheduled
          </label>


          <button
            className="admin-primary-button"
            type="submit"
          >
            Schedule session
          </button>

        </form>
      </section>


      <div className="admin-session-dashboard-grid">

        <section className="admin-panel admin-detail-card">

          <div className="admin-card-head">
            <h2>
              Today&apos;s sessions
            </h2>

            <span>
              {today.length}
            </span>
          </div>


          <div className="admin-session-queue">

            {today.map(
              (item) => (
                <Link
                  key={
                    item.id
                  }
                  href={`/admin/sessions/${item.id}`}
                >
                  <div>
                    <strong>
                      <ViewerLocalDateTime value={
                        item.scheduled_for
                      } />
                    </strong>

                    <span>
                      {item
                        .tutoring_engagements
                        ?.students?.name ||
                        "Student"}{" "}
                      ·{" "}
                      {item
                        .tutoring_engagements
                        ?.subject ||
                        "Tutoring"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {
                        item.topic
                      }
                    </strong>

                    <span>
                      {item.session_tutor
                        ?.name ||
                        item
                          .tutoring_engagements
                          ?.tutors?.name ||
                        "Tutor not assigned"}{" "}
                      ·{" "}
                      {
                        item.duration_minutes
                      }{" "}
                      min
                    </span>
                  </div>

                  <b>
                    Open →
                  </b>
                </Link>
              )
            )}


            {!today.length && (
              <div className="admin-empty compact">
                No planned sessions
                today.
              </div>
            )}

          </div>
        </section>


        <section className="admin-panel admin-detail-card">

          <div className="admin-card-head">
            <h2>
              Next sessions
            </h2>

            <span>
              {
                upcoming.length
              }
            </span>
          </div>


          <div className="admin-session-queue">

            {upcoming
              .slice(
                0,
                8
              )
              .map(
                (item) => (
                  <Link
                    key={
                      item.id
                    }
                    href={`/admin/sessions/${item.id}`}
                  >
                    <div>
                      <strong>
                        <ViewerLocalDateTime value={
                          item.scheduled_for
                        } />
                      </strong>

                      <span>
                        {item
                          .tutoring_engagements
                          ?.students
                          ?.name ||
                          "Student"}
                      </span>
                    </div>

                    <div>
                      <strong>
                        {
                          item.topic
                        }
                      </strong>

                      <span>
                        {item.session_tutor
                          ?.name ||
                          item
                            .tutoring_engagements
                            ?.tutors
                            ?.name ||
                          "Tutor not assigned"}
                      </span>
                    </div>

                    <b>
                      Open →
                    </b>
                  </Link>
                )
              )}


            {!upcoming.length && (
              <div className="admin-empty compact">
                No upcoming sessions
                scheduled.
              </div>
            )}

          </div>
        </section>

      </div>


      <div className="admin-session-dashboard-grid">

        <section className="admin-panel admin-detail-card">

          <div className="admin-card-head">
            <h2>
              Tutor hours
            </h2>

            <span>
              Completed sessions
            </span>
          </div>


          <div className="admin-hours-list">

            {topTutors.map(
              ([
                name,
                minutes,
              ]) => (
                <div
                  key={name}
                >
                  <span>
                    {name}
                  </span>

                  <strong>
                    {hours(
                      minutes
                    )}{" "}
                    h
                  </strong>
                </div>
              )
            )}


            {!topTutors.length && (
              <div className="admin-empty compact">
                No completed teaching
                hours yet.
              </div>
            )}

          </div>
        </section>


        <section className="admin-panel admin-detail-card">

          <div className="admin-card-head">
            <h2>
              Student hours
            </h2>

            <span>
              Completed sessions
            </span>
          </div>


          <div className="admin-hours-list">

            {topStudents.map(
              ([
                name,
                minutes,
              ]) => (
                <div
                  key={name}
                >
                  <span>
                    {name}
                  </span>

                  <strong>
                    {hours(
                      minutes
                    )}{" "}
                    h
                  </strong>
                </div>
              )
            )}


            {!topStudents.length && (
              <div className="admin-empty compact">
                No completed student
                hours yet.
              </div>
            )}

          </div>
        </section>

      </div>


      <section className="admin-panel">

        <div className="admin-card-head admin-session-table-head">

          <div>
            <h2>
              Recent session record
            </h2>

            <span>
              {sessions.length} sessions
              loaded
            </span>
          </div>

        </div>


        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>
                  Student
                </th>

                <th>
                  Session
                </th>

                <th>
                  When
                </th>

                <th>
                  Tutor
                </th>

                <th>
                  Status
                </th>

                <th />
              </tr>
            </thead>


            <tbody>

              {sessions.map(
                (item) => (

                  <tr
                    key={
                      item.id
                    }
                  >

                    <td>
                      <strong>
                        {item
                          .tutoring_engagements
                          ?.students
                          ?.name ||
                          "Student"}
                      </strong>

                      <span>
                        {item
                          .tutoring_engagements
                          ?.subject ||
                          ""}
                      </span>
                    </td>


                    <td>
                      <strong>
                        {
                          item.topic
                        }
                      </strong>

                      <span>
                        {
                          item.duration_minutes
                        }{" "}
                        minutes
                      </span>

                      {item.understanding_rating && (
                        <small>
                          Understanding{" "}
                          {
                            item.understanding_rating
                          }
                          /5
                        </small>
                      )}
                    </td>


                    <td>
                      <span>
                        <ViewerLocalDateTime value={
                          item.scheduled_for
                        } />
                      </span>
                    </td>


                    <td>
                      <span>
                        {item.session_tutor
                          ?.name ||
                          item
                            .tutoring_engagements
                            ?.tutors
                            ?.name ||
                          "Not assigned"}
                      </span>
                    </td>


                    <td>
                      <span
                        className={`admin-status session-${item.status}`}
                      >
                        {
                          sessionStatusLabels[
                            item
                              .status
                          ]
                        }
                      </span>
                    </td>


                    <td>
                      <Link
                        className="admin-row-link"
                        href={`/admin/sessions/${item.id}`}
                      >
                        Manage →
                      </Link>
                    </td>

                  </tr>

                )
              )}


              {!sessions.length && (
                <tr>
                  <td
                    colSpan={
                      6
                    }
                  >
                    <div className="admin-empty">
                      No tutoring
                      sessions recorded
                      yet.
                    </div>
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
