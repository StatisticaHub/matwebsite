import Link from "next/link";

import {
  updateTutorSupportRequest,
} from "@/app/tutor/support-actions";

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


export default async function TutorStudentSupportRequests({
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


  const {
    data:
      engagement,
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
    !engagement
  ) {
    return null;
  }


  const {
    data,
    error,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .select(
        "id,created_at,updated_at,category,message,status,admin_note,resolved_at",
      )
      .eq(
        "student_id",
        engagement.student_id,
      )
      .eq(
        "engagement_id",
        engagement.id,
      )
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(
        50,
      );


  if (error) {
    throw new Error(
      error.message,
    );
  }


  const requests =
    (
      data ||
      []
    ) as any[];


  const statusOrder:
    Record<
      string,
      number
    > = {
      new: 0,
      in_progress: 1,
      resolved: 2,
    };


  requests.sort(
    (
      first,
      second,
    ) => {

      const statusDifference =
        (
          statusOrder[
            first.status
          ] ??
          9
        ) -
        (
          statusOrder[
            second.status
          ] ??
          9
        );


      if (
        statusDifference
      ) {
        return statusDifference;
      }


      return (
        new Date(
          second.created_at,
        ).getTime() -
        new Date(
          first.created_at,
        ).getTime()
      );
    },
  );


  const supportRequests =
    requests.filter(
      (item) =>
        item.category !==
        "session_request",
    );


  const newCount =
    supportRequests.filter(
      (item) =>
        item.status ===
        "new",
    ).length;


  const inProgressCount =
    supportRequests.filter(
      (item) =>
        item.status ===
        "in_progress",
    ).length;


  const resolvedCount =
    supportRequests.filter(
      (item) =>
        item.status ===
        "resolved",
    ).length;


  const openCount =
    newCount +
    inProgressCount;


  return (
    <section
      className="tutor-panel tutor-support-workflow"
      aria-label="Student support requests"
    >

      <div className="tutor-panel-head">

        <div>

          <span className="tutor-eyebrow">
            Student support
          </span>

          <h2>
            Course questions & support
          </h2>

          <p>
            Manage lesson, homework, resource, technical and
            general support here. Session requests are handled
            through the Sessions workspace.
          </p>

        </div>


        <span>
          {openCount} open
        </span>

      </div>


      <div className="tutor-support-metrics">

        <div>

          <span>
            New
          </span>

          <strong>
            {newCount}
          </strong>

        </div>


        <div>

          <span>
            In progress
          </span>

          <strong>
            {inProgressCount}
          </strong>

        </div>


        <div>

          <span>
            Resolved
          </span>

          <strong>
            {resolvedCount}
          </strong>

        </div>


        <div>

          <span>
            Support total
          </span>

          <strong>
            {supportRequests.length}
          </strong>

        </div>

      </div>


      <div className="tutor-support-list">

        {requests.map(
          (request) => {

            const sessionRequest =
              request.category ===
              "session_request";


            return (
              <details
                key={
                  request.id
                }
                className={`tutor-support-request status-${request.status}`}
                open={
                  request.status !==
                  "resolved"
                }
              >

                <summary>

                  <div className="tutor-support-request-title">

                    <span>
                      {titleCase(
                        request.category,
                      )}
                    </span>

                    <strong>
                      {request.message
                        ?.split(
                          "\n",
                        )[0]
                        ?.slice(
                          0,
                          120,
                        ) ||
                        "Student request"}
                    </strong>

                  </div>


                  <div className="tutor-support-request-summary">

                    <time>
                      {formatDateTimeInTimeZone(
                        request.created_at,
                        tutorTimeZone,
                      )}
                    </time>

                    <span
                      className={`tutor-support-status status-${request.status}`}
                    >
                      {titleCase(
                        request.status,
                      )}
                    </span>

                  </div>

                </summary>


                <div className="tutor-support-request-body">

                  <div className="tutor-support-message">

                    <span>
                      Student message
                    </span>

                    <p>
                      {request.message}
                    </p>

                  </div>


                  {sessionRequest && (
                    <div className="tutor-support-session-note">

                      <div>

                        <strong>
                          Session request
                        </strong>

                        <p>
                          {request.status === "resolved"
                            ? "This request was handled through the Sessions workflow."
                            : "Use the Sessions workflow to schedule or respond to the requested lesson."}
                        </p>

                      </div>


                      <Link
                        href="/tutor/sessions"
                      >
                        Open Sessions →
                      </Link>

                    </div>
                  )}


                  {request.admin_note && (
                    <div className="tutor-support-history">

                      <span>
                        Internal history
                      </span>

                      <pre>
                        {request.admin_note}
                      </pre>

                    </div>
                  )}


                  {!sessionRequest && (
                    <form
                      action={
                        updateTutorSupportRequest
                      }
                      className="tutor-support-form"
                    >

                    <input
                      type="hidden"
                      name="requestId"
                      value={
                        request.id
                      }
                    />


                    <label>

                      <span>
                        Status
                      </span>

                      <select
                        name="status"
                        defaultValue={
                          request.status
                        }
                      >

                        <option value="new">
                          New
                        </option>

                        <option value="in_progress">
                          In progress
                        </option>

                        <option value="resolved">
                          Resolved
                        </option>

                      </select>

                    </label>


                    <label className="tutor-support-note-field">

                      <span>
                        Add internal note
                      </span>

                      <textarea
                        name="appendNote"
                        maxLength={3000}
                        placeholder="Record your follow-up, action taken or next step. This is not shown to the student."
                      />

                    </label>


                    <div className="tutor-support-form-footer">

                      {request.status ===
                        "resolved" && (
                        <small>
                          Change the status to New or In progress
                          to reopen this request.
                        </small>
                      )}


                      <button
                        className="tutor-primary-button"
                        type="submit"
                      >
                        Save follow-up
                      </button>

                    </div>

                    </form>
                  )}

                </div>

              </details>
            );
          },
        )}


        {!requests.length && (
          <div className="tutor-empty">
            This student has not submitted any support
            requests for this course.
          </div>
        )}

      </div>

    </section>
  );
}
