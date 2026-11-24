import Link from "next/link";
import AdminCommandCentre from "@/components/AdminCommandCentre";
import AdminStudentHealth from "@/components/AdminStudentHealth";
import AdminTutorHealth from "@/components/AdminTutorHealth";
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
            Operations overview
          </h1>

          <p>
            See what needs attention across enquiries,
            tutoring delivery, student requests and tutor
            recruitment, then work through the lead pipeline
            below.
          </p>
        </div>
      </header>

      <AdminCommandCentre />

      <AdminStudentHealth />

      <AdminTutorHealth />


      


      


      


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
                    }
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
