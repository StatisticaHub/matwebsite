import Link from "next/link";

import {
  referralCodeForStudentId,
  referralUtmContent,
  referralUrlForStudentId,
} from "@/lib/referrals";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export default async function AdminStudentReferralSummary({
  studentId,
}: {
  studentId: string;
}) {
  const code =
    referralCodeForStudentId(
      studentId,
    );

  const referralContent =
    referralUtmContent(code);

  const referralUrl =
    referralUrlForStudentId(
      studentId,
    );

  const supabase =
    createAdminClient();

  const {
    data: leadData,
    error: leadError,
  } = await supabase
    .from("tutoring_leads")
    .select(
      "id,reference,name,status,created_at",
    )
    .eq(
      "utm_content",
      referralContent,
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    )
    .limit(100);

  if (leadError) {
    console.error(
      "Could not load student referrals",
      leadError.message,
    );
  }

  const leads =
    leadData || [];

  const leadIds =
    leads.map(
      (lead) => lead.id,
    );

  let convertedLeadIds =
    new Set<string>();

  if (leadIds.length) {
    const {
      data: studentData,
      error: studentError,
    } = await supabase
      .from("students")
      .select(
        "source_lead_id",
      )
      .in(
        "source_lead_id",
        leadIds,
      );

    if (studentError) {
      console.error(
        "Could not load referral conversions",
        studentError.message,
      );
    } else {
      convertedLeadIds =
        new Set(
          (studentData || [])
            .map(
              (student) =>
                student.source_lead_id,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            ),
        );
    }
  }

  return (
    <section className="admin-panel admin-student-referral-panel">
      <div className="admin-card-head">
        <div>
          <span className="admin-eyebrow">
            Referrals
          </span>

          <h2>
            Student referral activity
          </h2>
        </div>

        <span>
          {leads.length} enquiries
        </span>
      </div>

      <div className="admin-referral-overview">
        <article>
          <span>
            Referral code
          </span>

          <strong>
            {code}
          </strong>
        </article>

        <article>
          <span>
            Enquiries
          </span>

          <strong>
            {leads.length}
          </strong>
        </article>

        <article>
          <span>
            Converted
          </span>

          <strong>
            {
              convertedLeadIds.size
            }
          </strong>
        </article>
      </div>

      <div className="admin-referral-link">
        <span>
          Personal referral link
        </span>

        <code>
          {referralUrl}
        </code>
      </div>

      {leads.length ? (
        <div className="admin-referral-lead-list">
          {leads
            .slice(0, 8)
            .map(
              (lead) => (
                <Link
                  key={lead.id}
                  href={`/admin/leads/${lead.id}`}
                >
                  <div>
                    <strong>
                      {lead.name}
                    </strong>

                    <small>
                      {lead.reference}
                    </small>
                  </div>

                  <span>
                    {
                      convertedLeadIds.has(
                        lead.id,
                      )
                        ? "Converted"
                        : lead.status
                    }
                  </span>
                </Link>
              ),
            )}
        </div>
      ) : (
        <p className="admin-muted">
          No tutoring enquiries have
          arrived through this student&apos;s
          referral link yet.
        </p>
      )}
    </section>
  );
}
