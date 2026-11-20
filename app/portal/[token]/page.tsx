import type { Metadata } from "next";


import HomeworkSubmissionForm from "@/components/HomeworkSubmissionForm";
import SessionRequestForm from "@/components/SessionRequestForm";
import StudentSupportForm from "@/components/StudentSupportForm";

import {
  getPortalContext,
  safeExternalUrl,
} from "@/lib/student-portal";

import {
  homeworkStatusLabels,
  progressStatusLabels,
  sessionStatusLabels,
} from "@/lib/delivery-data";

import {
  masteryLabel,
  riskLabel,
  topicMastery,
} from "@/lib/progress";


export const dynamic = "force-dynamic";
export const revalidate = 0;


export const metadata: Metadata = {
  title: "Learning portal",

  robots: {
    index: false,
    follow: false,
    nocache: true,
  },

  referrer: "no-referrer",
};


type Params = Promise<{
  token: string;
}>;


/* ==========================================================================
   DATE HELPERS
   ========================================================================== */

function formatDate(
  value: string | null
) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
    }
  ).format(
    new Date(value)
  );
}


function formatDateTime(
  value: string | null
) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    }
  ).format(
    new Date(value)
  );
}


/* ==========================================================================
   PROGRESS HELPERS
   ========================================================================== */

function progressScore(
  status: string
) {
  if (status === "mastered") {
    return 100;
  }

  if (status === "comfortable") {
    return 72;
  }

  if (status === "developing") {
    return 38;
  }

  return 8;
}


const onboardingSteps = [
  {
    key: "awaiting_intake",
    label: "Intake",
  },
  {
    key: "review",
    label: "Review",
  },
  {
    key: "ready",
    label: "Ready",
  },
  {
    key: "complete",
    label: "Complete",
  },
] as const;


function onboardingIndex(
  status: string | undefined
) {
  if (status === "complete") {
    return 3;
  }

  if (status === "ready") {
    return 2;
  }

  if (status === "review") {
    return 1;
  }

  return 0;
}


function supportStatusLabel(
  status: string
) {
  if (status === "in_progress") {
    return "In progress";
  }

  if (status === "resolved") {
    return "Resolved";
  }

  return "Received";
}


function supportCategoryLabel(
  category: string
) {
  if (category === "session_request") {
    return "Session request";
  }

  if (category === "lesson") {
    return "Lesson / topic";
  }

  if (category === "homework") {
    return "Homework";
  }

  if (category === "resource") {
    return "Learning resource";
  }

  if (category === "technical") {
    return "Technical issue";
  }

  return "General support";
}


/* ==========================================================================
   STUDENT PORTAL
   ========================================================================== */

export default async function StudentPortalPage({
  params,
}: {
  params: Params;
}) {
  const {
    token,
  } = await params;


  const context =
    await getPortalContext(
      token
    );


  /* ------------------------------------------------------------------------
     INVALID / EXPIRED PORTAL
     ------------------------------------------------------------------------ */

  if (!context) {
    return (
      <div className="student-portal-shell portal-unavailable-shell">

        <header className="portal-topbar">
          <strong>
            My Academic Tutor
          </strong>

          <span>
            Learning portal
          </span>
        </header>


        <div className="portal-unavailable">

          <span className="portal-kicker">
            Secure learning portal
          </span>

          <h1>
            This portal link is no longer available.
          </h1>

          <p>
            It may have expired or been replaced.
            Please contact your tutoring team for a fresh link.
          </p>

          <a
            className="button button-primary"
            href="/contact"
          >
            Contact My Academic Tutor
          </a>

        </div>

      </div>
    );
  }


  /* ------------------------------------------------------------------------
     PORTAL DATA
     ------------------------------------------------------------------------ */

  const {
    student,
    engagement,
    plan,
    sessions,
    homework,
    resources,
    submissions,
    tutor,
    onboarding,
    supportRequests,
    progressReports,
  } = context;


  const now =
    Date.now();


  const upcomingSessions =
    sessions
      .filter(
        (item) =>
          item.status === "planned" &&
          item.scheduled_for &&
          new Date(
            item.scheduled_for
          ).getTime() >= now
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


  const completedSessions =
    sessions
      .filter(
        (item) =>
          item.status === "completed"
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


  const openHomework =
    homework.filter(
      (item) =>
        ![
          "completed",
          "skipped",
        ].includes(
          item.status
        )
    );


  const averageProgress =
    plan.length
      ? Math.round(
          plan.reduce(
            (
              sum,
              item
            ) =>
              sum +
              progressScore(
                item.progress_status
              ),
            0
          ) /
            plan.length
        )
      : 0;


  const mastered =
    plan.filter(
      (item) =>
        item.progress_status ===
        "mastered"
    ).length;


  const submissionByHomework =
    Object.fromEntries(
      submissions.map(
        (item) => [
          item.homework_id,
          item,
        ]
      )
    );


  const nextSession =
    upcomingSessions[0] ||
    null;


  const nextMeetingUrl =
    safeExternalUrl(
      nextSession?.meeting_url
    );


  const currentOnboardingIndex =
    onboardingIndex(
      onboarding?.status
    );


  const latestProgressReport =
    progressReports[0] ||
    null;


  /* ==========================================================================
     PAGE
     ========================================================================== */

  return (
    <div className="student-portal-shell">

      {/* ====================================================================
          TOP BAR
         ==================================================================== */}

      <header className="portal-topbar">

        <a
          href="/"
          className="portal-brand"
        >
          <strong>
            My Academic Tutor
          </strong>

          <span>
            Learning portal
          </span>
        </a>


        <nav
          className="portal-upgrade-nav"
          aria-label="Portal sections"
        >
          <a href="#overview">
            Overview
          </a>

          <a href="#progress">
            Progress
          </a>

          <a href="#sessions">
            Sessions
          </a>

          {engagement && (
            <a href="#session-request">
              Request session
            </a>
          )}

          <a href="#homework">
            Homework
          </a>

          <a href="#resources">
            Resources
          </a>

          <a href="#support">
            Support
          </a>
        </nav>


        <div className="portal-topbar-meta">
          <span>
            Private learning record
          </span>

          <strong>
            {student.name}
          </strong>
        </div>

      </header>


      <div
        className="portal-page"
        id="overview"
      >

        {/* ==================================================================
            WELCOME
           ================================================================== */}

        <section className="portal-welcome">

          <div>

            <span className="portal-kicker">
              Your tutoring plan
            </span>

            <h1>
              Welcome back,{" "}
              {
                student.name.split(
                  " "
                )[0]
              }.
            </h1>

            <p>
              {engagement
                ? `Everything for your ${engagement.subject} tutoring is collected here — sessions, tutor notes, homework, resources and support.`
                : "Your tutoring team is preparing your learning record."}
            </p>

          </div>


          {engagement && (
            <div className="portal-progress-card">

              <span>
                Overall plan progress
              </span>

              <strong>
                {averageProgress}%
              </strong>

              <div className="portal-progress-track">
                <i
                  style={{
                    width:
                      `${averageProgress}%`,
                  }}
                />
              </div>

              <small>
                {mastered} of{" "}
                {plan.length} plan
                topics mastered
              </small>

            </div>
          )}

        </section>


        {/* ==================================================================
            PRIMARY ACTIONS
           ================================================================== */}

        <section className="portal-upgrade-action-grid">

          {/* --------------------------------------------------------------
              NEXT SESSION
             -------------------------------------------------------------- */}

          <article className="portal-upgrade-next-session">

            <div>

              <span className="portal-kicker">
                Next session
              </span>

              <h2>
                {nextSession
                  ? formatDateTime(
                      nextSession.scheduled_for
                    )
                  : "No session booked yet"}
              </h2>

              <p>
                {nextSession?.topic ||
                  "Your tutoring team will add the next session here once it is scheduled."}
              </p>

              {nextSession && (
                <small>
                  {
                    nextSession.duration_minutes
                  }{" "}
                  minutes
                  {tutor?.name
                    ? ` · ${tutor.name}`
                    : ""}
                </small>
              )}

            </div>


            {/* ------------------------------------------------------------
                SESSION / REBOOKING ACTIONS
               ------------------------------------------------------------ */}

            <div className="portal-progress-actions">

              {nextMeetingUrl ? (
                <a
                  className="button button-primary"
                  href={
                    nextMeetingUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join session ↗
                </a>
              ) : nextSession ? (
                <span className="portal-upgrade-muted-action">
                  Meeting link will
                  appear here
                </span>
              ) : null}


              {engagement ? (
                <a
                  className="button button-secondary"
                  href="#session-request"
                >
                  {nextSession
                    ? "Request another session →"
                    : "Request next session →"}
                </a>
              ) : (
                <a
                  className="button button-secondary"
                  href="#support"
                >
                  Contact tutoring team →
                </a>
              )}

            </div>

          </article>


          {/* --------------------------------------------------------------
              NEXT ACTION
             -------------------------------------------------------------- */}

          <article className="portal-upgrade-next-action">

            <span className="portal-kicker">
              Your next action
            </span>


            {openHomework[0] ? (
              <>

                <h3>
                  {
                    openHomework[0]
                      .title
                  }
                </h3>

                <p>
                  {openHomework[0]
                    .due_date
                    ? `Due ${formatDate(
                        openHomework[0]
                          .due_date
                      )}`
                    : "Complete this before your next lesson if possible."}
                </p>

                <a href="#homework">
                  Open homework ↓
                </a>

              </>
            ) : nextSession ? (
              <>

                <h3>
                  Prepare for your
                  next lesson
                </h3>

                <p>
                  Review your previous
                  notes and bring any
                  questions you want to
                  cover.
                </p>

                <a href="#sessions">
                  View session details ↓
                </a>

              </>
            ) : engagement ? (
              <>

                <h3>
                  Ready for your next
                  session?
                </h3>

                <p>
                  Send your preferred
                  date, time and topic
                  so your tutoring team
                  can arrange the next
                  lesson.
                </p>

                <a href="#session-request">
                  Request a session ↓
                </a>

              </>
            ) : (
              <>

                <h3>
                  Your tutoring plan is
                  being set up
                </h3>

                <p>
                  Your tutoring team is
                  preparing the next
                  step. Send a message
                  if you need anything
                  in the meantime.
                </p>

                <a href="#support">
                  Contact your tutoring
                  team ↓
                </a>

              </>
            )}

          </article>

        </section>


        {/* ==================================================================
            ONBOARDING
           ================================================================== */}

        {onboarding &&
          onboarding.status !==
            "complete" && (

            <section className="portal-panel portal-upgrade-onboarding">

              <div className="portal-panel-head">

                <div>
                  <span className="portal-kicker">
                    Getting started
                  </span>

                  <h2>
                    Onboarding progress
                  </h2>
                </div>

                <span>
                  {
                    onboardingSteps[
                      currentOnboardingIndex
                    ].label
                  }
                </span>

              </div>


              <div className="portal-upgrade-onboarding-steps">

                {onboardingSteps.map(
                  (
                    step,
                    index
                  ) => (

                    <div
                      className={
                        index <=
                        currentOnboardingIndex
                          ? "is-complete"
                          : ""
                      }
                      key={
                        step.key
                      }
                    >

                      <i>
                        {index <
                        currentOnboardingIndex
                          ? "✓"
                          : index +
                            1}
                      </i>

                      <span>
                        {
                          step.label
                        }
                      </span>

                    </div>

                  )
                )}

              </div>


              {(onboarding.target_outcome ||
                onboarding.target_date) && (

                <p className="portal-upgrade-onboarding-note">

                  {onboarding.target_outcome ||
                    "Your target outcome is being reviewed."}

                  {onboarding.target_date
                    ? ` · Target ${formatDate(
                        onboarding.target_date
                      )}`
                    : ""}

                </p>

              )}

            </section>

          )}


        {/* ==================================================================
            NO ENGAGEMENT YET
           ================================================================== */}

        {!engagement ? (

          <div className="portal-main-grid">

            <div className="portal-primary-column">

              <section className="portal-panel portal-empty-state">

                <h2>
                  Your teaching plan is
                  being set up
                </h2>

                <p>
                  Your student record is
                  active. Once your
                  teaching engagement is
                  confirmed, sessions,
                  learning-plan topics,
                  homework and resources
                  will appear
                  automatically.
                </p>

              </section>

            </div>


            <aside
              className="portal-side-column"
              id="support"
            >

              <section className="portal-panel portal-help-card">

                <span className="portal-kicker">
                  Need something?
                </span>

                <h2>
                  Ask your tutoring team
                </h2>

                <StudentSupportForm
                  token={token}
                />

              </section>

            </aside>

          </div>

        ) : (

          <>

            {/* ==============================================================
                SUMMARY
               ============================================================== */}

            <section className="portal-summary-grid">

              <article>
                <span>
                  Subject
                </span>

                <strong>
                  {
                    engagement.subject
                  }
                </strong>

                <small>
                  {engagement.module ||
                    engagement.title}
                </small>
              </article>


              <article>
                <span>
                  Current focus
                </span>

                <strong>
                  {engagement.current_focus ||
                    "Building your learning plan"}
                </strong>

                <small>
                  {engagement.goal ||
                    "Your goal will be kept here."}
                </small>
              </article>


              <article>
                <span>
                  Open homework
                </span>

                <strong>
                  {
                    openHomework.length
                  }
                </strong>

                <small>
                  {openHomework[0]
                    ?.due_date
                    ? `Next due ${formatDate(
                        openHomework[0]
                          .due_date
                      )}`
                    : "Nothing urgent"}
                </small>
              </article>


              <article>
                <span>
                  Next deadline
                </span>

                <strong>
                  {formatDate(
                    engagement.upcoming_deadline
                  )}
                </strong>

                <small>
                  {engagement.confidence
                    ? `Current confidence ${engagement.confidence}/5`
                    : "Confidence not yet assessed"}
                </small>
              </article>

            </section>


            {/* ==============================================================
                PROGRESS REPORT
               ============================================================== */}

            <section
              className="portal-panel portal-progress-report-panel"
              id="progress"
            >

              <div className="portal-panel-head">

                <div>
                  <span className="portal-kicker">
                    Progress
                  </span>

                  <h2>
                    Your learning
                    progress
                  </h2>
                </div>


                {latestProgressReport && (
                  <span>
                    {
                      latestProgressReport.period_start
                    }{" "}
                    →{" "}
                    {
                      latestProgressReport.period_end
                    }
                  </span>
                )}

              </div>


              {latestProgressReport ? (

                <>

                  <div className="portal-progress-metric-grid">

                    <article>
                      <span>
                        Overall
                      </span>

                      <strong>
                        {latestProgressReport.overall_score ==
                        null
                          ? "—"
                          : `${latestProgressReport.overall_score}%`}
                      </strong>

                      <small>
                        {riskLabel(
                          latestProgressReport
                        )}
                      </small>
                    </article>


                    <article>
                      <span>
                        Attendance
                      </span>

                      <strong>
                        {latestProgressReport.attendance_rate ==
                        null
                          ? "—"
                          : `${Math.round(
                              latestProgressReport.attendance_rate
                            )}%`}
                      </strong>

                      <small>
                        {
                          latestProgressReport.sessions_completed
                        }{" "}
                        attended ·{" "}
                        {
                          latestProgressReport.sessions_missed
                        }{" "}
                        missed
                      </small>
                    </article>


                    <article>
                      <span>
                        Homework
                      </span>

                      <strong>
                        {latestProgressReport.homework_completion_rate ==
                        null
                          ? "—"
                          : `${Math.round(
                              latestProgressReport.homework_completion_rate
                            )}%`}
                      </strong>

                      <small>
                        {
                          latestProgressReport.homework_completed
                        }
                        /
                        {
                          latestProgressReport.homework_total
                        }{" "}
                        completed
                      </small>
                    </article>


                    <article>
                      <span>
                        Understanding
                      </span>

                      <strong>
                        {latestProgressReport.average_understanding ==
                        null
                          ? "—"
                          : `${Number(
                              latestProgressReport.average_understanding
                            ).toFixed(
                              1
                            )}/5`}
                      </strong>

                      <small>
                        Session average
                      </small>
                    </article>

                  </div>


                  <div className="portal-progress-copy">

                    {latestProgressReport.summary && (
                      <div>
                        <strong>
                          Summary
                        </strong>

                        <p>
                          {
                            latestProgressReport.summary
                          }
                        </p>
                      </div>
                    )}


                    {latestProgressReport.strengths && (
                      <div>
                        <strong>
                          Strengths
                        </strong>

                        <p>
                          {
                            latestProgressReport.strengths
                          }
                        </p>
                      </div>
                    )}


                    {latestProgressReport.areas_for_improvement && (
                      <div>
                        <strong>
                          Areas to
                          develop
                        </strong>

                        <p>
                          {
                            latestProgressReport.areas_for_improvement
                          }
                        </p>
                      </div>
                    )}


                    {latestProgressReport.next_focus && (
                      <div>
                        <strong>
                          Next focus
                        </strong>

                        <p>
                          {
                            latestProgressReport.next_focus
                          }
                        </p>
                      </div>
                    )}

                  </div>


                  <div className="portal-progress-actions">

                    <a
                      className="button button-secondary"
                      href={`/portal/${token}/progress/${latestProgressReport.id}`}
                    >
                      Open printable
                      report →
                    </a>


                    {progressReports.length >
                      1 && (
                      <span>
                        {
                          progressReports.length
                        }{" "}
                        reports available
                      </span>
                    )}

                  </div>

                </>

              ) : (

                <div className="portal-empty">
                  Your first progress
                  report will appear
                  here once your tutor
                  has enough learning
                  data to create one.
                </div>

              )}


              {plan.length > 0 && (

                <div className="portal-topic-mastery-grid">

                  {plan.map(
                    (item) => {

                      const mastery =
                        topicMastery(
                          item as any
                        );

                      return (
                        <article
                          key={
                            item.id
                          }
                        >

                          <div>
                            <strong>
                              {
                                item.topic
                              }
                            </strong>

                            <span>
                              {
                                mastery
                              }
                              %
                            </span>
                          </div>


                          <div className="portal-progress-track">
                            <i
                              style={{
                                width:
                                  `${mastery}%`,
                              }}
                            />
                          </div>


                          <small>
                            {masteryLabel(
                              mastery
                            )}

                            {(item as any)
                              .next_step
                              ? ` · Next: ${
                                  (
                                    item as any
                                  )
                                    .next_step
                                }`
                              : ""}
                          </small>

                        </article>
                      );
                    }
                  )}

                </div>

              )}

            </section>


            {/* ==============================================================
                MAIN PORTAL GRID
               ============================================================== */}

            <div className="portal-main-grid">

              {/* ------------------------------------------------------------
                  PRIMARY COLUMN
                 ------------------------------------------------------------ */}

              <div className="portal-primary-column">

                {/* ==========================================================
                    UPCOMING SESSIONS
                   ========================================================== */}

                <section
                  className="portal-panel"
                  id="sessions"
                >

                  <div className="portal-panel-head">

                    <div>
                      <span className="portal-kicker">
                        Calendar
                      </span>

                      <h2>
                        Upcoming sessions
                      </h2>
                    </div>

                    <span>
                      {
                        upcomingSessions.length
                      }{" "}
                      booked
                    </span>

                  </div>


                  <div className="portal-upgrade-upcoming-list">

                    {upcomingSessions
                      .slice(
                        0,
                        8
                      )
                      .map(
                        (item) => {

                          const href =
                            safeExternalUrl(
                              item.meeting_url
                            );

                          return (
                            <article
                              key={
                                item.id
                              }
                            >

                              <div className="portal-upgrade-session-time">

                                <strong>
                                  {formatDateTime(
                                    item.scheduled_for
                                  )}
                                </strong>

                                <span>
                                  {
                                    item.duration_minutes
                                  }{" "}
                                  min
                                </span>

                              </div>


                              <div className="portal-upgrade-session-topic">

                                <strong>
                                  {
                                    item.topic
                                  }
                                </strong>


                                {item.next_topic && (
                                  <small>
                                    Planned
                                    next
                                    focus:{" "}
                                    {
                                      item.next_topic
                                    }
                                  </small>
                                )}

                              </div>


                              <div>

                                {href ? (
                                  <a
                                    className="button button-secondary"
                                    href={
                                      href
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Join ↗
                                  </a>
                                ) : (
                                  <span className="portal-upgrade-link-pending">
                                    Link
                                    pending
                                  </span>
                                )}

                              </div>

                            </article>
                          );
                        }
                      )}


                    {!upcomingSessions.length && (
                      <div className="portal-empty">
                        No upcoming
                        sessions are
                        booked yet.
                      </div>
                    )}

                  </div>

                </section>


                {/* ==========================================================
                    LEARNING PLAN
                   ========================================================== */}

                <section className="portal-panel">

                  <div className="portal-panel-head">

                    <div>
                      <span className="portal-kicker">
                        Roadmap
                      </span>

                      <h2>
                        Your learning
                        plan
                      </h2>
                    </div>

                    <span>
                      {
                        plan.length
                      }{" "}
                      topics
                    </span>

                  </div>


                  <div className="portal-plan-list">

                    {plan.map(
                      (item) => (

                        <article
                          key={
                            item.id
                          }
                        >

                          <div
                            className={`portal-plan-marker progress-${item.progress_status}`}
                          />


                          <div>

                            <strong>
                              {
                                item.topic
                              }
                            </strong>


                            {item.objective && (
                              <p>
                                {
                                  item.objective
                                }
                              </p>
                            )}


                            <small>
                              {
                                item.priority
                              }{" "}
                              priority
                            </small>

                          </div>


                          <span
                            className={`portal-status progress-${item.progress_status}`}
                          >
                            {
                              progressStatusLabels[
                                item
                                  .progress_status
                              ]
                            }
                          </span>

                        </article>

                      )
                    )}


                    {!plan.length && (
                      <div className="portal-empty">
                        Your tutoring
                        team has not
                        added plan
                        topics yet.
                      </div>
                    )}

                  </div>

                </section>


                {/* ==========================================================
                    HOMEWORK
                   ========================================================== */}

                <section
                  className="portal-panel"
                  id="homework"
                >

                  <div className="portal-panel-head">

                    <div>
                      <span className="portal-kicker">
                        Practice
                      </span>

                      <h2>
                        Homework &
                        independent work
                      </h2>
                    </div>

                    <span>
                      {
                        homework.length
                      }{" "}
                      items
                    </span>

                  </div>


                  <div className="portal-homework-list">

                    {homework.map(
                      (item) => {

                        const submission =
                          submissionByHomework[
                            item.id
                          ] ||
                          null;

                        return (
                          <article
                            key={
                              item.id
                            }
                          >

                            <div className="portal-homework-copy">

                              <div>

                                <strong>
                                  {
                                    item.title
                                  }
                                </strong>


                                <span
                                  className={`portal-status homework-${item.status}`}
                                >
                                  {
                                    homeworkStatusLabels[
                                      item
                                        .status
                                    ]
                                  }
                                </span>

                              </div>


                              <small>
                                {item.due_date
                                  ? `Due ${formatDate(
                                      item.due_date
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
                                    Tutor
                                    feedback
                                  </span>

                                  <p>
                                    {
                                      item.tutor_feedback
                                    }
                                  </p>

                                </div>

                              )}


                              {submission && (
                                <small>
                                  Last
                                  submitted{" "}
                                  {formatDateTime(
                                    submission.submitted_at
                                  )}
                                </small>
                              )}

                            </div>


                            {!(
                              [
                                "completed",
                                "skipped",
                              ] as string[]
                            ).includes(
                              item.status
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
                      }
                    )}


                    {!homework.length && (
                      <div className="portal-empty">
                        No homework has
                        been assigned
                        yet.
                      </div>
                    )}

                  </div>

                </section>


                {/* ==========================================================
                    SESSION HISTORY
                   ========================================================== */}

                <section className="portal-panel">

                  <div className="portal-panel-head">

                    <div>
                      <span className="portal-kicker">
                        Lesson record
                      </span>

                      <h2>
                        Session history
                      </h2>
                    </div>

                    <span>
                      {
                        completedSessions.length
                      }{" "}
                      completed
                    </span>

                  </div>


                  <div className="portal-session-timeline">

                    {completedSessions
                      .slice(
                        0,
                        12
                      )
                      .map(
                        (item) => (

                          <article
                            key={
                              item.id
                            }
                          >

                            <div className="portal-session-date">

                              <strong>
                                {formatDateTime(
                                  item.completed_at ||
                                    item.scheduled_for
                                )}
                              </strong>

                              <span>
                                {
                                  item.duration_minutes
                                }{" "}
                                min
                              </span>

                            </div>


                            <div className="portal-session-copy">

                              <strong>
                                {
                                  item.topic
                                }
                              </strong>


                              {item.lesson_notes && (
                                <p>
                                  {
                                    item.lesson_notes
                                  }
                                </p>
                              )}


                              {item.homework_summary && (

                                <div className="portal-upgrade-session-note">

                                  <span>
                                    Practice /
                                    homework
                                  </span>

                                  <p>
                                    {
                                      item.homework_summary
                                    }
                                  </p>

                                </div>

                              )}


                              {item.next_topic && (
                                <small>
                                  Next focus:{" "}
                                  {
                                    item.next_topic
                                  }
                                </small>
                              )}

                            </div>


                            <div className="portal-session-meta">

                              <span
                                className={`portal-status session-${item.status}`}
                              >
                                {
                                  sessionStatusLabels[
                                    item
                                      .status
                                  ]
                                }
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

                            </div>

                          </article>

                        )
                      )}


                    {!completedSessions.length && (
                      <div className="portal-empty">
                        Your completed
                        lessons will
                        build into a
                        learning history
                        here.
                      </div>
                    )}

                  </div>

                </section>

              </div>


              {/* ------------------------------------------------------------
                  SIDEBAR
                 ------------------------------------------------------------ */}

              <aside className="portal-side-column">

                {/* ==========================================================
                    TUTOR
                   ========================================================== */}

                <section className="portal-panel portal-upgrade-tutor-card">

                  <span className="portal-kicker">
                    Your tutor
                  </span>

                  <div className="portal-upgrade-tutor-avatar">
                    {tutor?.name
                      ?.slice(
                        0,
                        1
                      )
                      .toUpperCase() ||
                      "T"}
                  </div>

                  <h2>
                    {tutor?.name ||
                      "Tutor being confirmed"}
                  </h2>


                  {tutor?.headline && (
                    <p>
                      {
                        tutor.headline
                      }
                    </p>
                  )}


                  <dl>

                    <div>
                      <dt>
                        Status
                      </dt>

                      <dd>
                        {tutor?.verified
                          ? "Verified tutor"
                          : "MAT tutor"}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Timezone
                      </dt>

                      <dd>
                        {tutor?.timezone ||
                          "Coordinated by MAT"}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Frequency
                      </dt>

                      <dd>
                        {engagement.frequency ||
                          "Flexible"}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Session length
                      </dt>

                      <dd>
                        {
                          engagement.session_duration_minutes
                        }{" "}
                        minutes
                      </dd>
                    </div>

                  </dl>

                </section>


                {/* ==========================================================
                    CURRENT ENGAGEMENT
                   ========================================================== */}

                <section className="portal-panel portal-focus-card">

                  <span className="portal-kicker">
                    Current engagement
                  </span>

                  <h2>
                    {
                      engagement.title
                    }
                  </h2>


                  <dl>

                    <div>
                      <dt>
                        Learning
                        preference
                      </dt>

                      <dd>
                        {engagement.preferred_learning_style ||
                          "Being assessed"}
                      </dd>
                    </div>


                    <div>
                      <dt>
                        Target
                      </dt>

                      <dd>
                        {engagement.target ||
                          engagement.goal ||
                          "In progress"}
                      </dd>
                    </div>

                  </dl>


                  {engagement.weak_topics
                    ?.length > 0 && (

                    <div className="portal-topic-tags">

                      {engagement.weak_topics.map(
                        (
                          topic
                        ) => (
                          <span
                            key={
                              topic
                            }
                          >
                            {
                              topic
                            }
                          </span>
                        )
                      )}

                    </div>

                  )}

                </section>


                {/* ==========================================================
                    SESSION REQUEST
                   ========================================================== */}

                <section
                  className="portal-panel portal-help-card"
                  id="session-request"
                >
                  <span className="portal-kicker">
                    Continue tutoring
                  </span>

                  <h2>
                    Request your next
                    session
                  </h2>

                  <p>
                    Tell us when you
                    would prefer to meet
                    and what you want to
                    work on. Your
                    tutoring team will
                    review the request
                    before confirming
                    the session.
                  </p>

                  <SessionRequestForm
                    token={token}
                  />
                </section>


                {/* ==========================================================
                    RESOURCES
                   ========================================================== */}

                <section
                  className="portal-panel"
                  id="resources"
                >

                  <div className="portal-panel-head compact">

                    <div>
                      <span className="portal-kicker">
                        Materials
                      </span>

                      <h2>
                        Resources
                      </h2>
                    </div>

                  </div>


                  <div className="portal-resource-list">

                    {resources.map(
                      (item) => {

                        const href =
                          safeExternalUrl(
                            item.url
                          );

                        return (
                          <article
                            key={
                              item.id
                            }
                          >

                            <div>

                              <span>
                                {
                                  item.resource_type
                                }
                              </span>

                              <strong>
                                {
                                  item.title
                                }
                              </strong>


                              {item.note && (
                                <p>
                                  {
                                    item.note
                                  }
                                </p>
                              )}

                            </div>


                            {href && (
                              <a
                                href={
                                  href
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Open ↗
                              </a>
                            )}

                          </article>
                        );
                      }
                    )}


                    {!resources.length && (
                      <div className="portal-empty">
                        Shared materials
                        will appear here.
                      </div>
                    )}

                  </div>

                </section>


                {/* ==========================================================
                    SUPPORT
                   ========================================================== */}

                <section
                  className="portal-panel portal-help-card"
                  id="support"
                >

                  <span className="portal-kicker">
                    Need something?
                  </span>

                  <h2>
                    Ask your tutoring
                    team
                  </h2>

                  <p>
                    Use this for lesson
                    questions, homework,
                    a missing resource,
                    technical help or
                    anything else that
                    needs follow-up.
                  </p>


                  <StudentSupportForm
                    token={token}
                  />


                  <div className="portal-upgrade-support-history">

                    <h3>
                      Your recent
                      requests
                    </h3>


                    {supportRequests
                      .slice(
                        0,
                        5
                      )
                      .map(
                        (item) => (

                          <article
                            key={
                              item.id
                            }
                          >

                            <div>

                              <strong>
                                {supportCategoryLabel(
                                  item.category
                                )}
                              </strong>


                              <span
                                className={`portal-upgrade-support-status is-${item.status}`}
                              >
                                {supportStatusLabel(
                                  item.status
                                )}
                              </span>

                            </div>


                            <p
                              style={{
                                whiteSpace:
                                  "pre-line",
                              }}
                            >
                              {
                                item.message
                              }
                            </p>


                            <small>
                              {formatDateTime(
                                item.created_at
                              )}
                            </small>

                          </article>

                        )
                      )}


                    {!supportRequests.length && (
                      <p className="portal-upgrade-support-empty">
                        You have not
                        sent any support
                        requests yet.
                      </p>
                    )}

                  </div>

                </section>

              </aside>

            </div>

          </>

        )}

      </div>

    </div>
  );
}