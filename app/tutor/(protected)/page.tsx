import Link from "next/link";

import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Tutor portal",
};

export const dynamic =
  "force-dynamic";

function fmt(
  value: string | null,
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
    },
  ).format(
    new Date(value),
  );
}

function dayKey(
  value: Date,
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    ).formatToParts(
      value,
    );

  const map =
    Object.fromEntries(
      parts
        .filter(
          (part) =>
            part.type !==
            "literal",
        )
        .map(
          (part) => [
            part.type,
            part.value,
          ],
        ),
    );

  return `${map.year}-${map.month}-${map.day}`;
}

export default async function TutorHomePage() {
  const auth =
    await getTutorSession();

  if (!auth) {
    return null;
  }

  const supabase =
    createAdminClient();

  const now =
    new Date();

  const [
    {
      data:
        sessionData,
    },
    {
      data:
        engagementData,
    },
    {
      data:
        trialData,
    },
    materialResult,
  ] =
    await Promise.all([
      supabase
        .from(
          "tutoring_sessions",
        )
        .select(
          "id,scheduled_for,duration_minutes,status,topic,meeting_url,tutoring_engagements(subject,students(name))",
        )
        .eq(
          "tutor_id",
          auth.tutor.id,
        )
        .order(
          "scheduled_for",
          {
            ascending: true,
            nullsFirst: false,
          },
        )
        .limit(250),

      supabase
        .from(
          "tutoring_engagements",
        )
        .select(
          "id,status,student_id,students(name)",
        )
        .eq(
          "tutor_id",
          auth.tutor.id,
        ),

      supabase
        .from(
          "tutoring_leads",
        )
        .select(
          "id,name,subject,trial_status,trial_scheduled_for,trial_duration_minutes,trial_meeting_url",
        )
        .eq(
          "assigned_tutor_id",
          auth.tutor.id,
        )
        .eq(
          "trial_status",
          "scheduled",
        )
        .order(
          "trial_scheduled_for",
          {
            ascending: true,
          },
        ),

      supabase
        .from(
          "learning_materials",
        )
        .select(
          "id",
          {
            count: "exact",
            head: true,
          },
        )
        .eq(
          "uploaded_by_tutor_id",
          auth.tutor.id,
        )
        .eq(
          "status",
          "active",
        ),
    ]);

  const sessions =
    (
      sessionData ||
      []
    ) as any[];

  const activeStudents =
    new Set(
      (
        engagementData ||
        []
      )
        .filter(
          (item: any) =>
            item.status ===
            "active",
        )
        .map(
          (item: any) =>
            item.student_id,
        ),
    ).size;

  const planned =
    sessions.filter(
      (item) =>
        item.status ===
          "planned" &&
        item.scheduled_for &&
        new Date(
          item.scheduled_for,
        ) >= now,
    );

  const todayKey =
    dayKey(now);

  const today =
    planned.filter(
      (item) =>
        dayKey(
          new Date(
            item.scheduled_for,
          ),
        ) === todayKey,
    );

  const completedMinutes =
    sessions
      .filter(
        (item) =>
          item.status ===
          "completed",
      )
      .reduce(
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

  const upcoming =
    planned.slice(
      0,
      6,
    );

  const trials =
    (
      trialData ||
      []
    ) as any[];

  const materialCount =
    materialResult.count ||
    0;

  return (
    <div className="tutor-page tutor-dashboard-page">
      <header className="tutor-page-head tutor-dashboard-head">
        <div>
          <span className="tutor-eyebrow">
            Teaching workspace
          </span>

          <h1>
            Welcome,{" "}
            {
              auth.tutor.name.split(
                /\s+/,
              )[0]
            }
            .
          </h1>

          <p>
            Manage your teaching day,
            student learning records,
            materials and upcoming
            sessions from one workspace.
          </p>
        </div>

        <Link
          href="/tutor/materials"
          className="tutor-primary-link"
        >
          Add learning material
        </Link>
      </header>

      <section
        className="tutor-metrics"
        aria-label="Teaching overview"
      >
        <div>
          <span>
            Today
          </span>

          <strong>
            {today.length}
          </strong>

          <small>
            planned sessions
          </small>
        </div>

        <div>
          <span>
            Active students
          </span>

          <strong>
            {activeStudents}
          </strong>

          <small>
            current learners
          </small>
        </div>

        <div>
          <span>
            Materials
          </span>

          <strong>
            {materialCount}
          </strong>

          <small>
            files shared
          </small>
        </div>

        <div>
          <span>
            Teaching delivered
          </span>

          <strong>
            {(
              completedMinutes /
              60
            ).toFixed(1)}
            h
          </strong>

          <small>
            completed sessions
          </small>
        </div>
      </section>

      <section className="tutor-command-grid">
        <Link href="/tutor/sessions">
          <span>
            TODAY & UPCOMING
          </span>

          <strong>
            Teaching schedule
          </strong>

          <p>
            Open sessions, join lessons
            and complete delivery notes.
          </p>

          <small>
            {planned.length} upcoming →
          </small>
        </Link>

        <Link href="/tutor/students">
          <span>
            LEARNERS
          </span>

          <strong>
            Student workspace
          </strong>

          <p>
            Review goals, current focus
            and individual learning
            records.
          </p>

          <small>
            {activeStudents} active →
          </small>
        </Link>

        <Link href="/tutor/materials">
          <span>
            RESOURCES
          </span>

          <strong>
            Learning materials
          </strong>

          <p>
            Share worksheets, slides,
            datasets and notes or review
            student uploads.
          </p>

          <small>
            Open materials →
          </small>
        </Link>

        <Link href="/tutor/progress">
          <span>
            DEVELOPMENT
          </span>

          <strong>
            Progress records
          </strong>

          <p>
            Update topic mastery and
            prepare progress reports.
          </p>

          <small>
            Review progress →
          </small>
        </Link>
      </section>

      <div className="tutor-grid-2 tutor-dashboard-grid">
        <section className="tutor-panel">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-panel-kicker">
                Teaching queue
              </span>

              <h2>
                Next sessions
              </h2>
            </div>

            <Link href="/tutor/sessions">
              View all →
            </Link>
          </div>

          <div className="tutor-list">
            {upcoming.map(
              (item) => (
                <Link
                  href={`/tutor/sessions/${item.id}`}
                  key={item.id}
                >
                  <div>
                    <strong>
                      {
                        item.topic
                      }
                    </strong>

                    <span>
                      {item
                        .tutoring_engagements
                        ?.students
                        ?.name ||
                        "Student"}
                      {" · "}
                      {item
                        .tutoring_engagements
                        ?.subject ||
                        "Tutoring"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {fmt(
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
                </Link>
              ),
            )}

            {!upcoming.length && (
              <div className="tutor-empty">
                No upcoming sessions.
              </div>
            )}
          </div>
        </section>

        <section className="tutor-panel">
          <div className="tutor-panel-head">
            <div>
              <span className="tutor-panel-kicker">
                New learners
              </span>

              <h2>
                Upcoming trials
              </h2>
            </div>

            <Link href="/tutor/trials">
              View trials →
            </Link>
          </div>

          <div className="tutor-list">
            {trials
              .slice(
                0,
                6,
              )
              .map(
                (item) => (
                  <Link
                    href="/tutor/trials"
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {
                          item.name
                        }
                      </strong>

                      <span>
                        {
                          item.subject
                        }
                      </span>
                    </div>

                    <div>
                      <strong>
                        {fmt(
                          item.trial_scheduled_for,
                        )}
                      </strong>

                      <span>
                        {item.trial_duration_minutes ||
                          30}{" "}
                        min
                      </span>
                    </div>
                  </Link>
                ),
              )}

            {!trials.length && (
              <div className="tutor-empty">
                No upcoming trials.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
