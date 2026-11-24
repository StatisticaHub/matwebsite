import Link from "next/link";

import {
  updateSupportRequest,
} from "@/app/admin/portal-actions";

import {
  getAdminTimeZone,
} from "@/lib/admin-time-zone";

import {
  portalSupportStatuses,
} from "@/lib/student-portal";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  formatDateTimeInTimeZone,
} from "@/lib/time-zone";


export const metadata = {
  title: "Student requests",
};


export const dynamic =
  "force-dynamic";


type SearchParams =
  Promise<{
    status?: string;
    category?: string;
    q?: string;
  }>;


const categories = [
  "general",
  "lesson",
  "homework",
  "resource",
  "technical",
  "session_request",
] as const;


const categoryLabels:
  Record<string, string> = {
    general:
      "General",

    lesson:
      "Lesson",

    homework:
      "Homework",

    resource:
      "Resource",

    technical:
      "Technical",

    session_request:
      "Session request",
  };


function clean(
  value:
    | string
    | undefined,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase();
}


export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams:
    SearchParams;
}) {
  const params =
    await searchParams;


  const requestedStatus =
    portalSupportStatuses.includes(
      params.status as any,
    )
      ? params.status
      : "all";


  const requestedCategory =
    categories.includes(
      params.category as any,
    )
      ? params.category
      : "all";


  const search =
    clean(
      params.q,
    );


  const supabase =
    createAdminClient();


  const timeZone =
    await getAdminTimeZone();


  const {
    data:
      requestData,
    error:
      requestError,
  } =
    await supabase
      .from(
        "student_support_requests",
      )
      .select(`
        id,
        created_at,
        updated_at,
        student_id,
        engagement_id,
        category,
        message,
        status,
        admin_note,
        resolved_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        },
      )
      .limit(300);


  if (requestError) {
    throw new Error(
      requestError.message,
    );
  }


  const requests =
    (
      requestData ||
      []
    ) as any[];


  const studentIds =
    Array.from(
      new Set(
        requests
          .map(
            (item) =>
              item.student_id,
          )
          .filter(Boolean),
      ),
    );


  const engagementIds =
    Array.from(
      new Set(
        requests
          .map(
            (item) =>
              item.engagement_id,
          )
          .filter(Boolean),
      ),
    );


  const [
    studentResult,
    engagementResult,
  ] =
    await Promise.all([

      studentIds.length
        ? supabase
            .from(
              "students",
            )
            .select(
              "id,name,email,status",
            )
            .in(
              "id",
              studentIds,
            )

        : Promise.resolve({
            data: [],
            error: null,
          }),


      engagementIds.length
        ? supabase
            .from(
              "tutoring_engagements",
            )
            .select(
              "id,student_id,tutor_id,subject,title,status",
            )
            .in(
              "id",
              engagementIds,
            )

        : Promise.resolve({
            data: [],
            error: null,
          }),
    ]);


  if (
    studentResult.error
  ) {
    throw new Error(
      studentResult.error.message,
    );
  }


  if (
    engagementResult.error
  ) {
    throw new Error(
      engagementResult.error.message,
    );
  }


  const engagements =
    (
      engagementResult.data ||
      []
    ) as any[];


  const tutorIds =
    Array.from(
      new Set(
        engagements
          .map(
            (item) =>
              item.tutor_id,
          )
          .filter(Boolean),
      ),
    );


  const tutorResult =
    tutorIds.length
      ? await supabase
          .from(
            "tutors",
          )
          .select(
            "id,name,email",
          )
          .in(
            "id",
            tutorIds,
          )

      : {
          data: [],
          error: null,
        };


  if (tutorResult.error) {
    throw new Error(
      tutorResult.error.message,
    );
  }


  const students =
    new Map(
      (
        studentResult.data ||
        []
      ).map(
        (item: any) => [
          item.id,
          item,
        ],
      ),
    );


  const engagementById =
    new Map(
      engagements.map(
        (item: any) => [
          item.id,
          item,
        ],
      ),
    );


  const tutors =
    new Map(
      (
        tutorResult.data ||
        []
      ).map(
        (item: any) => [
          item.id,
          item,
        ],
      ),
    );


  const filtered =
    requests.filter(
      (item) => {

        if (
          requestedStatus !==
            "all" &&
          item.status !==
            requestedStatus
        ) {
          return false;
        }


        if (
          requestedCategory !==
            "all" &&
          item.category !==
            requestedCategory
        ) {
          return false;
        }


        if (!search) {
          return true;
        }


        const student =
          students.get(
            item.student_id,
          ) as any;


        const engagement =
          engagementById.get(
            item.engagement_id,
          ) as any;


        const haystack =
          [
            student?.name,
            student?.email,
            engagement?.subject,
            engagement?.title,
            item.category,
            item.message,
            item.admin_note,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return haystack.includes(
          search,
        );
      },
    );


  const countStatus = (
    status: string,
  ) =>
    requests.filter(
      (item) =>
        item.status ===
        status,
    ).length;


  const open =
    requests.filter(
      (item) =>
        [
          "new",
          "in_progress",
        ].includes(
          item.status,
        ),
    ).length;


  const sessionRequests =
    requests.filter(
      (item) =>
        item.category ===
          "session_request" &&
        [
          "new",
          "in_progress",
        ].includes(
          item.status,
        ),
    ).length;


  const otherSupport =
    open -
    sessionRequests;


  return (
    <div className="admin-page">

      <header className="admin-page-head">

        <div>

          <span className="admin-eyebrow">
            Student operations
          </span>

          <h1>
            Student requests
          </h1>

          <p>
            Manage lesson requests, homework questions,
            technical issues and other student support from
            one operational queue.
          </p>

        </div>

      </header>


      <section className="admin-stat-grid admin-request-stats">

        <article>
          <span>
            Open
          </span>

          <strong>
            {open}
          </strong>

          <small>
            New + in progress
          </small>
        </article>


        <article>
          <span>
            New
          </span>

          <strong>
            {countStatus(
              "new",
            )}
          </strong>

          <small>
            Awaiting review
          </small>
        </article>


        <article>
          <span>
            In progress
          </span>

          <strong>
            {countStatus(
              "in_progress",
            )}
          </strong>

          <small>
            Being handled
          </small>
        </article>


        <article>
          <span>
            Session
          </span>

          <strong>
            {sessionRequests}
          </strong>

          <small>
            Open lesson requests
          </small>
        </article>


        <article>
          <span>
            Other support
          </span>

          <strong>
            {otherSupport}
          </strong>

          <small>
            Open non-session requests
          </small>
        </article>


        <article>
          <span>
            Resolved
          </span>

          <strong>
            {countStatus(
              "resolved",
            )}
          </strong>

          <small>
            Completed requests
          </small>
        </article>

      </section>


      <section className="admin-panel">

        <div className="admin-toolbar admin-request-toolbar">

          <form
            className="admin-search"
            action="/admin/requests"
          >

            <input
              name="q"
              defaultValue={
                params.q ||
                ""
              }
              placeholder="Search student, email, subject or request"
            />


            {requestedStatus !==
              "all" && (
              <input
                type="hidden"
                name="status"
                value={
                  requestedStatus
                }
              />
            )}


            {requestedCategory !==
              "all" && (
              <input
                type="hidden"
                name="category"
                value={
                  requestedCategory
                }
              />
            )}


            <button type="submit">
              Search
            </button>

          </form>


          <div className="admin-request-filter-groups">

            <nav
              className="admin-filter-row"
              aria-label="Request status"
            >

              <Link
                className={
                  requestedStatus ===
                  "all"
                    ? "active"
                    : ""
                }
                href={`/admin/requests?category=${requestedCategory}`}
              >
                All
              </Link>


              {portalSupportStatuses.map(
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
                    href={`/admin/requests?status=${status}&category=${requestedCategory}`}
                  >
                    {status.replaceAll(
                      "_",
                      " ",
                    )}
                  </Link>
                ),
              )}

            </nav>


            <nav
              className="admin-filter-row"
              aria-label="Request category"
            >

              <Link
                className={
                  requestedCategory ===
                  "all"
                    ? "active"
                    : ""
                }
                href={`/admin/requests?status=${requestedStatus}`}
              >
                All types
              </Link>


              {categories.map(
                (category) => (
                  <Link
                    key={
                      category
                    }
                    className={
                      requestedCategory ===
                      category
                        ? "active"
                        : ""
                    }
                    href={`/admin/requests?status=${requestedStatus}&category=${category}`}
                  >
                    {
                      categoryLabels[
                        category
                      ]
                    }
                  </Link>
                ),
              )}

            </nav>

          </div>

        </div>


        <div className="admin-request-centre-list">

          {filtered.map(
            (item) => {

              const student =
                students.get(
                  item.student_id,
                ) as any;


              const engagement =
                engagementById.get(
                  item.engagement_id,
                ) as any;


              const tutor =
                engagement?.tutor_id
                  ? tutors.get(
                      engagement.tutor_id,
                    ) as any
                  : null;


              return (
                <article
                  className="admin-request-centre-card"
                  key={
                    item.id
                  }
                >

                  <div className="admin-request-centre-head">

                    <div>

                      <span className="admin-eyebrow">
                        {
                          categoryLabels[
                            item.category
                          ] ||
                          item.category.replaceAll(
                            "_",
                            " ",
                          )
                        }
                      </span>

                      <h2>
                        {student?.name ||
                          "Student"}
                      </h2>

                      <p>
                        {student?.email ||
                          "No student email"}
                      </p>

                    </div>


                    <span
                      className={`admin-request-status status-${item.status}`}
                    >
                      {item.status.replaceAll(
                        "_",
                        " ",
                      )}
                    </span>

                  </div>


                  <div className="admin-request-context">

                    <div>
                      <span>
                        Course
                      </span>

                      <strong>
                        {engagement?.subject ||
                          "General support"}
                      </strong>

                      <small>
                        {engagement?.title ||
                          "No course attached"}
                      </small>
                    </div>


                    <div>
                      <span>
                        Tutor
                      </span>

                      <strong>
                        {tutor?.name ||
                          "Not assigned"}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Received
                      </span>

                      <strong>
                        {formatDateTimeInTimeZone(
                          item.created_at,
                          timeZone,
                        )}
                      </strong>
                    </div>

                  </div>


                  <div className="admin-request-message">

                    <strong>
                      Student request
                    </strong>

                    <p>
                      {item.message}
                    </p>

                  </div>


                  {item.admin_note && (
                    <div className="admin-request-history">

                      <strong>
                        Internal history
                      </strong>

                      <pre>
                        {item.admin_note}
                      </pre>

                    </div>
                  )}


                  <form
                    action={
                      updateSupportRequest
                    }
                    className="admin-request-action-form"
                  >

                    <input
                      type="hidden"
                      name="requestId"
                      value={
                        item.id
                      }
                    />


                    <label>

                      <span>
                        Status
                      </span>

                      <select
                        name="status"
                        defaultValue={
                          item.status
                        }
                      >
                        {portalSupportStatuses.map(
                          (status) => (
                            <option
                              value={
                                status
                              }
                              key={
                                status
                              }
                            >
                              {status.replaceAll(
                                "_",
                                " ",
                              )}
                            </option>
                          ),
                        )}
                      </select>

                    </label>


                    <label className="admin-request-note-field">

                      <span>
                        Add internal note
                      </span>

                      <textarea
                        name="appendNote"
                        rows={3}
                        placeholder="Add an operational note. Students cannot see this."
                      />

                    </label>


                    <button
                      className="admin-primary-button"
                      type="submit"
                    >
                      Save request
                    </button>

                  </form>


                  <div className="admin-request-links">

                    {student && (
                      <Link
                        href={`/admin/students/${student.id}`}
                      >
                        Student record →
                      </Link>
                    )}


                    {item.category ===
                      "session_request" && (
                      <Link href="/admin/sessions">
                        Sessions →
                      </Link>
                    )}


                    {student && (
                      <Link
                        href={`/admin/portals?student=${student.id}`}
                      >
                        Portal →
                      </Link>
                    )}

                  </div>

                </article>
              );
            },
          )}


          {!filtered.length && (
            <div className="admin-empty">
              No student requests match these filters.
            </div>
          )}

        </div>

      </section>

    </div>
  );
}
