import Link from "next/link";

import {
  referralCodeFromUtmContent,
  resolveReferringStudent,
} from "@/lib/referrals";

export default async function AdminLeadReferralContext({
  utmContent,
}: {
  utmContent:
    | string
    | null
    | undefined;
}) {
  const code =
    referralCodeFromUtmContent(
      utmContent,
    );

  if (!code) {
    return null;
  }

  const student =
    await resolveReferringStudent(
      code,
    );

  if (!student) {
    return (
      <section className="admin-panel admin-lead-referral-context">
        <span className="admin-eyebrow">
          Student referral
        </span>

        <h2>
          Referral code {code}
        </h2>

        <p>
          This enquiry arrived through a
          MAT student referral link, but the
          referring student could not be
          resolved.
        </p>
      </section>
    );
  }

  return (
    <section className="admin-panel admin-lead-referral-context">
      <div>
        <span className="admin-eyebrow">
          Student referral
        </span>

        <h2>
          Referred by {student.name}
        </h2>

        <p>
          Referral code {code}. The new
          student submitted their tutoring
          request through this student&apos;s
          personal MAT referral link.
        </p>
      </div>

      <Link
        className="admin-secondary-button"
        href={`/admin/students/${student.id}`}
      >
        Open referring student →
      </Link>
    </section>
  );
}
