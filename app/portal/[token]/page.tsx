import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getStudentSession } from "@/lib/student-auth";

import LearningMaterialUploadForm from "@/components/LearningMaterialUploadForm";

import StudentDashboardOverview from "@/components/StudentDashboardOverview";
import StudentReferralCard from "@/components/StudentReferralCard";

import LearningMaterialsList, {
  type LearningMaterialListItem,
} from "@/components/LearningMaterialsList";

import { createAdminClient } from "@/lib/supabase/admin";


import HomeworkAssignmentSubmission from "@/components/HomeworkAssignmentSubmission";
import SessionRequestForm from "@/components/SessionRequestForm";
import SessionChangeRequestForm from "@/components/SessionChangeRequestForm";
import StudentSupportForm from "@/components/StudentSupportForm";
import PortalTimeZoneControl from "@/components/PortalTimeZoneControl";
import StudentWelcomeGreeting from "@/components/StudentWelcomeGreeting";
import StudentLessonContinuityRecord from "@/components/StudentLessonContinuityRecord";
import StudentWeeklyJourney from "@/components/StudentWeeklyJourney";
import {
  DEFAULT_TIME_ZONE,
  formatDateTimeInTimeZone,
  isValidTimeZone,
} from "@/lib/time-zone";

import {
  getPortalCourseContext,
  safeExternalUrl,
} from "@/lib/student-portal";

import {
  referralUrlForStudentId,
} from "@/lib/referrals";

import {
  homeworkStatusLabels,
  progressStatusLabels,
  sessionStatusLabels,
} from "@/lib/delivery-data";

import {
  isNewProgressReport,
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

type SearchParams = Promise<{
  course?: string;
  view?: string;
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

  return 0;
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
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const {
    token,
  } = await params;

  const query =
    await searchParams;

  const portalViews = [
    "dashboard",
    "lessons",
    "calendar",
    "assignments",
    "resources",
    "progress",
    "help",
  ] as const;

  type PortalView =
    (typeof portalViews)[number];

  const requestedViewRaw =
    String(
      query.view ||
      "dashboard"
    );

  const requestedView =
    requestedViewRaw === "timetable"
      ? "calendar"
      : requestedViewRaw === "files"
        ? "resources"
        : requestedViewRaw === "support"
          ? "help"
          : requestedViewRaw;

  const portalView: PortalView =
    portalViews.includes(
      requestedView as PortalView
    )
      ? requestedView as PortalView
      : "dashboard";

  const coursePart =
    query.course
      ? `&course=${encodeURIComponent(
          query.course
        )}`
      : "";

  const portalHref = (
    view: PortalView
  ) =>
    `/portal/${token}?view=${view}${coursePart}`;


  const context =
    await getPortalCourseContext(
      token,
      query.course || null,
    );


  /* ------------------------------------------------------------------------
     INVALID / EXPIRED PORTAL
     ------------------------------------------------------------------------ */

  if (!context) {
    redirect("/portal/login?expired=1");
  }


  /* ------------------------------------------------------------------------
     PORTAL DATA
     ------------------------------------------------------------------------ */

  const {
    student,
    engagement,
    courses,
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

  /*
   * Every stored session remains UTC.
   * Student-facing dates are rendered
   * in the timezone the student selected.
   */
  const savedStudentTimeZone =
    onboarding?.timezone ||
    null;

  const studentFormatDateTime = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      savedStudentTimeZone,
    );


  const studentTimeZone =
    isValidTimeZone(
      savedStudentTimeZone
    )
      ? savedStudentTimeZone
      : DEFAULT_TIME_ZONE;

  const portalDateTime = (
    value: string | null
  ) =>
    formatDateTimeInTimeZone(
      value,
      studentTimeZone
    );


  /*
   * Secure uploaded learning files.
   *
   * getPortalContext() has already validated the student's
   * private portal token before this query is reached.
   */
  let learningMaterials:
    LearningMaterialListItem[] =
      [];

  /*
   * Account-based portal sessions use a short-lived compatibility token.
   * If it expires or is replaced, recover through the authenticated
   * student account instead of showing a broken-link page.
   */
  if (!context) {
    const studentSession = await getStudentSession();

    if (studentSession) {
      redirect("/portal/open");
    }

    redirect("/portal/login?expired=1");
  }


  if (engagement) {
    const materialClient =
      createAdminClient();

    const {
      data:
        learningMaterialData,
      error:
        learningMaterialError,
    } =
      await materialClient
        .from(
          "learning_materials",
        )
        .select(
          "id,created_at,title,description,category,uploaded_by_role,original_filename,mime_type,size_bytes,session_id,homework_id",
        )
        .eq(
          "student_id",
          student.id,
        )
        .eq(
          "engagement_id",
          engagement.id,
        )
        .eq(
          "visible_to_student",
          true,
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
        );

    if (learningMaterialError) {
      console.error(
        "Could not load portal learning materials:",
        learningMaterialError.message,
      );
    } else {
      learningMaterials =
        (
          learningMaterialData ||
          []
        ) as LearningMaterialListItem[];
    }
  }

  const assignmentMaterialByHomework =
    new Map<
      string,
      LearningMaterialListItem[]
    >();

  const generalLearningMaterials:
    LearningMaterialListItem[] = [];

  for (
    const rawMaterial
    of learningMaterials
  ) {
    const material =
      rawMaterial as
        LearningMaterialListItem & {
          homework_id?:
            string | null;
        };

    if (
      material.homework_id
    ) {
      const existing =
        assignmentMaterialByHomework.get(
          material.homework_id,
        ) || [];

      existing.push(
        rawMaterial,
      );

      assignmentMaterialByHomework.set(
        material.homework_id,
        existing,
      );
    } else {
      generalLearningMaterials.push(
        rawMaterial,
      );
    }
  }



  const tutorSharedMaterials =
    generalLearningMaterials.filter(
      (item) =>
        item.uploaded_by_role !==
        "student",
    );

  const studentSharedMaterials =
    generalLearningMaterials.filter(
      (item) =>
        item.uploaded_by_role ===
        "student",
    );



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


  const recordingBySession = new Map<
    string,
    Array<{
      id: string;
      file_type: string | null;
      file_extension: string | null;
      file_size_bytes: number | null;
    }>
  >();

  const completedSessionIds =
    completedSessions.map((item) => item.id);

  if (completedSessionIds.length) {
    const { data: recordingRows, error: recordingError } =
      await createAdminClient()
        .from("session_recordings")
        .select(
          "id,session_id,file_type,file_extension,file_size_bytes"
        )
        .in("session_id", completedSessionIds)
        .eq("student_visible", true)
        .eq("status", "completed")
        .in("file_type", [
          "MP4",
          "M4A",
          "VTT",
          "TRANSCRIPT",
        ])
        .order("created_at", {
          ascending: true,
        });

    if (recordingError) {
      console.error(
        "Could not load student-visible lesson recordings:",
        recordingError
      );
    }

    for (const recording of recordingRows || []) {
      const sessionId =
        String(recording.session_id || "");

      if (!sessionId) {
        continue;
      }

      const existing =
        recordingBySession.get(sessionId) || [];

      existing.push({
        id: recording.id,
        file_type: recording.file_type,
        file_extension: recording.file_extension,
        file_size_bytes: recording.file_size_bytes,
      });

      recordingBySession.set(
        sessionId,
        existing
      );
    }
  }
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


  const nextPlanItem =
    plan.find(
      (item) =>
        item.progress_status !==
        "mastered"
    ) || null;


  const learningPlanStages = [
    {
      status: "needs_work" as const,
      title: "Needs work",
      description:
        "Topics that need focused practice and tutor support.",
    },
    {
      status: "developing" as const,
      title: "Developing",
      description:
        "Skills you are actively building and consolidating.",
    },
    {
      status: "comfortable" as const,
      title: "Comfortable",
      description:
        "Topics you can handle with growing independence.",
    },
    {
      status: "mastered" as const,
      title: "Mastered",
      description:
        "Topics where your learning record shows strong progress.",
    },
  ].map(
    (stage) => ({
      ...stage,
      items: plan.filter(
        (item) =>
          item.progress_status ===
          stage.status
      ),
    })
  );


  const understandingTrendSessions =
    completedSessions
      .filter(
        (item) => {
          const rating =
            Number(
              item.understanding_rating
            );

          return (
            Number.isFinite(rating) &&
            rating >= 1 &&
            rating <= 5
          );
        }
      )
      .slice(0, 6)
      .reverse();


  const understandingTrendLabel =
    understandingTrendSessions.length < 2
      ? "Building history"
      : (() => {
          const first =
            Number(
              understandingTrendSessions[0]
                ?.understanding_rating
            );

          const last =
            Number(
              understandingTrendSessions[
                understandingTrendSessions.length - 1
              ]?.understanding_rating
            );

          const change =
            last - first;

          if (change >= 0.5) {
            return "Improving";
          }

          if (change <= -0.5) {
            return "Needs attention";
          }

          return "Stable";
        })();


  const masteredMilestones =
    plan
      .filter(
        (item) =>
          item.progress_status ===
          "mastered"
      )
      .sort(
        (a, b) =>
          new Date(
            b.last_assessed_at || 0
          ).getTime() -
          new Date(
            a.last_assessed_at || 0
          ).getTime()
      )
      .slice(0, 6);


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


  const courseSupportRequests =
    (supportRequests || [])
      .filter(
        (item: any) =>
          !engagement ||
          !item.engagement_id ||
          item.engagement_id ===
            engagement.id
      );


  const activeSupportRequests =
    courseSupportRequests.filter(
      (item: any) =>
        item.status !== "resolved"
    ).length;


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


  const latestProgressIsNew =
    Boolean(
      latestProgressReport &&
      isNewProgressReport(
        latestProgressReport,
      ),
    );


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
          aria-label="Student portal"
        >
          <a
            href={portalHref("dashboard")}
            className={portalView === "dashboard" ? "is-active" : undefined}
          >
            Home
          </a>

          <a
            href={portalHref("calendar")}
            className={portalView === "calendar" ? "is-active" : undefined}
          >
            Sessions
          </a>

          <a
            href={portalHref("assignments")}
            className={portalView === "assignments" ? "is-active" : undefined}
          >
            Assignments
          </a>

          <a
            href={portalHref("progress")}
            className={portalView === "progress" ? "is-active" : undefined}
          >
            Progress
          </a>

          <a
            href={portalHref("help")}
            className={portalView === "help" ? "is-active" : undefined}
          >
            Help
          </a>
        </nav>


        <div className="portal-topbar-meta">
          <span>
            Private learning record
          </span>

          <strong>
            {student.name}
          </strong>

          <a
            href="/portal/logout"
            className="portal-signout"
          >
            Sign out
          </a>
        </div>

      </header>


      <div
        className={`portal-page portal-view-${portalView}`}
        id="overview"
      >

        {courses.length > 1 && (
          <section
            className="portal-course-switchbar"
            aria-label="Your courses"
          >
            <div className="portal-course-switchbar-context">
              <span className="portal-kicker">
                Courses
              </span>

              <strong>
                {engagement?.subject ||
                  "Choose a learning space"}
              </strong>

              <small>
                {courses.length} active{" "}
                {courses.length === 1
                  ? "course"
                  : "courses"}
              </small>
            </div>


            <div
              className="portal-course-switchbar-list"
              role="list"
            >
              {courses.map(
                (course) => {
                  const selected =
                    engagement?.id ===
                    course.id;

                  return (
                    <a
                      key={course.id}
                      role="listitem"
                      aria-current={
                        selected
                          ? "page"
                          : undefined
                      }
                      className={
                        selected
                          ? "portal-course-switchbar-item is-active"
                          : "portal-course-switchbar-item"
                      }
                      href={`/portal/${encodeURIComponent(
                        token,
                      )}?view=${encodeURIComponent(
                        portalView,
                      )}&course=${encodeURIComponent(
                        course.id,
                      )}`}
                    >
                      <span
                        className="portal-course-switchbar-icon"
                        aria-hidden="true"
                      >
                        {course.subject
                          .trim()
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>

                      <span className="portal-course-switchbar-copy">
                        <strong>
                          {course.subject}
                        </strong>

                        <small>
                          {course.tutorName
                            ? `Tutor: ${course.tutorName}`
                            : "Tutor being arranged"}
                        </small>
                      </span>

                      {selected ? (
                        <span className="portal-course-switchbar-status">
                          Current
                        </span>
                      ) : (
                        <span
                          className="portal-course-switchbar-arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      )}
                    </a>
                  );
                },
              )}
            </div>
          </section>
        )}


        <section className="portal-learning-header">

          <div className="portal-learning-header-main">

            <span className="portal-kicker">
              Current learning space
            </span>

            <div className="portal-learning-header-title-row">

              <StudentWelcomeGreeting
                name={student.name}
                animate={portalView === "dashboard"}
              />

              {engagement && (
                <span className="portal-learning-course-pill">
                  {engagement.subject}
                </span>
              )}

            </div>

            <p>
              {engagement
                ? `Your ${engagement.subject} tutoring workspace.`
                : "Your tutoring team is preparing your learning record."}
            </p>


            {portalView === "dashboard" && engagement && (
              <div className="portal-learning-orientation">

                <div className="portal-learning-orientation-item">
                  <span>
                    Tutor
                  </span>

                  <strong>
                    {tutor?.name ||
                      "Being arranged"}
                  </strong>
                </div>


                <div className="portal-learning-orientation-item is-focus">
                  <span>
                    Current focus
                  </span>

                  <strong>
                    {engagement.current_focus ||
                      completedSessions[0]?.next_topic ||
                      "Your next learning focus will appear here"}
                  </strong>
                </div>

              </div>
            )}

          </div>


          <div className="portal-learning-header-tools">

            <div className="portal-learning-timezone-copy">
              <span>
                Your local time
              </span>

              <small>
                Session times use your saved timezone.
              </small>
            </div>

            <PortalTimeZoneControl
              token={token}
              initialTimeZone={studentTimeZone}
            />

          </div>

        </section>


        {engagement && (
          <>
            <StudentDashboardOverview
              token={token}
              courseId={engagement.id}
              subject={engagement.subject}
              currentFocus={engagement.current_focus || null}
              nextDeadline={engagement.upcoming_deadline || null}
              confidence={engagement.confidence || null}
              nextSession={nextSession as any}
              nextMeetingUrl={nextMeetingUrl}
              nextHomework={(openHomework[0] || null) as any}
              recentSession={(completedSessions[0] || null) as any}
              averageProgress={averageProgress}
              mastered={mastered}
              planCount={plan.length}
              timeZone={studentTimeZone}
            />

            {portalView === "dashboard" && (
              <StudentReferralCard
                referralUrl={referralUrlForStudentId(
                  student.id,
                )}
              />
            )}
          </>
        )}



        {/* ==================================================================
            PRIMARY ACTIONS
           ================================================================== */}
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
{/* ==============================================================
                PROGRESS REPORT
               ============================================================== */}

            <section
              className="portal-panel portal-progress-report-panel lms-section lms-progress"
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


              <div className="portal-progress-journey">

                <div className="portal-progress-journey-intro">

                  <div>
                    <span className="portal-kicker">
                      Learning journey
                    </span>

                    <h3>
                      Where you are now
                    </h3>

                    <p>
                      Your live learning plan updates as your tutor
                      assesses topics, confidence and next steps.
                    </p>
                  </div>


                  <div className="portal-progress-journey-score">
                    <strong>
                      {plan.length
                        ? `${averageProgress}%`
                        : "—"}
                    </strong>

                    <span>
                      Plan progress
                    </span>
                  </div>

                </div>


                <div className="portal-progress-journey-metrics">

                  <article>
                    <span>
                      Topics mastered
                    </span>

                    <strong>
                      {mastered}
                      {plan.length
                        ? ` / ${plan.length}`
                        : ""}
                    </strong>

                    <small>
                      Learning-plan topics
                    </small>
                  </article>


                  <article>
                    <span>
                      Current confidence
                    </span>

                    <strong>
                      {engagement.confidence != null
                        ? `${engagement.confidence}/5`
                        : "—"}
                    </strong>

                    <small>
                      Current learning record
                    </small>
                  </article>


                  <article>
                    <span>
                      Recent understanding
                    </span>

                    <strong>
                      {latestProgressReport?.average_understanding != null
                        ? `${Number(
                            latestProgressReport.average_understanding
                          ).toFixed(1)}/5`
                        : "—"}
                    </strong>

                    <small>
                      Latest report average
                    </small>
                  </article>

                </div>


                <div className="portal-progress-focus-grid">

                  <article>
                    <span>
                      Current focus
                    </span>

                    <strong>
                      {engagement.current_focus ||
                        nextPlanItem?.topic ||
                        engagement.subject}
                    </strong>

                    <p>
                      The main teaching priority in your current
                      learning record.
                    </p>
                  </article>


                  <article>
                    <span>
                      Next step
                    </span>

                    <strong>
                      {nextPlanItem?.next_step ||
                        nextPlanItem?.objective ||
                        "Your tutor will add the next step as your plan develops."}
                    </strong>

                    {nextPlanItem?.topic && (
                      <small>
                        {nextPlanItem.topic}
                      </small>
                    )}
                  </article>

                </div>

              </div>


              <div className="portal-progress-development-grid">

                <section className="portal-progress-development-card">

                  <div className="portal-progress-development-head">

                    <div>
                      <span className="portal-kicker">
                        Understanding
                      </span>

                      <h3>
                        Recent understanding trend
                      </h3>
                    </div>

                    <span className="portal-progress-trend-label">
                      {understandingTrendLabel}
                    </span>

                  </div>


                  {understandingTrendSessions.length ? (

                    <div className="portal-understanding-trend">

                      {understandingTrendSessions.map(
                        (item) => {

                          const rating =
                            Number(
                              item.understanding_rating
                            );

                          return (
                            <article key={item.id}>

                              <div className="portal-understanding-bar">

                                <i
                                  style={{
                                    height:
                                      `${(rating / 5) * 100}%`,
                                  }}
                                />

                              </div>


                              <strong>
                                {rating}/5
                              </strong>

                              <span>
                                {item.topic}
                              </span>

                              <small>
                                {portalDateTime(
                                  item.completed_at ||
                                  item.scheduled_for
                                )}
                              </small>

                            </article>
                          );
                        }
                      )}

                    </div>

                  ) : (

                    <div className="portal-progress-development-empty">
                      Understanding ratings will appear here
                      after completed lessons are assessed.
                    </div>

                  )}

                </section>


                <section className="portal-progress-development-card">

                  <div className="portal-progress-development-head">

                    <div>
                      <span className="portal-kicker">
                        Milestones
                      </span>

                      <h3>
                        Learning milestones
                      </h3>
                    </div>

                    <span className="portal-progress-milestone-total">
                      {mastered} mastered
                    </span>

                  </div>


                  {masteredMilestones.length ? (

                    <div className="portal-progress-milestone-list">

                      {masteredMilestones.map(
                        (item) => {

                          const mastery =
                            topicMastery(
                              item as any
                            );

                          return (
                            <article key={item.id}>

                              <div className="portal-progress-milestone-icon">
                                ✓
                              </div>


                              <div className="portal-progress-milestone-copy">

                                <div>
                                  <strong>
                                    {item.topic}
                                  </strong>

                                  <span>
                                    {mastery}%
                                  </span>
                                </div>


                                {item.strength_note && (
                                  <p>
                                    {item.strength_note}
                                  </p>
                                )}


                                <small>
                                  {item.last_assessed_at
                                    ? `Assessed ${portalDateTime(
                                        item.last_assessed_at
                                      )}`
                                    : "Mastered topic"}
                                </small>

                              </div>

                            </article>
                          );
                        }
                      )}

                    </div>

                  ) : (

                    <div className="portal-progress-development-empty">
                      Mastered topics will build into your
                      milestone history here.
                    </div>

                  )}

                </section>

              </div>


              {latestProgressIsNew && (
                <div className="portal-new-progress-report">

                  <div>

                    <span>
                      New progress report
                    </span>

                    <strong>
                      Your latest progress report is ready.
                    </strong>

                    <small>
                      Open it to review your tutor feedback,
                      progress summary and next focus.
                    </small>

                  </div>


                  <a
                    href={`/portal/${token}/progress/${latestProgressReport?.id}`}
                  >
                    Open report →
                  </a>

                </div>
              )}


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
                    WEEKLY LEARNING JOURNEY
                   ========================================================== */}

                <div id="this-week"></div>




                {/* ==========================================================
                    SESSION WORKSPACE
                   ========================================================== */}

                <section
                  className="portal-session-workspace lms-section lms-calendar"
                  id="calendar"
                >
                  <div className="portal-session-workspace-head">
                    <div>
                      <span className="portal-kicker">
                        Sessions
                      </span>

                      <h2>
                        Your next lesson
                      </h2>

                      <p>
                        Prepare, join and manage your tutoring sessions
                        from one place.
                      </p>
                    </div>

                    <div className="portal-session-workspace-tools">

                      <span className="portal-session-workspace-count">
                        {upcomingSessions.length}{" "}
                        {upcomingSessions.length === 1
                          ? "session booked"
                          : "sessions booked"}
                      </span>

                      <a
                        className="portal-session-workspace-archive"
                        href={`/portal/${encodeURIComponent(
                          token
                        )}/recordings?course=${encodeURIComponent(
                          engagement.id
                        )}`}
                      >
                        Recording archive →
                      </a>

                    </div>
                  </div>


                  {nextSession ? (
                    <article className="portal-session-next-card">

                      <div className="portal-session-next-main">

                        <span className="portal-session-next-label">
                          Next lesson
                        </span>

                        <h3>
                          {nextSession.topic}
                        </h3>

                        <strong>
                          {studentFormatDateTime(
                            nextSession.scheduled_for
                          )}
                        </strong>

                        <div className="portal-session-next-meta">

                          <span>
                            {nextSession.duration_minutes} minutes
                          </span>

                          <span>
                            {tutor?.name
                              ? `Tutor: ${tutor.name}`
                              : "Your MAT tutor"}
                          </span>

                        </div>

                      </div>


                      <div className="portal-session-next-actions">

                        {nextMeetingUrl && (
                          <a
                            className="button button-primary"
                            href={nextMeetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Join lesson
                          </a>
                        )}

                        <a
                          className="button button-secondary"
                          href="#session-change"
                        >
                          Manage booking
                        </a>

                      </div>

                    </article>
                  ) : (
                    <div className="portal-session-no-booking">

                      <div>
                        <span className="portal-kicker">
                          Next lesson
                        </span>

                        <h3>
                          No lesson is currently booked
                        </h3>

                        <p>
                          When you are ready to continue, send your
                          preferred date, time and lesson topic to your
                          tutoring team.
                        </p>
                      </div>

                      <a
                        className="button button-primary"
                        href="#session-request"
                      >
                        Request next lesson
                      </a>

                    </div>
                  )}


                  <div className="portal-session-preparation-grid">

                    <article>
                      <span>
                        Current learning focus
                      </span>

                      <strong>
                        {engagement.current_focus ||
                          completedSessions[0]?.next_topic ||
                          nextSession?.topic ||
                          engagement.subject}
                      </strong>

                      <p>
                        This is the teaching priority currently connected
                        to your learning record.
                      </p>

                      {engagement.confidence != null && (
                        <small>
                          Current confidence:{" "}
                          {engagement.confidence}/5
                        </small>
                      )}
                    </article>


                    <article>
                      <span>
                        Before your lesson
                      </span>

                      <strong>
                        Prepare for the next session
                      </strong>

                      <p>
                        {completedSessions[0]?.homework_summary ||
                          "Review your recent lesson notes, complete any open practice and bring questions you want to discuss."}
                      </p>

                      <a
                        href={`/portal/${encodeURIComponent(
                          token
                        )}?view=assignments&course=${encodeURIComponent(
                          engagement.id
                        )}`}
                      >
                        Check assignments →
                      </a>
                    </article>


                    <article>
                      <span>
                        Recent learning
                      </span>

                      <strong>
                        {completedSessions[0]
                          ? completedSessions[0].topic
                          : "Your lesson history will build here"}
                      </strong>

                      <p>
                        {completedSessions[0]?.lesson_notes ||
                          "After each completed lesson, tutor notes, understanding, practice and next steps stay attached to your record."}
                      </p>

                      <a href="#lesson-history">
                        Review lesson history →
                      </a>
                    </article>

                  </div>


                  {upcomingSessions.length > 1 && (
                    <section className="portal-session-later">

                      <div className="portal-session-later-head">
                        <div>
                          <span className="portal-kicker">
                            Coming up
                          </span>

                          <h3>
                            Later sessions
                          </h3>
                        </div>

                        <span>
                          {upcomingSessions.length - 1} more booked
                        </span>
                      </div>


                      <div className="portal-session-later-list">

                        {upcomingSessions
                          .slice(1)
                          .map((item) => {
                            const meetingUrl =
                              safeExternalUrl(
                                item.meeting_url
                              );

                            return (
                              <article key={item.id}>

                                <div className="portal-session-later-date">
                                  <strong>
                                    {studentFormatDateTime(
                                      item.scheduled_for
                                    )}
                                  </strong>

                                  <small>
                                    {item.duration_minutes} min
                                  </small>
                                </div>

                                <div className="portal-session-later-topic">
                                  <strong>
                                    {item.topic}
                                  </strong>

                                  <small>
                                    {tutor?.name
                                      ? `Tutor: ${tutor.name}`
                                      : "MAT tutoring session"}
                                  </small>
                                </div>

                                {meetingUrl && (
                                  <a
                                    href={meetingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Join ↗
                                  </a>
                                )}

                              </article>
                            );
                          })}

                      </div>

                    </section>
                  )}


                  {upcomingSessions.length > 0 && (
                    <div
                      className="portal-session-manage"
                      id="session-change"
                    >
                      <div className="portal-session-manage-copy">
                        <span className="portal-kicker">
                          Manage booking
                        </span>

                        <strong>
                          Need to change a session?
                        </strong>

                        <p>
                          Request another time or ask to cancel.
                          Your existing booking stays confirmed until
                          your tutoring team approves the change.
                        </p>
                      </div>

                      <div className="portal-session-manage-form">
                        <SessionChangeRequestForm
                          token={token}
                          initialTimeZone={
                            savedStudentTimeZone
                          }
                          engagementId={
                            engagement.id
                          }
                          defaultSessionId={
                            nextSession?.id
                          }
                          sessions={upcomingSessions.map(
                            (item) => ({
                              id: item.id,
                              scheduledFor:
                                item.scheduled_for as string,
                              topic:
                                item.topic,
                              durationMinutes:
                                item.duration_minutes,
                            })
                          )}
                        />
                      </div>
                    </div>
                  )}

                </section>


                {/* ==========================================================
                    LEARNING PLAN
                   ========================================================== */}

                <section className="portal-panel portal-learning-plan-panel lms-section lms-progress">

                  <div className="portal-panel-head">

                    <div>
                      <span className="portal-kicker">
                        Roadmap
                      </span>

                      <h2>
                        Your learning plan
                      </h2>

                      <p className="portal-learning-roadmap-intro">
                        Topics move through four stages as your tutor
                        reviews your understanding, evidence and next
                        learning steps.
                      </p>
                    </div>


                    <span>
                      {mastered} of {plan.length} mastered
                    </span>

                  </div>


                  {plan.length ? (

                    <div className="portal-learning-roadmap-grid">

                      {learningPlanStages.map(
                        (stage) => (

                          <section
                            key={stage.status}
                            className={`portal-learning-stage stage-${stage.status}`}
                          >

                            <div className="portal-learning-stage-head">

                              <div>

                                <span
                                  className="portal-learning-stage-dot"
                                  aria-hidden="true"
                                />

                                <strong>
                                  {stage.title}
                                </strong>

                              </div>


                              <span className="portal-learning-stage-count">
                                {stage.items.length}
                              </span>

                            </div>


                            <p className="portal-learning-stage-description">
                              {stage.description}
                            </p>


                            <div className="portal-learning-stage-topics">

                              {stage.items.map(
                                (item) => {

                                  const mastery =
                                    topicMastery(
                                      item as any
                                    );

                                  return (

                                    <article
                                      key={item.id}
                                      className="portal-learning-roadmap-topic"
                                    >

                                      <div className="portal-learning-roadmap-topic-head">

                                        <strong>
                                          {item.topic}
                                        </strong>

                                        <span>
                                          {mastery}%
                                        </span>

                                      </div>


                                      <div
                                        className="progress-mini-bar"
                                        aria-label={`${item.topic} mastery ${mastery}%`}
                                      >
                                        <i
                                          style={{
                                            width: `${mastery}%`,
                                          }}
                                        />
                                      </div>


                                      {item.objective && (
                                        <p className="portal-learning-roadmap-objective">
                                          {item.objective}
                                        </p>
                                      )}


                                      <div className="portal-learning-roadmap-meta">

                                        <span>
                                          {item.priority} priority
                                        </span>

                                        <span>
                                          {
                                            progressStatusLabels[
                                              item.progress_status
                                            ]
                                          }
                                        </span>

                                      </div>


                                      {item.strength_note && (

                                        <div className="portal-learning-roadmap-note">

                                          <span>
                                            Evidence
                                          </span>

                                          <p>
                                            {item.strength_note}
                                          </p>

                                        </div>

                                      )}


                                      {item.next_step && (

                                        <div className="portal-learning-roadmap-note is-next">

                                          <span>
                                            Next step
                                          </span>

                                          <p>
                                            {item.next_step}
                                          </p>

                                        </div>

                                      )}

                                    </article>

                                  );
                                }
                              )}


                              {!stage.items.length && (

                                <div className="portal-learning-stage-empty">
                                  No topics in this stage yet.
                                </div>

                              )}

                            </div>

                          </section>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="portal-empty">
                      Your tutoring team has not added
                      learning-plan topics yet.
                    </div>

                  )}

                </section>


                {/* ==========================================================
                    HOMEWORK
                   ========================================================== */}

                <section
                  className="portal-panel lms-section lms-assignments"
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
                                  {portalDateTime(
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

                              <HomeworkAssignmentSubmission
                                token={token}
                                engagementId={engagement.id}
                                homeworkId={item.id}
                                homeworkTitle={item.title}
                                existing={
                                  submission
                                    ? {
                                        note: submission.note,
                                        submission_url:
                                          submission.submission_url,
                                      }
                                    : null
                                }
                                materials={
                                  assignmentMaterialByHomework.get(item.id) || []
                                }
                                timeZone={studentTimeZone}
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


                <div className="lms-section lms-lessons">
                  <StudentWeeklyJourney
                    token={token}
                    engagementId={engagement.id}
                    timeZone={studentTimeZone}
                  />
                </div>


                {/* ==========================================================
                    HELP WORKSPACE
                   ========================================================== */}

                <section
                  className="portal-panel portal-help-workspace lms-section lms-help"
                  id="help-workspace"
                >

                  <div className="portal-help-workspace-head">

                    <div>
                      <span className="portal-kicker">
                        Student support
                      </span>

                      <h2>
                        How can we help?
                      </h2>

                      <p>
                        Choose the area that best matches what you need.
                        Your tutoring team can help between lessons as well
                        as during your scheduled sessions.
                      </p>
                    </div>


                    <div className="portal-help-open-count">

                      <strong>
                        {activeSupportRequests}
                      </strong>

                      <span>
                        open{" "}
                        {activeSupportRequests === 1
                          ? "request"
                          : "requests"}
                      </span>

                    </div>

                  </div>


                  <div className="portal-help-route-grid">

                    <a
                      href={portalHref("calendar")}
                      className="portal-help-route-card is-session"
                    >
                      <span>
                        Sessions
                      </span>

                      <strong>
                        Book, reschedule or cancel
                      </strong>

                      <p>
                        Request a new lesson or make a change to an
                        existing booking.
                      </p>

                      <b>
                        Open Sessions →
                      </b>
                    </a>


                    <a
                      href="#ask-support"
                      className="portal-help-route-card"
                    >
                      <span>
                        Lesson / topic
                      </span>

                      <strong>
                        Ask a learning question
                      </strong>

                      <p>
                        Tell your tutor what topic, method or explanation
                        you need help with.
                      </p>

                      <b>
                        Ask below ↓
                      </b>
                    </a>


                    <a
                      href={portalHref("assignments")}
                      className="portal-help-route-card"
                    >
                      <span>
                        Homework
                      </span>

                      <strong>
                        Assignment support
                      </strong>

                      <p>
                        Review your assignment first, upload your work,
                        or ask your tutor a question.
                      </p>

                      <b>
                        Open Assignments →
                      </b>
                    </a>


                    <a
                      href={portalHref("resources")}
                      className="portal-help-route-card"
                    >
                      <span>
                        Resources
                      </span>

                      <strong>
                        Find learning material
                      </strong>

                      <p>
                        Check worksheets, lesson files and other resources
                        already shared with you.
                      </p>

                      <b>
                        Open Resources →
                      </b>
                    </a>


                    <a
                      href="#ask-support"
                      className="portal-help-route-card"
                    >
                      <span>
                        Technical
                      </span>

                      <strong>
                        Report a portal problem
                      </strong>

                      <p>
                        Tell us if something is not loading, opening or
                        working correctly.
                      </p>

                      <b>
                        Report below ↓
                      </b>
                    </a>


                    <a
                      href="#ask-support"
                      className="portal-help-route-card"
                    >
                      <span>
                        General
                      </span>

                      <strong>
                        Something else?
                      </strong>

                      <p>
                        Send your tutoring team a message if your question
                        does not fit another category.
                      </p>

                      <b>
                        Send a message ↓
                      </b>
                    </a>

                  </div>


                  <div className="portal-help-workspace-grid">

                    <section
                      className="portal-help-contact-card"
                      id="ask-support"
                    >

                      <div className="portal-help-card-head">

                        <div>
                          <span className="portal-kicker">
                            Contact your team
                          </span>

                          <h3>
                            Send a support request
                          </h3>

                          <p>
                            Choose the most relevant category and explain
                            what you need. Your request stays attached to
                            your student record.
                          </p>
                        </div>

                      </div>


                      <StudentSupportForm
                        token={token}
                      />

                    </section>


                    <section className="portal-help-history-card">

                      <div className="portal-help-card-head">

                        <div>
                          <span className="portal-kicker">
                            Request history
                          </span>

                          <h3>
                            Recent requests
                          </h3>

                          <p>
                            Track whether your request has been received,
                            is being worked on, or has been resolved.
                          </p>
                        </div>

                      </div>


                      <div className="portal-help-request-list">

                        {courseSupportRequests
                          .slice(0, 8)
                          .map(
                            (item: any) => (

                              <article
                                key={item.id}
                                className="portal-help-request"
                              >

                                <div className="portal-help-request-top">

                                  <div>

                                    <span>
                                      {supportCategoryLabel(
                                        item.category
                                      )}
                                    </span>

                                    <small>
                                      {portalDateTime(
                                        item.created_at
                                      )}
                                    </small>

                                  </div>


                                  <strong
                                    className={`portal-help-request-status status-${item.status}`}
                                  >
                                    {supportStatusLabel(
                                      item.status
                                    )}
                                  </strong>

                                </div>


                                <p>
                                  {item.category ===
                                  "session_request"
                                    ? "Scheduling request submitted through your Sessions workspace."
                                    : item.message}
                                </p>


                                {item.admin_note && (

                                  <div className="portal-help-team-update">

                                    <span>
                                      Tutoring team update
                                    </span>

                                    <p>
                                      {item.admin_note}
                                    </p>

                                  </div>

                                )}

                              </article>

                            )
                          )}


                        {!courseSupportRequests.length && (

                          <div className="portal-help-history-empty">

                            <strong>
                              No support requests yet
                            </strong>

                            <p>
                              When you contact your tutoring team,
                              your recent requests and their status
                              will appear here.
                            </p>

                          </div>

                        )}

                      </div>

                    </section>

                  </div>

                </section>


                {/* ==========================================================
                    SESSION HISTORY
                   ========================================================== */}

                <section
                  className="portal-panel portal-lesson-history-panel lms-section lms-lessons"
                  id="lesson-history"
                >
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
                      {completedSessions.length} completed
                    </span>
                  </div>

                  <div className="portal-session-timeline portal-continuity-timeline">
                    {completedSessions
                      .slice(0, 12)
                      .map((item) => (
                        <article
                          key={item.id}
                          className="portal-lesson-record-card"
                        >
                          <div className="portal-session-date">
                            <strong>
                              {studentFormatDateTime(
                                item.completed_at ||
                                  item.scheduled_for
                              )}
                            </strong>

                            <span>
                              {item.duration_minutes} min
                            </span>
                          </div>

                          <div className="portal-session-copy portal-lesson-record-copy">
                            <div className="portal-lesson-record-title">
                              <div>
                                <strong>
                                  {item.topic}
                                </strong>

                                <small>
                                  Complete lesson record
                                </small>
                              </div>

                              <span
                                className={`portal-status session-${item.status}`}
                              >
                                {sessionStatusLabels[item.status]}
                              </span>
                            </div>

                            <StudentLessonContinuityRecord
                              token={token}
                              sessionId={item.id}
                              courseId={engagement?.id || null}
                              lessonNotes={item.lesson_notes}
                              understandingRating={item.understanding_rating}
                              homeworkSummary={item.homework_summary}
                              nextTopic={item.next_topic}
                              recordings={recordingBySession.get(item.id) || []}
                              linkedHomework={(homework as any[])
                                .filter(
                                  (homeworkItem) =>
                                    homeworkItem.source_session_id === item.id
                                )
                                .map((homeworkItem) => ({
                                  id: homeworkItem.id,
                                  title: homeworkItem.title,
                                  description:
                                    homeworkItem.description || null,
                                  due_date:
                                    homeworkItem.due_date || null,
                                  status: homeworkItem.status,
                                }))}
                            />
                          </div>
                        </article>
                      ))}

                    {!completedSessions.length && (
                      <div className="portal-empty">
                        Your completed lessons will build into a learning history here.
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


                {/* ==========================================================
                    CURRENT ENGAGEMENT
                   ========================================================== */}


                {/* ==========================================================
                    SESSION REQUEST
                   ========================================================== */}

                <section
                  className="portal-panel portal-help-card lms-section lms-calendar"
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
                    initialTimeZone={
                      savedStudentTimeZone
                    }
                    engagementId={
                      engagement.id
                    }
                  defaultDurationMinutes={
                      engagement.session_duration_minutes
                    }
                  />
                </section>


                {/* ==========================================================
                    RESOURCES
                   ========================================================== */}

                <section
                  className="portal-panel portal-learning-materials-panel lms-section lms-resources"
                  id="materials"
                >

                  <div className="portal-panel-head portal-materials-heading">

                    <div>
                      <span className="portal-kicker">
                        File library
                      </span>

                      <h2>
                        Materials & files
                      </h2>

                      <p>
                        Keep worksheets,
                        tutor notes,
                        datasets, slides
                        and your own work
                        together with your
                        tutoring record.
                      </p>
                    </div>


                    <div className="portal-material-counts">

                      <div>
                        <span>
                          From tutor
                        </span>

                        <strong>
                          {
                            tutorSharedMaterials.length
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Your uploads
                        </span>

                        <strong>
                          {
                            studentSharedMaterials.length
                          }
                        </strong>
                      </div>

                    </div>

                  </div>


                  <div className="portal-material-workspace-grid">

                    <div className="portal-material-library">

                      <div className="portal-material-library-head">

                        <div>
                          <strong>
                            Shared files
                          </strong>

                          <span>
                            Tutor materials
                            and your uploads
                          </span>
                        </div>

                        <span>
                          {
                            generalLearningMaterials.length
                          }{" "}
                          total
                        </span>

                      </div>


                      <LearningMaterialsList
                        materials={
                          generalLearningMaterials
                        }
                        viewerRole="student"
                        timeZone={studentTimeZone}
                        downloadBaseUrl={`/api/portal/${encodeURIComponent(
                          token
                        )}/materials`}
                        emptyText="Your tutor can share worksheets, notes, slides, datasets and other learning material here."
                      />

                    </div>


                    <aside className="portal-material-upload">

                      <LearningMaterialUploadForm
                        role="student"
                        endpoint={`/api/portal/${encodeURIComponent(
                          token
                        )}/materials`}
                        engagementId={
                          engagement.id
                        }
                        defaultCategory="submission"
                      />

                    </aside>

                  </div>

                </section>

                <section className="portal-panel portal-recordings-library-card lms-section lms-resources">
                  <div className="portal-panel-head compact">
                    <div>
                      <span className="portal-kicker">
                        Lesson media archive
                      </span>

                      <h2>
                        Recording archive
                      </h2>
                    </div>
                  </div>

                  <p>
                    Recordings stay attached to completed lesson records in Sessions.
                    Use the archive when you want to browse every recording and transcript for this course.
                  </p>

                  <a
                    className="button button-secondary"
                    href={`/portal/${encodeURIComponent(token)}/recordings?course=${encodeURIComponent(
                      engagement.id
                    )}`}
                  >
                    Browse recording archive →
                  </a>
                </section>

                {resources.length > 0 && (


                <section
                  className="portal-panel lms-section lms-resources"
                  id="resources"
                >

                  <div className="portal-panel-head compact">

                    <div>
                      <span className="portal-kicker">
                        Materials
                      </span>

                      <h2>
                        Links & references
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
                        Useful links and references shared by your tutoring team will appear here.
                      </div>
                    )}

                  </div>

                </section>
                )}


                {/* ==========================================================
                    SUPPORT
                   ========================================================== */}

                <section
                  className="portal-panel portal-help-card lms-section lms-help"
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
                    engagementId={
                      engagement?.id ||
                      null
                    }
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
                              {portalDateTime(
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
