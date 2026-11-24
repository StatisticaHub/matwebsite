import Link from "next/link";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  DEFAULT_TIME_ZONE,
  dateKeyInTimeZone,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";

export const metadata = {
  title: "Tutor dashboard",
};

export const dynamic = "force-dynamic";


export default async function TutorDashboardPage() {
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


  const fmt = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      tutorTimeZone,
    );


  const dayKey = (
    value: Date,
  ) =>
    dateKeyInTimeZone(
      value,
      tutorTimeZone,
    );


  const timeOnly = (
    value: string | null,
  ) => {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        timeStyle: "short",
        timeZone:
          tutorTimeZone,
      },
    ).format(
      new Date(value),
    );
  };


  const dueLabel = (
    value: string | null,
  ) => {
    if (!value) {
      return "No due date";
    }

    const date =
      new Date(
        `${value}T12:00:00`,
      );

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        dateStyle:
          "medium",
        timeZone:
          tutorTimeZone,
      },
    ).format(date);
  };


  const supabase =
    createAdminClient();


  /*
   * Primary tutor-owned data.
   *
   * The dashboard never trusts a student or
   * engagement identifier supplied by the browser.
   */
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
          `
          id,
          scheduled_for,
          completed_at,
          duration_minutes,
          status,
          topic,
          meeting_url,
          zoom_ended_at,
          lesson_notes,
          understanding_rating,
          next_topic,
          tutoring_engagements(
            id,
            subject,
            title,
            students(
              id,
              name
            )
          )
        `,
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
        .limit(300),

      supabase
        .from(
          "tutoring_engagements",
        )
        .select(
          `
          id,
          status,
          subject,
          title,
          current_focus,
          upcoming_deadline,
          students(
            id,
            name,
            academic_level
          )
        `,
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


  const sessions =
    (
      sessionResult.data ||
      []
    ) as any[];


  const engagements =
    (
      engagementResult.data ||
      []
    ) as any[];


  const engagementIds =
    engagements.map(
      (item) =>
        item.id,
    );


  /*
   * Secondary action queues.
   *
   * Both are restricted to engagement IDs that
   * already belong to the authenticated tutor.
   */
  let awaitingReview:
    any[] = [];

  let openRequests:
    any[] = [];


  if (
    engagementIds.length
  ) {
    const [
      homeworkResult,
      requestResult,
    ] =
      await Promise.all([
        supabase
          .from(
            "homework",
          )
          .select(
            "id,engagement_id,title,due_date,status,updated_at",
          )
          .in(
            "engagement_id",
            engagementIds,
          )
          .eq(
            "status",
            "submitted",
          )
          .order(
            "updated_at",
            {
              ascending: false,
            },
          )
          .limit(30),

        supabase
          .from(
            "student_support_requests",
          )
          .select(
            "id,student_id,engagement_id,category,message,status,created_at",
          )
          .in(
            "engagement_id",
            engagementIds,
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
          .order(
            "created_at",
            {
              ascending: false,
            },
          )
          .limit(30),
      ]);


    if (homeworkResult.error) {
      throw new Error(
        homeworkResult.error.message,
      );
    }


    if (requestResult.error) {
      throw new Error(
        requestResult.error.message,
      );
    }


    awaitingReview =
      homeworkResult.data ||
      [];

    openRequests =
      requestResult.data ||
      [];
  }


  const engagementById =
    new Map(
      engagements.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );


  const now =
    new Date();

  const nowMs =
    now.getTime();

  const todayKey =
    dayKey(now);


  /*
   * Priority 1:
   * lesson has happened but the tutor has
   * not yet completed the teaching record.
   */
  const needsCloseout =
    sessions
      .filter(
        (item) =>
          item.status ===
            "planned" &&
          item.scheduled_for &&
          (
            item.zoom_ended_at ||
            new Date(
              item.scheduled_for,
            ).getTime() <
              nowMs
          ),
      )
      .sort(
        (a, b) =>
          new Date(
            b.scheduled_for,
          ).getTime() -
          new Date(
            a.scheduled_for,
          ).getTime(),
      );


  /*
   * Priority 2:
   * future planned lessons.
   */
  const upcoming =
    sessions
      .filter(
        (item) =>
          item.status ===
            "planned" &&
          item.scheduled_for &&
          new Date(
            item.scheduled_for,
          ).getTime() >=
            nowMs,
      )
      .sort(
        (a, b) =>
          new Date(
            a.scheduled_for,
          ).getTime() -
          new Date(
            b.scheduled_for,
          ).getTime(),
      );


  const today =
    upcoming.filter(
      (item) =>
        dayKey(
          new Date(
            item.scheduled_for,
          ),
        ) === todayKey,
    );


  const todayMinutes =
    today.reduce(
      (
        sum,
        item,
      ) =>
        sum +
        Number(
          item.duration_minutes ||
            0,
        ),
      0,
    );


  /*
   * Priority 5:
   * group active engagements by actual student,
   * then flag students with no future lesson
   * across any of their active courses.
   */
  const futureEngagementIds =
    new Set(
      upcoming
        .map(
          (item) =>
            item
              .tutoring_engagements
              ?.id,
        )
        .filter(Boolean),
    );


  const studentGroups =
    new Map<
      string,
      {
        id: string;
        name: string;
        engagements: any[];
        hasUpcoming: boolean;
      }
    >();


  for (
    const engagement
    of engagements
  ) {
    const student =
      engagement.students;

    if (
      !student?.id
    ) {
      continue;
    }


    const existing =
      studentGroups.get(
        student.id,
      );


    if (existing) {
      existing.engagements.push(
        engagement,
      );

      if (
        futureEngagementIds.has(
          engagement.id,
        )
      ) {
        existing.hasUpcoming =
          true;
      }

      continue;
    }


    studentGroups.set(
      student.id,
      {
        id:
          student.id,
        name:
          student.name ||
          "Student",
        engagements: [
          engagement,
        ],
        hasUpcoming:
          futureEngagementIds.has(
            engagement.id,
          ),
      },
    );
  }


  const studentsNeedingAttention =
    Array.from(
      studentGroups.values(),
    ).filter(
      (item) =>
        !item.hasUpcoming,
    );


  const firstCloseout =
    needsCloseout[0] ||
    null;

  const nextLesson =
    upcoming[0] ||
    null;

  const firstReview =
    awaitingReview[0] ||
    null;

  const firstRequest =
    openRequests[0] ||
    null;

  const firstAttention =
    studentsNeedingAttention[0] ||
    null;


  const reviewEngagement =
    firstReview
      ? engagementById.get(
          firstReview.engagement_id,
        )
      : null;


  const requestEngagement =
    firstRequest
      ? engagementById.get(
          firstRequest.engagement_id,
        )
      : null;


  return (
    <div className="tutor-page tutor-dashboard-page">

      <header className="tutor-dashboard-hero">
        <div>
          <span className="tutor-eyebrow">
            Teaching workspace
          </span>

          <h1>
            Welcome back,{" "}
            {auth.tutor.name}.
          </h1>

          <p>
            See what needs your attention next,
            then move straight into teaching,
            feedback or student follow-up.
          </p>
        </div>

        <div className="tutor-dashboard-hero-actions">
          <Link
            className="tutor-primary-button"
            href="/tutor/sessions"
          >
            Open sessions
          </Link>

          <Link
            className="tutor-secondary-button"
            href="/tutor/students"
          >
            My students
          </Link>
        </div>
      </header>


      <section className="tutor-command-metrics">
        <article
          className={
            needsCloseout.length
              ? "attention"
              : ""
          }
        >
          <span>
            Needs close-out
          </span>

          <strong>
            {needsCloseout.length}
          </strong>

          <small>
            {needsCloseout.length
              ? "Lesson records waiting"
              : "Everything up to date"}
          </small>
        </article>


        <article>
          <span>
            Upcoming lessons
          </span>

          <strong>
            {upcoming.length}
          </strong>

          <small>
            {today.length
              ? `${today.length} today · ${todayMinutes} min`
              : "No lessons today"}
          </small>
        </article>


        <article
          className={
            awaitingReview.length
              ? "attention"
              : ""
          }
        >
          <span>
            Homework review
          </span>

          <strong>
            {awaitingReview.length}
          </strong>

          <small>
            {awaitingReview.length
              ? "Submitted work waiting"
              : "Nothing waiting"}
          </small>
        </article>


        <article
          className={
            openRequests.length
              ? "attention"
              : ""
          }
        >
          <span>
            Student requests
          </span>

          <strong>
            {openRequests.length}
          </strong>

          <small>
            {openRequests.length
              ? "Open scheduling requests"
              : "No open requests"}
          </small>
        </article>
      </section>


      <section className="tutor-priority-board">

        <div className="tutor-priority-head">
          <div>
            <span className="tutor-eyebrow">
              Next actions
            </span>

            <h2>
              What needs your attention
            </h2>

            <p>
              Work through these in priority order.
            </p>
          </div>

          <span>
            Updated from live tutoring records
          </span>
        </div>


        <div className="tutor-priority-grid">

          <article className="tutor-priority-card is-primary">
            <div className="tutor-priority-card-top">
              <span className="tutor-priority-number">
                1
              </span>

              <span className="tutor-eyebrow">
                Sessions needing close-out
              </span>
            </div>

            <strong className="tutor-priority-count">
              {needsCloseout.length}
            </strong>

            <h3>
              {firstCloseout
                ? firstCloseout.topic
                : "All lesson records are complete"}
            </h3>

            <p>
              {firstCloseout
                ? `${
                    firstCloseout
                      .tutoring_engagements
                      ?.students
                      ?.name ||
                    "Student"
                  } · ${fmt(
                    firstCloseout.scheduled_for,
                  )}`
                : "There are no completed or elapsed lessons waiting for notes and follow-up."}
            </p>

            <div className="tutor-priority-actions">
              {firstCloseout ? (
                <Link
                  className="tutor-primary-button"
                  href={`/tutor/sessions/${firstCloseout.id}`}
                >
                  Complete lesson record
                </Link>
              ) : (
                <Link
                  className="tutor-secondary-button"
                  href="/tutor/sessions"
                >
                  View sessions
                </Link>
              )}
            </div>
          </article>


          <article className="tutor-priority-card">
            <div className="tutor-priority-card-top">
              <span className="tutor-priority-number">
                2
              </span>

              <span className="tutor-eyebrow">
                Upcoming lessons
              </span>
            </div>

            <strong className="tutor-priority-count">
              {upcoming.length}
            </strong>

            <h3>
              {nextLesson
                ? nextLesson.topic
                : "No future lesson booked"}
            </h3>

            <p>
              {nextLesson
                ? `${
                    nextLesson
                      .tutoring_engagements
                      ?.students
                      ?.name ||
                    "Student"
                  } · ${fmt(
                    nextLesson.scheduled_for,
                  )}`
                : "Future lessons will appear here once they are scheduled."}
            </p>

            <div className="tutor-priority-actions">
              {nextLesson?.meeting_url && (
                <a
                  className="tutor-primary-button"
                  href={
                    nextLesson.meeting_url
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join lesson ↗
                </a>
              )}

              <Link
                className="tutor-secondary-button"
                href="/tutor/sessions"
              >
                View schedule
              </Link>
            </div>
          </article>


          <article className="tutor-priority-card">
            <div className="tutor-priority-card-top">
              <span className="tutor-priority-number">
                3
              </span>

              <span className="tutor-eyebrow">
                Homework awaiting review
              </span>
            </div>

            <strong className="tutor-priority-count">
              {awaitingReview.length}
            </strong>

            <h3>
              {firstReview
                ? firstReview.title
                : "No submitted work waiting"}
            </h3>

            <p>
              {firstReview
                ? `${
                    reviewEngagement
                      ?.students
                      ?.name ||
                    "Student"
                  } · ${
                    reviewEngagement
                      ?.subject ||
                    "Tutoring"
                  } · ${dueLabel(
                    firstReview.due_date,
                  )}`
                : "Homework submitted by students will appear here for review and feedback."}
            </p>

            <div className="tutor-priority-actions">
              <Link
                className={
                  firstReview
                    ? "tutor-primary-button"
                    : "tutor-secondary-button"
                }
                href="/tutor/assignments"
              >
                {firstReview
                  ? "Review submitted work"
                  : "View assignments"}
              </Link>
            </div>
          </article>


          <article className="tutor-priority-card">
            <div className="tutor-priority-card-top">
              <span className="tutor-priority-number">
                4
              </span>

              <span className="tutor-eyebrow">
                Student requests
              </span>
            </div>

            <strong className="tutor-priority-count">
              {openRequests.length}
            </strong>

            <h3>
              {firstRequest
                ? `${
                    requestEngagement
                      ?.students
                      ?.name ||
                    "Student"
                  } needs a response`
                : "No open session requests"}
            </h3>

            <p>
              {firstRequest
                ? firstRequest.message
                : "New session, reschedule and cancellation requests will surface here."}
            </p>

            <div className="tutor-priority-actions">
              <Link
                className={
                  firstRequest
                    ? "tutor-primary-button"
                    : "tutor-secondary-button"
                }
                href="/tutor/sessions"
              >
                {firstRequest
                  ? "Review request"
                  : "Open sessions"}
              </Link>
            </div>
          </article>


          <article className="tutor-priority-card is-attention">
            <div className="tutor-priority-card-top">
              <span className="tutor-priority-number">
                5
              </span>

              <span className="tutor-eyebrow">
                Students needing attention
              </span>
            </div>

            <strong className="tutor-priority-count">
              {studentsNeedingAttention.length}
            </strong>

            <h3>
              {firstAttention
                ? firstAttention.name
                : "Every active student has a next lesson"}
            </h3>

            <p>
              {firstAttention
                ? `No future lesson is currently booked across ${
                    firstAttention.engagements.length ===
                    1
                      ? "their active course"
                      : `${firstAttention.engagements.length} active courses`
                  }.`
                : "There are no active students currently without a future lesson."}
            </p>

            <div className="tutor-priority-actions">
              {firstAttention ? (
                <Link
                  className="tutor-primary-button"
                  href={`/tutor/progress/${firstAttention.engagements[0].id}`}
                >
                  Open student
                </Link>
              ) : (
                <Link
                  className="tutor-secondary-button"
                  href="/tutor/students"
                >
                  View students
                </Link>
              )}
            </div>
          </article>

        </div>
      </section>


      <section className="tutor-panel tutor-dashboard-section">
        <div className="tutor-panel-head">
          <div>
            <span className="tutor-eyebrow">
              Today
            </span>

            <h2>
              Teaching schedule
            </h2>
          </div>

          <Link href="/tutor/sessions">
            View all →
          </Link>
        </div>


        <div className="tutor-command-list">
          {today.map(
            (item) => (
              <article
                key={item.id}
              >
                <div className="tutor-command-time">
                  <strong>
                    {timeOnly(
                      item.scheduled_for,
                    )}
                  </strong>

                  <span>
                    {
                      item.duration_minutes
                    }{" "}
                    min
                  </span>
                </div>

                <div className="tutor-command-copy">
                  <span className="tutor-eyebrow">
                    {item
                      .tutoring_engagements
                      ?.subject ||
                      "Tutoring"}
                  </span>

                  <strong>
                    {item.topic}
                  </strong>

                  <small>
                    {item
                      .tutoring_engagements
                      ?.students
                      ?.name ||
                      "Student"}
                  </small>
                </div>

                <div className="tutor-command-actions">
                  {item.meeting_url && (
                    <a
                      className="tutor-secondary-button"
                      href={
                        item.meeting_url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join ↗
                    </a>
                  )}

                  <Link
                    className="tutor-primary-link"
                    href={`/tutor/sessions/${item.id}`}
                  >
                    Open →
                  </Link>
                </div>
              </article>
            ),
          )}

          {!today.length && (
            <div className="tutor-empty tutor-command-empty">
              No lessons scheduled for today.
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
