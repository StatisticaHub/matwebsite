import Link from "next/link";

import {
  scheduleTutorSessionFromPortal,
} from "@/app/tutor/actions";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_TIME_ZONE,
  dateKeyInTimeZone,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";

export const metadata = {
  title: "Teaching calendar",
};

export const dynamic = "force-dynamic";

function fmt(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function timeOnly(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function londonDateKey(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${map.year}-${map.month}-${map.day}`;
}


function requestLine(
  message: string,
  label: string,
) {
  const prefix = `${label}:`;

  const line = message
    .split(/\r?\n/)
    .find((item) =>
      item.trim().startsWith(prefix),
    );

  if (!line) return null;

  return (
    line
      .trim()
      .slice(prefix.length)
      .trim() || null
  );
}


function requestSection(
  message: string,
  startLabel: string,
  endLabel?: string,
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
    const found =
      message.indexOf(
        endToken,
        contentStart,
      );

    if (found >= 0) {
      contentEnd = found;
    }
  }

  return (
    message
      .slice(
        contentStart,
        contentEnd,
      )
      .trim() || null
  );
}


function parseStudentSessionRequest(
  message: string,
) {
  const durationText =
    requestLine(
      message,
      "Session length",
    );

  const durationMatch =
    durationText?.match(
      /(\d{1,3})/,
    );

  const durationMinutes =
    durationMatch
      ? Number(durationMatch[1])
      : null;

  return {
    preferredDate:
      requestLine(
        message,
        "Preferred local date",
      ) ||
      requestLine(
        message,
        "Preferred date",
      ),

    preferredTime:
      requestLine(
        message,
        "Preferred local time",
      ) ||
      requestLine(
        message,
        "Preferred time",
      ),

    studentTimeZone:
      requestLine(
        message,
        "Student timezone",
      ) ||
      requestLine(
        message,
        "Timezone",
      ),

    preferredUtc:
      requestLine(
        message,
        "Preferred UTC",
      ),

    durationMinutes:
      durationMinutes &&
      durationMinutes >= 15 &&
      durationMinutes <= 480
        ? durationMinutes
        : null,

    urgency:
      requestLine(
        message,
        "Urgency",
      ),

    topic:
      requestSection(
        message,
        "Topic / goal",
        "Additional notes",
      ),

    notes:
      requestSection(
        message,
        "Additional notes",
      ),
  };
}


export default async function TutorSessionsPage() {
  const auth = await getTutorSession();

  if (!auth) return null;

  const tutorTimeZone =
    normalizeTimeZone(
      auth.tutor.timezone,
      DEFAULT_TIME_ZONE,
    );

  const fmt = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      tutorTimeZone,
    );

  const timeOnly = (
    value: string | null,
  ) => {
    if (!value) return "—";

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeStyle: "short",
        timeZone: tutorTimeZone,
      },
    ).format(
      new Date(value),
    );
  };

  const dayKey = (
    value: string | Date,
  ) =>
    dateKeyInTimeZone(
      value instanceof Date
        ? value
        : new Date(value),
      tutorTimeZone,
    );


  const supabase =
    createAdminClient();

  const [
    sessionResult,
    engagementResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "tutoring_sessions",
        )
        .select(
          "id,scheduled_for,completed_at,duration_minutes,status,topic,meeting_url,zoom_ended_at,lesson_notes,understanding_rating,next_topic,tutoring_engagements(subject,students(name))",
        )
        .eq(
          "tutor_id",
          auth.tutor.id,
        )
        .order(
          "scheduled_for",
          {
            ascending: false,
            nullsFirst: false,
          },
        )
        .limit(500),

      supabase
        .from(
          "tutoring_engagements",
        )
        .select(
          "id,student_id,subject,title,session_duration_minutes,students(name,academic_level)",
        )
        .eq(
          "tutor_id",
          auth.tutor.id,
        )
        .eq(
          "status",
          "active",
        )
        .order(
          "created_at",
          {
            ascending: false,
          },
        ),
    ]);

  if (sessionResult.error) {
    throw new Error(
      sessionResult.error.message,
    );
  }

  if (engagementResult.error) {
    throw new Error(
      engagementResult.error.message,
    );
  }

  const rows =
    (sessionResult.data || []) as any[];

  const engagements =
    (engagementResult.data || []) as any[];

  const engagementIds =
    engagements.map(
      (engagement) =>
        engagement.id,
    );

  let requests: any[] = [];

  if (engagementIds.length) {
    const {
      data: requestData,
      error: requestError,
    } =
      await supabase
        .from(
          "student_support_requests",
        )
        .select(
          "id,created_at,student_id,engagement_id,message,status",
        )
        .eq(
          "category",
          "session_request",
        )
        .in(
          "status",
          [
            "new",
            "in_progress",
          ],
        )
        .in(
          "engagement_id",
          engagementIds,
        )
        .like(
          "message",
          "SESSION REQUEST%",
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        );

    if (requestError) {
      throw new Error(
        requestError.message,
      );
    }

    requests =
      (requestData || []) as any[];
  }

  const engagementById =
    Object.fromEntries(
      engagements.map(
        (engagement) => [
          engagement.id,
          engagement,
        ],
      ),
    );

  const now = new Date();
  const nowMs = now.getTime();
  const todayKey = dayKey(now);

  const today = rows
    .filter(
      (row) =>
        row.status === "planned" &&
        row.scheduled_for &&
        dayKey(row.scheduled_for) === todayKey
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    );

  const needsCloseout = rows
    .filter(
      (row) =>
        row.status === "planned" &&
        row.scheduled_for &&
        (
          row.zoom_ended_at ||
          new Date(row.scheduled_for).getTime() < nowMs
        )
    )
    .sort(
      (a, b) =>
        new Date(b.scheduled_for).getTime() -
        new Date(a.scheduled_for).getTime()
    );

  const upcoming = rows
    .filter(
      (row) =>
        row.status === "planned" &&
        row.scheduled_for &&
        new Date(row.scheduled_for).getTime() >= nowMs &&
        dayKey(row.scheduled_for) !== todayKey
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_for).getTime() -
        new Date(b.scheduled_for).getTime()
    );

  const completed = rows
    .filter(
      (row) =>
        row.status === "completed"
    )
    .sort(
      (a, b) =>
        new Date(
          b.completed_at ||
            b.scheduled_for ||
            0
        ).getTime() -
        new Date(
          a.completed_at ||
            a.scheduled_for ||
            0
        ).getTime()
    );

  return (
    <div className="tutor-page tutor-sessions-workspace">
      <header className="tutor-page-head tutor-page-head-actions">
        <div>
          <span className="tutor-eyebrow">
            Teaching
          </span>
          <h1>Teaching calendar</h1>
          <p>
            Prepare upcoming lessons, join live sessions and close out completed teaching from one calendar.
          </p>
        </div>

        <Link
          className="tutor-secondary-button"
          href="/tutor/availability"
        >
          Update availability
        </Link>
      </header>


      {/* =====================================================
          STUDENT SESSION REQUESTS
          ===================================================== */}

      {requests.length > 0 && (
        <section className="tutor-panel tutor-session-section">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-eyebrow">
                Student requests
              </span>

              <h2>
                Sessions waiting for your response
              </h2>

              <p className="tutor-help">
                Approve the student's preferred time or choose another suitable time.
              </p>
            </div>

            <span>
              {requests.length} waiting
            </span>
          </div>


          <div className="tutor-session-cards">
            {requests.map(
              (request) => {
                const engagement =
                  request.engagement_id
                    ? engagementById[
                        request.engagement_id
                      ]
                    : null;

                const details =
                  parseStudentSessionRequest(
                    request.message,
                  );

                const requestedTutorTime =
                  details.preferredUtc
                    ? fmt(
                        details.preferredUtc,
                      )
                    : null;

                return (
                  <article
                    className="tutor-session-card"
                    key={request.id}
                  >
                    <div className="tutor-session-card-copy">
                      <span className="tutor-eyebrow">
                        {details.urgency ||
                          "Session request"}
                      </span>

                      <h3>
                        {details.topic ||
                          engagement?.subject ||
                          "Tutoring session"}
                      </h3>

                      <p>
                        <strong>
                          {engagement?.students?.name ||
                            "Student"}
                        </strong>
                        {engagement?.subject
                          ? ` · ${engagement.subject}`
                          : ""}
                      </p>

                      <dl className="tutor-details">
                        <div>
                          <dt>
                            Student requested
                          </dt>

                          <dd>
                            {details.preferredDate &&
                            details.preferredTime
                              ? `${details.preferredDate} at ${details.preferredTime}`
                              : "Time not available"}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Student timezone
                          </dt>

                          <dd>
                            {details.studentTimeZone ||
                              "Not provided"}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Your local time
                          </dt>

                          <dd>
                            {requestedTutorTime ||
                              "Not available"}
                          </dd>
                        </div>

                        <div>
                          <dt>
                            Duration
                          </dt>

                          <dd>
                            {details.durationMinutes ||
                              engagement?.session_duration_minutes ||
                              60}{" "}
                            minutes
                          </dd>
                        </div>
                      </dl>

                      {details.notes &&
                        details.notes !==
                          "None" && (
                          <div className="tutor-requirement">
                            <strong>
                              Student note
                            </strong>

                            <p>
                              {details.notes}
                            </p>
                          </div>
                        )}
                    </div>


                    <div className="tutor-session-request-actions">

                      {details.preferredUtc && (
                        <form
                          action={
                            scheduleTutorSessionFromPortal
                          }
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />

                          <input
                            type="hidden"
                            name="engagementId"
                            value={
                              request.engagement_id ||
                              ""
                            }
                          />

                          <input
                            type="hidden"
                            name="useRequestedTime"
                            value="yes"
                          />

                          <input
                            type="hidden"
                            name="topic"
                            value={
                              details.topic ||
                              engagement?.subject ||
                              "Tutoring session"
                            }
                          />

                          <input
                            type="hidden"
                            name="durationMinutes"
                            value={
                              details.durationMinutes ||
                              engagement?.session_duration_minutes ||
                              60
                            }
                          />

                          <button
                            className="tutor-primary-button"
                            type="submit"
                          >
                            Approve requested time
                          </button>
                        </form>
                      )}


                      <details className="tutor-scheduling-details">
                        <summary className="tutor-secondary-button">
                          Choose another time
                        </summary>

                        <form
                          action={
                            scheduleTutorSessionFromPortal
                          }
                          className="tutor-form compact"
                        >
                          <input
                            type="hidden"
                            name="requestId"
                            value={request.id}
                          />

                          <input
                            type="hidden"
                            name="engagementId"
                            value={
                              request.engagement_id ||
                              ""
                            }
                          />

                          <input
                            type="hidden"
                            name="timeZone"
                            value={tutorTimeZone}
                          />

                          <label>
                            <span>
                              Date
                            </span>

                            <input
                              type="date"
                              name="scheduledDate"
                              required
                            />
                          </label>

                          <label>
                            <span>
                              Time
                            </span>

                            <input
                              type="time"
                              name="scheduledTime"
                              required
                            />
                          </label>

                          <label>
                            <span>
                              Lesson topic
                            </span>

                            <input
                              type="text"
                              name="topic"
                              defaultValue={
                                details.topic ||
                                engagement?.subject ||
                                ""
                              }
                              maxLength={500}
                              required
                            />
                          </label>

                          <label>
                            <span>
                              Duration
                            </span>

                            <select
                              name="durationMinutes"
                              defaultValue={String(
                                details.durationMinutes ||
                                  engagement?.session_duration_minutes ||
                                  60,
                              )}
                            >
                              <option value="30">
                                30 minutes
                              </option>

                              <option value="45">
                                45 minutes
                              </option>

                              <option value="60">
                                60 minutes
                              </option>

                              <option value="75">
                                75 minutes
                              </option>

                              <option value="90">
                                90 minutes
                              </option>

                              <option value="120">
                                120 minutes
                              </option>
                            </select>
                          </label>

                          <label>
                            <span>
                              Meeting link (optional)
                            </span>

                            <input
                              type="url"
                              name="meetingUrl"
                              placeholder="Leave blank to create MAT Zoom automatically"
                            />
                          </label>

                          <p className="tutor-help">
                            Time shown here uses your tutor timezone:{" "}
                            <strong>
                              {tutorTimeZone}
                            </strong>
                          </p>

                          <button
                            className="tutor-primary-button"
                            type="submit"
                          >
                            Schedule new time & notify student
                          </button>
                        </form>
                      </details>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        </section>
      )}


      {/* =====================================================
          TUTOR CREATES NEXT SESSION
          ===================================================== */}

      <section className="tutor-panel tutor-session-section">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              Next lesson
            </span>

            <h2>
              Schedule a session with a student
            </h2>

            <p className="tutor-help">
              Create the next lesson directly. It will appear in the student's portal and the MAT admin calendar.
            </p>
          </div>
        </div>


        {engagements.length ? (
          <details className="tutor-scheduling-details">
            <summary className="tutor-primary-button">
              Schedule next session
            </summary>

            <form
              action={
                scheduleTutorSessionFromPortal
              }
              className="tutor-form"
            >
              <input
                type="hidden"
                name="timeZone"
                value={tutorTimeZone}
              />

              <label>
                <span>
                  Student
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
                    Choose student
                  </option>

                  {engagements.map(
                    (engagement) => (
                      <option
                        value={engagement.id}
                        key={engagement.id}
                      >
                        {engagement.students?.name ||
                          "Student"}
                        {" — "}
                        {engagement.subject ||
                          engagement.title ||
                          "Tutoring"}
                      </option>
                    ),
                  )}
                </select>
              </label>


              <div className="tutor-grid-2">
                <label>
                  <span>
                    Date
                  </span>

                  <input
                    type="date"
                    name="scheduledDate"
                    required
                  />
                </label>

                <label>
                  <span>
                    Time
                  </span>

                  <input
                    type="time"
                    name="scheduledTime"
                    required
                  />
                </label>
              </div>


              <div className="tutor-grid-2">
                <label>
                  <span>
                    Lesson topic
                  </span>

                  <input
                    type="text"
                    name="topic"
                    maxLength={500}
                    placeholder="What will you cover?"
                    required
                  />
                </label>

                <label>
                  <span>
                    Duration
                  </span>

                  <select
                    name="durationMinutes"
                    defaultValue="60"
                  >
                    <option value="30">
                      30 minutes
                    </option>

                    <option value="45">
                      45 minutes
                    </option>

                    <option value="60">
                      60 minutes
                    </option>

                    <option value="75">
                      75 minutes
                    </option>

                    <option value="90">
                      90 minutes
                    </option>

                    <option value="120">
                      120 minutes
                    </option>
                  </select>
                </label>
              </div>


              <label>
                <span>
                  Meeting link (optional)
                </span>

                <input
                  type="url"
                  name="meetingUrl"
                  placeholder="Leave blank to create MAT Zoom automatically"
                />
              </label>


              <p className="tutor-help">
                Scheduling timezone:{" "}
                <strong>
                  {tutorTimeZone}
                </strong>
              </p>


              <button
                className="tutor-primary-button"
                type="submit"
              >
                Schedule session & notify student
              </button>
            </form>
          </details>
        ) : (
          <div className="tutor-empty">
            You do not currently have an active student engagement to schedule.
          </div>
        )}
      </section>


      <section className="tutor-session-metrics">
        <article>
          <span>Today</span>
          <strong>{today.length}</strong>
          <small>Scheduled lessons</small>
        </article>

        <article className={needsCloseout.length ? "attention" : ""}>
          <span>Needs close-out</span>
          <strong>{needsCloseout.length}</strong>
          <small>Lesson records waiting</small>
        </article>

        <article>
          <span>Upcoming</span>
          <strong>{upcoming.length}</strong>
          <small>Future lessons</small>
        </article>

        <article>
          <span>Completed</span>
          <strong>{completed.length}</strong>
          <small>Delivered sessions</small>
        </article>
      </section>

      {today.length > 0 && (
        <section className="tutor-panel tutor-session-section">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-eyebrow">Today</span>
              <h2>Teaching schedule</h2>
            </div>
          </div>

          <div className="tutor-session-cards">
            {today.map((row) => (
              <article
                className="tutor-session-card featured"
                key={row.id}
              >
                <div className="tutor-session-card-time">
                  <strong>{timeOnly(row.scheduled_for)}</strong>
                  <span>{row.duration_minutes} min</span>
                </div>

                <div className="tutor-session-card-copy">
                  <span className="tutor-eyebrow">
                    {row.tutoring_engagements?.subject ||
                      "Tutoring"}
                  </span>

                  <h3>{row.topic}</h3>

                  <p>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}
                  </p>
                </div>

                <div className="tutor-session-card-actions">
                  {row.meeting_url && (
                    <a
                      className="tutor-primary-button"
                      href={row.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join lesson ↗
                    </a>
                  )}

                  <Link
                    className="tutor-secondary-button"
                    href={`/tutor/sessions/${row.id}`}
                  >
                    Open record
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {needsCloseout.length > 0 && (
        <section className="tutor-panel tutor-session-section tutor-closeout-section">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-eyebrow">
                Action required
              </span>

              <h2>Complete lesson records</h2>
            </div>

            <span>
              {needsCloseout.length} waiting
            </span>
          </div>

          <div className="tutor-session-cards">
            {needsCloseout.map((row) => (
              <article
                className="tutor-session-card"
                key={row.id}
              >
                <div className="tutor-session-card-copy">
                  <span className="tutor-eyebrow">
                    {row.tutoring_engagements?.subject ||
                      "Tutoring"}
                  </span>

                  <h3>{row.topic}</h3>

                  <p>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}{" "}
                    · {fmt(row.scheduled_for)}
                  </p>
                </div>

                <Link
                  className="tutor-primary-button"
                  href={`/tutor/sessions/${row.id}`}
                >
                  Complete record
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="tutor-panel tutor-session-section">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              Calendar
            </span>
            <h2>Upcoming lessons</h2>
          </div>

          <span>{upcoming.length} booked</span>
        </div>

        <div className="tutor-table-wrap">
          <table className="tutor-table tutor-session-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Lesson</th>
                <th>Duration</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {upcoming.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{fmt(row.scheduled_for)}</strong>
                  </td>

                  <td>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}
                    <small>
                      {row.tutoring_engagements?.subject || ""}
                    </small>
                  </td>

                  <td>{row.topic}</td>

                  <td>
                    {row.duration_minutes} min
                  </td>

                  <td>
                    <Link
                      href={`/tutor/sessions/${row.id}`}
                    >
                      Prepare →
                    </Link>
                  </td>
                </tr>
              ))}

              {!upcoming.length && (
                <tr>
                  <td colSpan={5}>
                    <div className="tutor-empty">
                      No future lessons are booked.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="tutor-panel tutor-session-section">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              History
            </span>
            <h2>Recent completed lessons</h2>
          </div>

          <span>{completed.length} completed</span>
        </div>

        <div className="tutor-table-wrap">
          <table className="tutor-table tutor-session-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Lesson</th>
                <th>Outcome</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {completed.slice(0, 30).map((row) => (
                <tr key={row.id}>
                  <td>{fmt(row.completed_at || row.scheduled_for)}</td>

                  <td>
                    {row.tutoring_engagements?.students?.name ||
                      "Student"}
                    <small>
                      {row.tutoring_engagements?.subject || ""}
                    </small>
                  </td>

                  <td>{row.topic}</td>

                  <td>
                    {row.understanding_rating
                      ? `Understanding ${row.understanding_rating}/5`
                      : row.next_topic
                        ? `Next: ${row.next_topic}`
                        : "Recorded"}
                  </td>

                  <td>
                    <Link
                      href={`/tutor/sessions/${row.id}`}
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}

              {!completed.length && (
                <tr>
                  <td colSpan={5}>
                    <div className="tutor-empty">
                      Completed lessons will appear here.
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
