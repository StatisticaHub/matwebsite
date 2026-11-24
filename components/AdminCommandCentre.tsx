import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function AdminCommandCentre() {
  const supabase = createAdminClient();

  const now = new Date();
  const nowIso = now.toISOString();

  const sevenDays = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    newLeadsResult,
    activeStudentsResult,
    sessionsResult,
    supportResult,
    sessionRequestsResult,
    applicationsResult,
    onboardingResult,
  ] = await Promise.all([
    supabase
      .from("tutoring_leads")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "new"),

    supabase
      .from("students")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("tutoring_sessions")
      .select(
        "id,scheduled_for,duration_minutes,topic,status,session_tutor:tutors(name),tutoring_engagements(subject,students(name))",
        {
          count: "exact",
        },
      )
      .eq("status", "planned")
      .gte("scheduled_for", nowIso)
      .lte("scheduled_for", sevenDays)
      .order("scheduled_for", {
        ascending: true,
      })
      .limit(6),

    supabase
      .from("student_support_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", ["new", "in_progress"]),

    supabase
      .from("student_support_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("category", "session_request")
      .in("status", ["new", "in_progress"]),

    supabase
      .from("tutor_applications")
      .select(
        "id,reference,name,email,subjects,status,created_at",
        {
          count: "exact",
        },
      )
      .in("status", ["new", "reviewing"])
      .order("created_at", {
        ascending: false,
      })
      .limit(5),

    supabase
      .from("tutors")
      .select(
        "id,name,email,onboarding_status,onboarding_submitted_at",
        {
          count: "exact",
        },
      )
      .eq("status", "pending")
      .eq("onboarding_status", "submitted")
      .order("onboarding_submitted_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(5),
  ]);

  const newLeads =
    newLeadsResult.error ? 0 : newLeadsResult.count || 0;

  const activeStudents =
    activeStudentsResult.error
      ? 0
      : activeStudentsResult.count || 0;

  const upcomingSessions =
    sessionsResult.error
      ? []
      : ((sessionsResult.data || []) as any[]);

  const upcomingSessionCount =
    sessionsResult.error ? 0 : sessionsResult.count || 0;

  const totalSupport =
    supportResult.error ? 0 : supportResult.count || 0;

  const sessionRequests =
    sessionRequestsResult.error
      ? 0
      : sessionRequestsResult.count || 0;

  const generalSupport = Math.max(
    totalSupport - sessionRequests,
    0,
  );

  const applications =
    applicationsResult.error
      ? []
      : ((applicationsResult.data || []) as any[]);

  const applicationCount =
    applicationsResult.error
      ? 0
      : applicationsResult.count || 0;

  const onboarding =
    onboardingResult.error
      ? []
      : ((onboardingResult.data || []) as any[]);

  const onboardingCount =
    onboardingResult.error
      ? 0
      : onboardingResult.count || 0;

  return (
    <section
      className="admin-command-centre"
      aria-label="Operations overview"
    >
      <div className="admin-command-metrics">
        <Link
          href="/admin?status=new"
          className={
            newLeads > 0
              ? "admin-command-metric is-attention"
              : "admin-command-metric"
          }
        >
          <span>New enquiries</span>
          <strong>{newLeads}</strong>
          <small>Awaiting first review</small>
        </Link>

        <Link
          href="/admin/students"
          className="admin-command-metric"
        >
          <span>Active students</span>
          <strong>{activeStudents}</strong>
          <small>Currently in tutoring</small>
        </Link>

        <Link
          href="/admin/sessions"
          className="admin-command-metric"
        >
          <span>Next 7 days</span>
          <strong>{upcomingSessionCount}</strong>
          <small>Planned sessions</small>
        </Link>

        <Link
          href="/admin/requests"
          className={
            totalSupport > 0
              ? "admin-command-metric is-attention"
              : "admin-command-metric"
          }
        >
          <span>Open requests</span>
          <strong>{totalSupport}</strong>
          <small>
            {sessionRequests} session · {generalSupport} support
          </small>
        </Link>

        <Link
          href="/admin/tutor-applications"
          className={
            applicationCount > 0
              ? "admin-command-metric is-attention"
              : "admin-command-metric"
          }
        >
          <span>Tutor applications</span>
          <strong>{applicationCount}</strong>
          <small>New or under review</small>
        </Link>

        <Link
          href="/admin/tutors"
          className={
            onboardingCount > 0
              ? "admin-command-metric is-attention"
              : "admin-command-metric"
          }
        >
          <span>Tutor reviews</span>
          <strong>{onboardingCount}</strong>
          <small>Onboarding submitted</small>
        </Link>
      </div>

      <div className="admin-command-grid">
        <section className="admin-panel admin-command-panel">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Teaching schedule
              </span>

              <h2>Next sessions</h2>

              <p>
                The next planned lessons across the tutoring
                operation.
              </p>
            </div>

            <Link href="/admin/sessions">
              View all →
            </Link>
          </div>

          <div className="admin-command-list">
            {upcomingSessions.map((session) => {
              const engagement =
                session.tutoring_engagements;

              const student =
                engagement?.students?.name ||
                "Student";

              const subject =
                engagement?.subject ||
                "Tutoring";

              const tutor =
                session.session_tutor?.name ||
                "Tutor not assigned";

              return (
                <Link
                  key={session.id}
                  href={`/admin/sessions/${session.id}`}
                  className="admin-command-row"
                >
                  <div className="admin-command-date">
                    <strong>
                      {formatDateTime(
                        session.scheduled_for,
                      )}
                    </strong>

                    <span>
                      {session.duration_minutes} min
                    </span>
                  </div>

                  <div className="admin-command-copy">
                    <strong>
                      {session.topic ||
                        "Tutoring session"}
                    </strong>

                    <span>
                      {student} · {subject}
                    </span>

                    <small>{tutor}</small>
                  </div>

                  <b>→</b>
                </Link>
              );
            })}

            {!upcomingSessions.length && (
              <div className="admin-command-empty">
                No sessions are currently planned for the
                next seven days.
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel admin-command-panel">
          <div className="admin-card-head">
            <div>
              <span className="admin-eyebrow">
                Tutor recruitment
              </span>

              <h2>Recruitment queue</h2>

              <p>
                Applications and tutor profiles waiting for
                review.
              </p>
            </div>

            <Link href="/admin/tutor-applications">
              Applications →
            </Link>
          </div>

          <div className="admin-command-subsection">
            <div className="admin-command-subhead">
              <strong>Applications</strong>
              <span>{applicationCount}</span>
            </div>

            <div className="admin-command-list compact">
              {applications.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/tutor-applications?application=${item.id}`}
                  className="admin-command-row"
                >
                  <div className="admin-command-copy">
                    <strong>{item.name}</strong>

                    <span>
                      {(item.subjects || [])
                        .slice(0, 3)
                        .join(" · ") ||
                        item.email}
                    </span>

                    <small>
                      {item.reference} ·{" "}
                      {item.status}
                    </small>
                  </div>

                  <b>→</b>
                </Link>
              ))}

              {!applications.length && (
                <div className="admin-command-empty compact">
                  No applications need review.
                </div>
              )}
            </div>
          </div>

          <div className="admin-command-subsection">
            <div className="admin-command-subhead">
              <strong>Onboarding submitted</strong>
              <span>{onboardingCount}</span>
            </div>

            <div className="admin-command-list compact">
              {onboarding.slice(0, 3).map((tutor) => (
                <Link
                  key={tutor.id}
                  href={`/admin/tutors/${tutor.id}`}
                  className="admin-command-row"
                >
                  <div className="admin-command-copy">
                    <strong>{tutor.name}</strong>
                    <span>{tutor.email}</span>
                    <small>
                      Ready for MAT review
                    </small>
                  </div>

                  <b>→</b>
                </Link>
              ))}

              {!onboarding.length && (
                <div className="admin-command-empty compact">
                  No tutor onboarding profiles are waiting.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <nav
        className="admin-quick-actions"
        aria-label="Admin quick actions"
      >
        <Link href="/admin/follow-ups">
          <span>Daily queue</span>
          <small>Follow-ups & trials</small>
        </Link>

        <Link href="/admin/matching">
          <span>Tutor matching</span>
          <small>Match open enquiries</small>
        </Link>

        <Link href="/admin/onboarding">
          <span>Student onboarding</span>
          <small>Prepare new learners</small>
        </Link>

        <Link href="/admin/system-health">
          <span>System health</span>
          <small>Check operational issues</small>
        </Link>
      </nav>
    </section>
  );
}
