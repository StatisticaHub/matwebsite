import Link from "next/link";
import ViewerLocalDateTime from "@/components/ViewerLocalDateTime";
import { notFound } from "next/navigation";
import PostSessionHomeworkFields from "@/components/PostSessionHomeworkFields";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionStatusLabels, sessionStatuses, type SessionStatus } from "@/lib/delivery-data";
import { attachZoomMeetingToSession, cancelTutoringSession, completeTutoringSession, markTutoringSessionNoShow, sendTutoringSessionReminder, updateTutoringSession } from "@/app/admin/session-management-actions";

import { getAdminTimeZone } from "@/lib/admin-time-zone";
import {
  formatDateTimeInTimeZone,
  formatDateTimeLocalInput,
  friendlyTimeZoneLabel,
} from "@/lib/time-zone";
export const dynamic = "force-dynamic";
type Params = Promise<{ id: string }>;

type SessionDetail = {
  id: string;
  created_at: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  status: SessionStatus;
  topic: string;
  lesson_notes: string | null;
  understanding_rating: number | null;
  next_topic: string | null;
  homework_summary: string | null;
  meeting_url: string | null;
  zoom_meeting_id: string | null;
  zoom_meeting_uuid: string | null;
  zoom_host_user_id: string | null;
  zoom_synced_at: string | null;
  zoom_started_at: string | null;
  zoom_ended_at: string | null;
  zoom_last_event_at: string | null;
  tutor_id: string | null;
  session_tutor: { name: string } | null;
  student_rate: number | null;
  tutor_rate: number | null;
  currency: string;
  engagement_id: string;
  tutoring_engagements: {
    student_id: string;
    subject: string;
    title: string;
    students: { name: string; email: string } | null;
    tutors: { name: string } | null;
  } | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function toDateTimeLocalUk(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

function money(value: number | null, currency: string) {
  return value === null ? "—" : `${currency} ${Number(value).toFixed(2)}`;
}

export default async function SessionDetailPage({ params }: { params: Params }) {
  const adminTimeZone =
    await getAdminTimeZone();

  const formatDateTime = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      adminTimeZone,
    );

  const toDateTimeLocalUk = (
    value: string | null,
  ) =>
    formatDateTimeLocalInput(
      value,
      adminTimeZone,
    );

  const { id } = await params;
  const supabase = createAdminClient();
  const [{ data, error }, { data: tutorData }] = await Promise.all([
    supabase
      .from("tutoring_sessions")
      .select("id,created_at,scheduled_for,completed_at,duration_minutes,status,topic,lesson_notes,understanding_rating,next_topic,homework_summary,meeting_url,zoom_meeting_id,zoom_meeting_uuid,zoom_host_user_id,zoom_synced_at,zoom_started_at,zoom_ended_at,zoom_last_event_at,tutor_id,session_tutor:tutors(name),student_rate,tutor_rate,currency,engagement_id,tutoring_engagements(student_id,subject,title,students(name,email),tutors(name))")
      .eq("id", id)
      .single(),
    supabase.from("tutors").select("id,name,status").order("name"),
  ]);
  if (error || !data) notFound();

  const session = data as unknown as SessionDetail;
  const tutors = (tutorData || []) as Array<{ id: string; name: string; status: string }>;
  const student = session.tutoring_engagements?.students;
  const studentId = session.tutoring_engagements?.student_id;
  const canRemind = session.status === "planned" && Boolean(session.scheduled_for);
  const canCancel = session.status === "planned";
  const canCloseOut = session.status === "planned";
  const canAttachZoom =
    session.status === "planned" &&
    Boolean(session.scheduled_for) &&
    !session.zoom_meeting_id;
  const needsSessionTimeForZoom =
    session.status === "planned" &&
    !session.scheduled_for &&
    !session.zoom_meeting_id;

  return (
    <div className="admin-page">
      <div className="admin-breadcrumb"><Link href="/admin/sessions">← Sessions</Link><span>{session.topic}</span></div>
      <header className="admin-page-head admin-session-detail-head">
        <div><span className="admin-eyebrow">{session.tutoring_engagements?.subject || "Tutoring session"}</span><h1>{session.topic}</h1><p>{student?.name || "Student"} · {formatDateTime(session.scheduled_for)}</p></div>
        <span className={`admin-status session-${session.status}`}>{sessionStatusLabels[session.status]}</span>
      </header>

      <div className="admin-detail-grid">
        <div className="admin-detail-main">
          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><div><span className="admin-eyebrow">Session record</span><h2>Edit session</h2><small className="admin-timezone-note">
              Session timezone: {friendlyTimeZoneLabel(adminTimeZone)}
            </small></div><span>{session.duration_minutes} minutes</span></div>
            <form action={updateTutoringSession} className="admin-compact-form admin-session-edit-form">
              <input type="hidden" name="sessionId" value={session.id} />
              <div className="admin-form-grid-3"><label><span>Date & time</span><input name="scheduledFor" type="datetime-local" defaultValue={toDateTimeLocalUk(session.scheduled_for)} /></label><label><span>Status</span><select name="status" defaultValue={session.status}>{sessionStatuses.map((status) => <option key={status} value={status}>{sessionStatusLabels[status]}</option>)}</select></label><label><span>Duration</span><input name="durationMinutes" type="number" min="15" max="480" defaultValue={session.duration_minutes} /></label></div>
              <label><span>Topic / lesson title</span><input name="topic" required defaultValue={session.topic} /></label>
              <label><span>Tutor</span><select name="tutorId" defaultValue={session.tutor_id || ""}><option value="">Not assigned</option>{tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.name}{tutor.status !== "active" ? ` (${tutor.status})` : ""}</option>)}</select></label>
              <label>
                <span>
                  {session.zoom_meeting_id
                    ? "Zoom join link (managed automatically)"
                    : "Meeting link"}
                </span>

                <input
                  name="meetingUrl"
                  type="url"
                  defaultValue={session.meeting_url || ""}
                  readOnly={Boolean(session.zoom_meeting_id)}
                  placeholder={
                    session.zoom_meeting_id
                      ? "Managed by MAT Zoom integration"
                      : "https://…"
                  }
                />
              </label>
              <label><span>Lesson / preparation notes</span><textarea name="lessonNotes" defaultValue={session.lesson_notes || ""} placeholder="Concepts covered, preparation notes, misconceptions addressed…" /></label>
              <div className="admin-form-grid-2"><label><span>Understanding (1–5)</span><input name="understandingRating" type="number" min="1" max="5" defaultValue={session.understanding_rating ?? ""} /></label><label><span>Next topic</span><input name="nextTopic" defaultValue={session.next_topic || ""} /></label></div>
              <label><span>Homework / practice summary</span><textarea name="homeworkSummary" defaultValue={session.homework_summary || ""} /></label>
              <label className="admin-email-toggle admin-email-toggle-block"><input name="notifyStudent" type="checkbox" /> Email the student this updated session information</label>
              <button className="admin-primary-button" type="submit">Save session</button>
            </form>
          </section>


          {session.zoom_ended_at && session.status === "planned" && (
            <section className="admin-panel admin-action-card">
              <h2>Zoom meeting ended</h2>
              <p className="admin-help">
                Zoom reported this meeting ended at <ViewerLocalDateTime value={session.zoom_ended_at} />.
                Review the lesson outcome below and complete the tutoring record, or mark a no-show if appropriate.
              </p>
            </section>
          )}


          {canCloseOut && (
            <section className="admin-panel admin-detail-card">
              <div className="admin-card-head">
                <div>
                  <span className="admin-eyebrow">
                    After the lesson
                  </span>

                  <h2>
                    Complete session
                  </h2>
                </div>

                <span>
                  Publish the lesson record
                </span>
              </div>


              <p className="admin-help">
                Close out the lesson once teaching has finished.
                The notes, understanding rating, next topic and
                practice summary will feed the student&apos;s
                learning record and progress history.
              </p>


              <form
                action={completeTutoringSession}
                className="admin-compact-form admin-session-edit-form"
              >
                <input
                  type="hidden"
                  name="sessionId"
                  value={session.id}
                />


                <div className="admin-form-grid-2">
                  <label>
                    <span>
                      Actual duration
                    </span>

                    <input
                      name="durationMinutes"
                      type="number"
                      min="15"
                      max="480"
                      defaultValue={session.duration_minutes}
                    />
                  </label>


                  <label>
                    <span>
                      Understanding (1–5)
                    </span>

                    <input
                      name="understandingRating"
                      type="number"
                      min="1"
                      max="5"
                      defaultValue={
                        session.understanding_rating ?? ""
                      }
                      placeholder="4"
                    />
                  </label>
                </div>


                <label>
                  <span>
                    Lesson notes
                  </span>

                  <textarea
                    name="lessonNotes"
                    defaultValue={session.lesson_notes || ""}
                    placeholder="What was covered, what the student understood well, misconceptions addressed, examples used..."
                  />
                </label>


                <label>
                  <span>
                    Next topic / next lesson focus
                  </span>

                  <input
                    name="nextTopic"
                    defaultValue={session.next_topic || ""}
                    placeholder="For example: hypothesis testing for regression coefficients"
                  />
                </label>


                <label>
                  <span>
                    Homework / practice summary
                  </span>

                  <textarea
                    name="homeworkSummary"
                    defaultValue={session.homework_summary || ""}
                    placeholder="Exercises, reading, revision or coding practice to complete before the next lesson."
                  />
                </label>


                <PostSessionHomeworkFields
                  defaultTitle={`${session.topic} — practice`}
                  defaultDescription={session.homework_summary}
                />


                <label className="admin-email-toggle admin-email-toggle-block">
                  <input
                    name="notifyStudent"
                    type="checkbox"
                  />

                  Email the student the completed-session follow-up
                </label>


                <button
                  className="admin-primary-button"
                  type="submit"
                >
                  Complete session & publish follow-up
                </button>
              </form>


              <details className="admin-disclosure">
                <summary>
                  Student did not attend?
                </summary>

                <form
                  action={markTutoringSessionNoShow}
                  className="admin-compact-form"
                >
                  <input
                    type="hidden"
                    name="sessionId"
                    value={session.id}
                  />

                  <label>
                    <span>
                      No-show note
                    </span>

                    <textarea
                      name="noShowNote"
                      placeholder="Optional: how long the tutor waited, whether the student contacted you, or any follow-up needed."
                    />
                  </label>

                  <button
                    className="admin-danger-button"
                    type="submit"
                  >
                    Mark student no-show
                  </button>
                </form>
              </details>
            </section>
          )}


          <section className="admin-panel admin-detail-card">
            <div className="admin-card-head"><h2>Delivery summary</h2><span>{session.status === "completed" ? "Delivered" : "Session record"}</span></div>
            <dl className="admin-details-list">
              <div><dt>Student</dt><dd>{student?.name || "—"}</dd></div>
              <div><dt>Email</dt><dd>{student?.email || "—"}</dd></div>
              <div><dt>Tutor</dt><dd>{session.session_tutor?.name || session.tutoring_engagements?.tutors?.name || "Not assigned"}</dd></div>
              <div><dt>Scheduled</dt><dd>{formatDateTime(session.scheduled_for)}</dd></div>
              <div><dt>Completed</dt><dd>{session.completed_at ? formatDateTime(session.completed_at) : "—"}</dd></div>
              <div><dt>Duration</dt><dd>{session.duration_minutes} minutes</dd></div>
              <div><dt>Meeting link</dt><dd>{session.meeting_url ? <a href={session.meeting_url} target="_blank" rel="noreferrer">Open link ↗</a> : "—"}</dd></div>
              {session.zoom_meeting_id && (
                <>
                  <div>
                    <dt>Video platform</dt>
                    <dd>Zoom · shared MAT Pro host</dd>
                  </div>

                  <div>
                    <dt>Zoom meeting ID</dt>
                    <dd>{session.zoom_meeting_id}</dd>
                  </div>

                  <div>
                    <dt>Zoom last synced</dt>
                    <dd>
                      {session.zoom_synced_at
                        ? formatDateTime(session.zoom_synced_at)
                        : "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>Zoom started</dt>
                    <dd>
                      {session.zoom_started_at
                        ? formatDateTime(session.zoom_started_at)
                        : "—"}
                    </dd>
                  </div>

                  <div>
                    <dt>Zoom ended</dt>
                    <dd>
                      {session.zoom_ended_at
                        ? formatDateTime(session.zoom_ended_at)
                        : "—"}
                    </dd>
                  </div>
                </>
              )}
              <div><dt>Student rate</dt><dd>{money(session.student_rate, session.currency)}</dd></div>
              <div><dt>Tutor rate</dt><dd>{money(session.tutor_rate, session.currency)}</dd></div>
            </dl>
          </section>
        </div>

        <aside className="admin-detail-side">
          <section className="admin-panel admin-action-card">
            <h2>Student record</h2>
            <p className="admin-help">{student?.name || "Student"}<br />{session.tutoring_engagements?.title || "Tutoring engagement"}</p>
            {studentId && <Link className="admin-contact-button" href={`/admin/students/${studentId}`}>Open student →</Link>}
          </section>


          {!session.zoom_meeting_id &&
            session.status === "planned" && (
              <section className="admin-panel admin-action-card">
                <h2>
                  Zoom meeting
                </h2>

                {canAttachZoom ? (
                  <>
                    <p className="admin-help">
                      Create a managed Zoom meeting for this
                      existing session using the shared MAT Pro
                      account. MAT will run the same overlap check
                      used by the scheduler and save the participant
                      join link to the student portal.
                    </p>

                    {session.meeting_url && (
                      <p className="admin-muted">
                        This session currently has a manual meeting
                        link. Creating Zoom will replace that link.
                      </p>
                    )}

                    <form
                      action={attachZoomMeetingToSession}
                      className="admin-compact-form"
                    >
                      <input
                        type="hidden"
                        name="sessionId"
                        value={session.id}
                      />

                      <label className="admin-email-toggle admin-email-toggle-block">
                        <input
                          name="notifyStudent"
                          type="checkbox"
                          defaultChecked
                        />

                        Email the student with the Zoom join link
                      </label>

                      <button
                        className="admin-primary-button"
                        type="submit"
                      >
                        Create Zoom meeting
                      </button>
                    </form>
                  </>
                ) : needsSessionTimeForZoom ? (
                  <p className="admin-help">
                    Set a session date and time first, save the
                    session, then return here to create its Zoom
                    meeting.
                  </p>
                ) : null}
              </section>
            )}


          <section className="admin-panel admin-action-card">
            <h2>Session reminder</h2>
            <p className="admin-help">Send a reminder email using the current session date, time, duration and tutor.</p>
            {canRemind ? <form action={sendTutoringSessionReminder}><input type="hidden" name="sessionId" value={session.id} /><button className="admin-primary-button" type="submit">Send reminder email</button></form> : <p className="admin-muted">Available for planned sessions with a scheduled date.</p>}
          </section>

          <section className="admin-panel admin-action-card admin-danger-card">
            <h2>Cancel session</h2>
            {canCancel ? <form action={cancelTutoringSession} className="admin-compact-form"><input type="hidden" name="sessionId" value={session.id} /><label className="admin-email-toggle admin-email-toggle-block"><input name="notifyStudent" type="checkbox" defaultChecked /> Email the student about the cancellation</label><button className="admin-danger-button" type="submit">Cancel session</button></form> : <p className="admin-help">This session is already {sessionStatusLabels[session.status].toLowerCase()}.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
