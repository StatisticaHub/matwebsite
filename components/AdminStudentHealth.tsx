import Link from "next/link";

import {
  currentMonthRange,
} from "@/lib/progress";

import {
  createAdminClient,
} from "@/lib/supabase/admin";


type HealthRow = {
  studentId: string;
  studentName: string;
  studentEmail: string | null;
  courses: number;
  noFuture: number;
  homeworkReview: number;
  requests: number;
  reportsDue: number;
  noShows: number;
  score: number;
};


export default async function AdminStudentHealth() {
  const supabase =
    createAdminClient();

  const now =
    new Date();

  const nowIso =
    now.toISOString();

  const recentNoShowCutoff =
    new Date(
      now.getTime() -
      30 * 24 * 60 * 60 * 1000,
    ).toISOString();

  const month =
    currentMonthRange();


  const {
    data: engagementData,
    error: engagementError,
  } =
    await supabase
      .from("tutoring_engagements")
      .select(`
        id,
        student_id,
        tutor_id,
        subject,
        title,
        status,
        students(
          id,
          name,
          email,
          status
        )
      `)
      .eq(
        "status",
        "active",
      );


  if (engagementError) {
    throw new Error(
      engagementError.message,
    );
  }


  const engagements =
    (engagementData || []) as any[];


  if (!engagements.length) {
    return (
      <section className="admin-panel admin-student-health">
        <div className="admin-card-head">
          <div>
            <span className="admin-eyebrow">
              Delivery health
            </span>

            <h2>
              Student health
            </h2>

            <p>
              No active tutoring engagements are currently being monitored.
            </p>
          </div>
        </div>
      </section>
    );
  }


  const engagementIds =
    engagements.map(
      (item) =>
        item.id,
    );


  const [
    sessionResult,
    homeworkResult,
    requestResult,
    reportResult,
  ] =
    await Promise.all([

      supabase
        .from("tutoring_sessions")
        .select(
          "id,engagement_id,status,scheduled_for,completed_at",
        )
        .in(
          "engagement_id",
          engagementIds,
        )
        .in(
          "status",
          [
            "planned",
            "completed",
            "no_show",
          ],
        ),


      supabase
        .from("homework")
        .select(
          "id,engagement_id,status",
        )
        .in(
          "engagement_id",
          engagementIds,
        )
        .eq(
          "status",
          "submitted",
        ),


      supabase
        .from("student_support_requests")
        .select(
          "id,student_id,engagement_id,status",
        )
        .in(
          "engagement_id",
          engagementIds,
        )
        .in(
          "status",
          [
            "new",
            "in_progress",
          ],
        ),


      supabase
        .from("progress_reports")
        .select(
          "id,engagement_id,period_start,period_end,student_visible,published_at",
        )
        .in(
          "engagement_id",
          engagementIds,
        )
        .gte(
          "period_end",
          month.start,
        )
        .lte(
          "period_start",
          month.end,
        ),
    ]);


  const firstError =
    [
      sessionResult.error,
      homeworkResult.error,
      requestResult.error,
      reportResult.error,
    ].find(Boolean);


  if (firstError) {
    throw new Error(
      firstError.message,
    );
  }


  const sessions =
    (sessionResult.data || []) as any[];

  const homework =
    (homeworkResult.data || []) as any[];

  const requests =
    (requestResult.data || []) as any[];

  const reports =
    (reportResult.data || []) as any[];


  const healthByStudent =
    new Map<string, HealthRow>();


  for (const engagement of engagements) {
    const student =
      engagement.students;

    if (!student?.id) {
      continue;
    }


    if (
      !healthByStudent.has(
        student.id,
      )
    ) {
      healthByStudent.set(
        student.id,
        {
          studentId:
            student.id,

          studentName:
            student.name ||
            "Student",

          studentEmail:
            student.email ||
            null,

          courses:
            0,

          noFuture:
            0,

          homeworkReview:
            0,

          requests:
            0,

          reportsDue:
            0,

          noShows:
            0,

          score:
            0,
        },
      );
    }


    const row =
      healthByStudent.get(
        student.id,
      )!;


    row.courses += 1;


    const courseSessions =
      sessions.filter(
        (item) =>
          item.engagement_id ===
          engagement.id,
      );


    const hasFuture =
      courseSessions.some(
        (item) =>
          item.status ===
            "planned" &&
          item.scheduled_for &&
          item.scheduled_for >=
            nowIso,
      );


    if (!hasFuture) {
      row.noFuture += 1;
    }


    row.noShows +=
      courseSessions.filter(
        (item) =>
          item.status ===
            "no_show" &&
          item.scheduled_for &&
          item.scheduled_for >=
            recentNoShowCutoff,
      ).length;


    row.homeworkReview +=
      homework.filter(
        (item) =>
          item.engagement_id ===
          engagement.id,
      ).length;


    row.requests +=
      requests.filter(
        (item) =>
          item.engagement_id ===
          engagement.id,
      ).length;


    const monthReports =
      reports.filter(
        (item) =>
          item.engagement_id ===
          engagement.id,
      );


    const published =
      monthReports.some(
        (item) =>
          Boolean(
            item.published_at ||
            item.student_visible,
          ),
      );


    if (!published) {
      row.reportsDue += 1;
    }
  }


  const rows =
    Array.from(
      healthByStudent.values(),
    )
      .map(
        (row) => {

          /*
           * Operational attention weighting:
           * - no upcoming lesson: 2
           * - submitted homework awaiting tutor review: 1
           * - open student request: 2
           * - current progress report due: 1
           * - recent no-show: 3
           */
          row.score =
            row.noFuture * 2 +
            row.homeworkReview +
            row.requests * 2 +
            row.reportsDue +
            row.noShows * 3;


          return row;
        },
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );


  const attentionRows =
    rows
      .filter(
        (row) =>
          row.score > 0,
      )
      .slice(
        0,
        12,
      );


  const totalNoFuture =
    rows.reduce(
      (sum, row) =>
        sum +
        row.noFuture,
      0,
    );


  const totalHomework =
    rows.reduce(
      (sum, row) =>
        sum +
        row.homeworkReview,
      0,
    );


  const totalRequests =
    rows.reduce(
      (sum, row) =>
        sum +
        row.requests,
      0,
    );


  const totalReports =
    rows.reduce(
      (sum, row) =>
        sum +
        row.reportsDue,
      0,
    );


  const totalNoShows =
    rows.reduce(
      (sum, row) =>
        sum +
        row.noShows,
      0,
    );


  function healthLabel(
    score: number,
  ) {
    if (score >= 6) {
      return "High attention";
    }

    if (score >= 3) {
      return "Needs attention";
    }

    return "Monitor";
  }


  return (
    <section
      className="admin-panel admin-student-health"
      aria-label="Student health"
    >

      <div className="admin-card-head">

        <div>

          <span className="admin-eyebrow">
            Delivery health
          </span>

          <h2>
            Student health
          </h2>

          <p>
            Students whose tutoring delivery may need an
            operational follow-up.
          </p>

        </div>


        <Link href="/admin/students">
          View students →
        </Link>

      </div>


      <div className="admin-health-metrics">

        <div>
          <span>
            Needs attention
          </span>

          <strong>
            {attentionRows.length}
          </strong>

          <small>
            Students flagged
          </small>
        </div>


        <div>
          <span>
            No future lesson
          </span>

          <strong>
            {totalNoFuture}
          </strong>

          <small>
            Active courses
          </small>
        </div>


        <div>
          <span>
            Homework review
          </span>

          <strong>
            {totalHomework}
          </strong>

          <small>
            Submitted
          </small>
        </div>


        <div>
          <span>
            Open requests
          </span>

          <strong>
            {totalRequests}
          </strong>

          <small>
            Student support
          </small>
        </div>


        <div>
          <span>
            Reports due
          </span>

          <strong>
            {totalReports}
          </strong>

          <small>
            Current month
          </small>
        </div>


        <div>
          <span>
            Recent no-shows
          </span>

          <strong>
            {totalNoShows}
          </strong>

          <small>
            Last 30 days
          </small>
        </div>

      </div>


      <div className="admin-health-list">

        {attentionRows.map(
          (row) => (
            <article
              className="admin-health-row"
              key={
                row.studentId
              }
            >

              <div className="admin-health-person">

                <strong>
                  {row.studentName}
                </strong>

                <span>
                  {row.studentEmail ||
                    "No email"}
                </span>

                <small>
                  {row.courses} active{" "}
                  {row.courses === 1
                    ? "course"
                    : "courses"}
                </small>

              </div>


              <div className="admin-health-signals">

                {row.noFuture > 0 && (
                  <span>
                    {row.noFuture} no future lesson
                  </span>
                )}


                {row.homeworkReview > 0 && (
                  <span>
                    {row.homeworkReview} homework review
                  </span>
                )}


                {row.requests > 0 && (
                  <span>
                    {row.requests} open request
                  </span>
                )}


                {row.reportsDue > 0 && (
                  <span>
                    {row.reportsDue} report due
                  </span>
                )}


                {row.noShows > 0 && (
                  <span className="is-risk">
                    {row.noShows} recent no-show
                  </span>
                )}

              </div>


              <div className="admin-health-action">

                <span
                  className={
                    row.score >= 6
                      ? "is-high"
                      : row.score >= 3
                        ? "is-attention"
                        : ""
                  }
                >
                  {
                    healthLabel(
                      row.score,
                    )
                  }
                </span>


                <Link
                  href={`/admin/students/${row.studentId}`}
                >
                  Open student →
                </Link>

              </div>

            </article>
          ),
        )}


        {!attentionRows.length && (
          <div className="admin-command-empty">
            No active students currently have delivery
            issues requiring attention.
          </div>
        )}

      </div>

    </section>
  );
}
