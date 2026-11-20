import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  leadStatusLabels,
  leadStatuses,
  type LeadStatus,
  type TutoringLead,
} from "@/lib/admin-data";

export const metadata = {
  title: "Lead inbox",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
  q?: string;
}>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const requestedStatus = leadStatuses.includes(
    params.status as LeadStatus
  )
    ? (params.status as LeadStatus)
    : null;

  const search = (params.q || "").trim();

  const supabase = createAdminClient();

  const now = new Date();
  const nowIso = now.toISOString();

  const [
    leadCountResult,
    activeStudentsResult,
    upcomingSessionsResult,
    openSupportResult,
    openSessionRequestResult,
  ] = await Promise.all([
    supabase
      .from("tutoring_leads")
      .select(
        "id,status,next_follow_up_at,trial_status,trial_scheduled_for"
      ),

    supabase
      .from("students")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("tutoring_sessions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "planned")
      .gte("scheduled_for", nowIso),

    supabase
      .from("student_support_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", [
        "new",
        "in_progress",
      ]),

    supabase
      .from("student_support_requests")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "category",
        "session_request"
      )
      .in("status", [
        "new",
        "in_progress",
      ]),
  ]);

  if (leadCountResult.error) {
    throw new Error(
      leadCountResult.error.message
    );
  }

  if (activeStudentsResult.error) {
    throw new Error(
      activeStudentsResult.error.message
    );
  }

  if (upcomingSessionsResult.error) {
    throw new Error(
      upcomingSessionsResult.error.message
    );
  }

  if (openSupportResult.error) {
    throw new Error(
      openSupportResult.error.message
    );
  }

  if (openSessionRequestResult.error) {
    throw new Error(
      openSessionRequestResult.error.message
    );
  }

  const allLeads =
    leadCountResult.data || [];

  const activeStudents =
    activeStudentsResult.count || 0;

  const upcomingSessions =
    upcomingSessionsResult.count || 0;

  const openSupportTotal =
    openSupportResult.count || 0;

  const openSessionRequests =
    openSessionRequestResult.count || 0;

  /*
   * Session requests are also stored in student_support_requests.
   * Subtract them here so the generic support count does not double-count.
   */
  const openGeneralSupport =
    Math.max(
      openSupportTotal -
        openSessionRequests,
      0
    );

  const counts = Object.fromEntries(
    leadStatuses.map(
      (status) => [
        status,
        0,
      ]
    )
  ) as Record<
    LeadStatus,
    number
  >;

  for (const lead of allLeads) {
    if (lead.status in counts) {
      counts[
        lead.status as LeadStatus
      ] += 1;
    }
  }

  const todayKey =
    ukDateKey(now);

  const operationalLeads =
    allLeads as Array<{
      status: LeadStatus;
      next_follow_up_at:
        | string
        | null;
      trial_status:
        | string
        | null;
      trial_scheduled_for:
        | string
        | null;
    }>;

  const activePipeline =
    operationalLeads.filter(
      (lead) =>
        ![
          "closed",
          "lost",
        ].includes(
          lead.status
        )
    );

  const overdueFollowUps =
    activePipeline.filter(
      (lead) =>
        lead.next_follow_up_at &&
        new Date(
          lead.next_follow_up_at
        ) < now &&
        ukDateKey(
          new Date(
            lead.next_follow_up_at
          )
        ) !== todayKey
    ).length;

  const dueToday =
    activePipeline.filter(
      (lead) =>
        lead.next_follow_up_at &&
        ukDateKey(
          new Date(
            lead.next_follow_up_at
          )
        ) === todayKey
    ).length;

  const upcomingTrials =
    activePipeline.filter(
      (lead) =>
        lead.trial_status ===
          "scheduled" &&
        lead.trial_scheduled_for &&
        new Date(
          lead.trial_scheduled_for
        ) >= now
    ).length;

  let query = supabase
    .from("tutoring_leads")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false,
      }
    )
    .limit(100);

  if (requestedStatus) {
    query =
      query.eq(
        "status",
        requestedStatus
      );
  }

  if (search) {
    const escaped =
      search.replaceAll(
        ",",
        " "
      );

    query =
      query.or(
        `name.ilike.%${escaped}%,email.ilike.%${escaped}%,subject.ilike.%${escaped}%,reference.ilike.%${escaped}%`
      );
  }

  const {
    data,
    error,
  } = await query;

  if (error) {
    throw new Error(
      error.message
    );
  }

  const leads =
    (data ||
      []) as TutoringLead[];

  return (
    <div className="admin-page">

      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">
            Tutoring operations
          </span>

          <h1>
            Lead inbox
          </h1>

          <p>
            Review new tutoring
            enquiries, track matching
            progress and move students
            towards a first lesson.
          </p>
        </div>
      </header>


      {/* ================================================================
          FOLLOW-UP ACTION CENTRE
         ================================================================ */}

      <section
        className="admin-action-centre"
        aria-label="Follow-up action centre"
      >

        <Link
          className={
            overdueFollowUps
              ? "urgent"
              : ""
          }
          href="/admin/follow-ups"
        >
          <span>
            Overdue follow-ups
          </span>

          <strong>
            {overdueFollowUps}
          </strong>

          <small>
            {overdueFollowUps
              ? "Needs attention"
              : "Nothing overdue"}
          </small>
        </Link>


        <Link href="/admin/follow-ups">
          <span>
            Due today
          </span>

          <strong>
            {dueToday}
          </strong>

          <small>
            Scheduled student
            contacts
          </small>
        </Link>


        <Link href="/admin/follow-ups">
          <span>
            Upcoming trials
          </span>

          <strong>
            {upcomingTrials}
          </strong>

          <small>
            Trial sessions scheduled
          </small>
        </Link>


        <Link
          className="open-queue"
          href="/admin/follow-ups"
        >
          <span>
            Daily queue
          </span>

          <strong>
            →
          </strong>

          <small>
            Open follow-ups & trials
          </small>
        </Link>

      </section>


      {/* ================================================================
          DELIVERY ATTENTION CENTRE
         ================================================================ */}

      <section
        className="admin-action-centre"
        aria-label="Tutoring delivery attention centre"
      >

        <Link
          className={
            openSessionRequests
              ? "urgent"
              : ""
          }
          href="/admin/sessions#session-requests"
        >
          <span>
            Session requests
          </span>

          <strong>
            {
              openSessionRequests
            }
          </strong>

          <small>
            {openSessionRequests
              ? "Review student requests"
              : "No requests waiting"}
          </small>
        </Link>


        <Link
          className={
            openGeneralSupport
              ? "urgent"
              : ""
          }
          href="/admin/portals"
        >
          <span>
            Open support requests
          </span>

          <strong>
            {
              openGeneralSupport
            }
          </strong>

          <small>
            {openGeneralSupport
              ? "Student questions need review"
              : "No support waiting"}
          </small>
        </Link>


        <Link href="/admin/sessions">
          <span>
            Upcoming sessions
          </span>

          <strong>
            {
              upcomingSessions
            }
          </strong>

          <small>
            Planned tutoring sessions
          </small>
        </Link>


        <Link
          className="open-queue"
          href="/admin/sessions"
        >
          <span>
            Delivery queue
          </span>

          <strong>
            →
          </strong>

          <small>
            Open sessions & requests
          </small>
        </Link>

      </section>


      {/* ================================================================
          LEAD PIPELINE METRICS
         ================================================================ */}

      <section className="admin-metrics">

        <div>
          <span>
            New
          </span>

          <strong>
            {counts.new}
          </strong>
        </div>


        <div>
          <span>
            Matching
          </span>

          <strong>
            {counts.matching}
          </strong>
        </div>


        <div>
          <span>
            Assigned
          </span>

          <strong>
            {
              counts.tutor_assigned
            }
          </strong>
        </div>


        <div>
          <span>
            Booked
          </span>

          <strong>
            {counts.booked}
          </strong>
        </div>


        <div>
          <span>
            Ongoing
          </span>

          <strong>
            {counts.ongoing}
          </strong>
        </div>

      </section>


      {/* ================================================================
          DELIVERY SUMMARY
         ================================================================ */}

      <section className="admin-ops-strip">

        <div>
          <span>
            Delivery
          </span>

          <strong>
            {activeStudents} active
            students
          </strong>

          <small>
            {upcomingSessions} upcoming
            sessions
          </small>
        </div>


        <Link href="/admin/students">
          Manage students →
        </Link>


        <Link href="/admin/sessions">
          View sessions →
        </Link>

      </section>


      {/* ================================================================
          LEAD INBOX
         ================================================================ */}

      <section className="admin-panel">

        <div className="admin-toolbar">

          <form
            className="admin-search"
            action="/admin"
          >
            <input
              name="q"
              defaultValue={
                search
              }
              placeholder="Search name, email, subject or reference"
            />

            {requestedStatus && (
              <input
                type="hidden"
                name="status"
                value={
                  requestedStatus
                }
              />
            )}

            <button type="submit">
              Search
            </button>
          </form>


          <nav
            className="admin-filter-row"
            aria-label="Lead filters"
          >

            <Link
              className={
                !requestedStatus
                  ? "active"
                  : ""
              }
              href="/admin"
            >
              All
            </Link>


            {leadStatuses
              .slice(
                0,
                6
              )
              .map(
                (status) => (
                  <Link
                    key={
                      status
                    }
                    className={
                      requestedStatus ===
                      status
                        ? "active"
                        : ""
                    }
                    href={`/admin?status=${status}`}
                  >
                    {
                      leadStatusLabels[
                        status
                      ]
                    }{" "}
                    <span>
                      {
                        counts[
                          status
                        ]
                      }
                    </span>
                  </Link>
                )
              )}

          </nav>

        </div>


        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>
                  Student
                </th>

                <th>
                  Request
                </th>

                <th>
                  Status
                </th>

                <th>
                  Timing
                </th>

                <th>
                  Received
                </th>

                <th />
              </tr>
            </thead>


            <tbody>

              {leads.map(
                (lead) => (
                  <tr
                    key={
                      lead.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          lead.name
                        }
                      </strong>

                      <span>
                        {
                          lead.email
                        }
                      </span>

                      <small>
                        {
                          lead.reference
                        }
                      </small>
                    </td>


                    <td>
                      <strong>
                        {
                          lead.subject
                        }
                      </strong>

                      <span>
                        {
                          lead.level
                        }
                      </span>

                      <small>
                        {lead.topic ||
                          lead.support_type}
                      </small>
                    </td>


                    <td>
                      <span
                        className={`admin-status status-${lead.status}`}
                      >
                        {
                          leadStatusLabels[
                            lead.status
                          ]
                        }
                      </span>
                    </td>


                    <td>
                      <span>
                        {lead.urgency ||
                          "Flexible"}
                      </span>

                      <small>
                        {lead.availability ||
                          "No preference"}
                      </small>
                    </td>


                    <td>
                      <span>
                        {formatDate(
                          lead.created_at
                        )}
                      </span>

                      <small>
                        {
                          lead.country
                        }
                      </small>
                    </td>


                    <td>
                      <Link
                        className="admin-row-link"
                        href={`/admin/leads/${lead.id}`}
                      >
                        Open →
                      </Link>
                    </td>

                  </tr>
                )
              )}


              {!leads.length && (
                <tr>
                  <td
                    colSpan={
                      6
                    }
                  >
                    <div className="admin-empty">
                      No leads match
                      this view.
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
