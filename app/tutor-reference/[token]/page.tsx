import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitTutorReference } from "./actions";

export const metadata: Metadata = {
  title: "Tutor Reference",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function TutorReferencePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{
    submitted?: string;
    error?: string;
  }>;
}) {
  const { token } = await params;
  const query = await searchParams;

  if (!/^[0-9a-f-]{36}$/i.test(token)) {
    notFound();
  }

  const supabase = createAdminClient();

  const { data: reference, error } = await supabase
    .from("tutor_application_references")
    .select(`
      id,
      name,
      relationship,
      organisation,
      status,
      request_sent_at,
      tutor_applications (
        name,
        reference,
        subjects,
        levels
      )
    `)
    .eq("request_token", token)
    .maybeSingle();

  if (
    error ||
    !reference ||
    !reference.request_sent_at
  ) {
    notFound();
  }

  const application =
    reference.tutor_applications as unknown as {
      name: string;
      reference: string;
      subjects: string[];
      levels: string[];
    } | null;

  const alreadySubmitted =
    reference.status === "responded" ||
    reference.status === "verified" ||
    query.submitted === "1";

  return (
    <main className="page-hero compact-hero">
      <div
        className="shell narrow"
        style={{ paddingBottom: 64 }}
      >
        <div className="eyebrow">
          TUTOR REFERENCE
        </div>

        <h1>
          Reference for {application?.name || "a tutor applicant"}
        </h1>

        <p className="page-lead">
          Thank you for helping My Academic Tutor assess the
          applicant's suitability for one-to-one teaching.
        </p>

        {alreadySubmitted ? (
          <div className="card form-card">
            <h2>Reference received</h2>

            <p>
              Thank you. Your confidential reference has been
              submitted to the My Academic Tutor review team.
            </p>

            <p>
              Application reference:{" "}
              <strong>
                {application?.reference || "—"}
              </strong>
            </p>

            <Link href="/" className="button button-secondary">
              My Academic Tutor
            </Link>
          </div>
        ) : (
          <div className="card form-card">
            <p>
              You were named as an academic or professional
              referee by{" "}
              <strong>
                {application?.name || "the applicant"}
              </strong>.
            </p>

            {application?.subjects?.length ? (
              <p>
                Proposed subjects:{" "}
                <strong>
                  {application.subjects.join(", ")}
                </strong>
              </p>
            ) : null}

            {query.error === "incomplete" && (
              <p className="form-error">
                Please complete all required questions before
                submitting.
              </p>
            )}

            <form
              action={submitTutorReference}
              className="portal-form"
            >
              <input
                type="hidden"
                name="token"
                value={token}
              />

              <label>
                <span>
                  How long have you known the applicant? *
                </span>
                <input
                  name="howLongKnown"
                  required
                  placeholder="For example: 2 years"
                />
              </label>

              <label>
                <span>
                  In what capacity have you known or worked with
                  them? *
                </span>
                <textarea
                  name="relationshipContext"
                  required
                  maxLength={3000}
                  placeholder="For example: dissertation supervisor, line manager, lecturer..."
                />
              </label>

              <label>
                <span>Reliability and dependability *</span>
                <select
                  name="reliabilityRating"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select rating
                  </option>
                  <option value="1">1 — Poor</option>
                  <option value="2">2 — Below expectations</option>
                  <option value="3">3 — Satisfactory</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Excellent</option>
                </select>
              </label>

              <label>
                <span>Communication skills *</span>
                <select
                  name="communicationRating"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select rating
                  </option>
                  <option value="1">1 — Poor</option>
                  <option value="2">2 — Below expectations</option>
                  <option value="3">3 — Satisfactory</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Excellent</option>
                </select>
              </label>

              <label>
                <span>
                  Subject / technical competence *
                </span>
                <select
                  name="subjectCompetenceRating"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select rating
                  </option>
                  <option value="1">1 — Poor</option>
                  <option value="2">2 — Below expectations</option>
                  <option value="3">3 — Satisfactory</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Excellent</option>
                </select>
              </label>

              <label>
                <span>Professionalism *</span>
                <select
                  name="professionalismRating"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select rating
                  </option>
                  <option value="1">1 — Poor</option>
                  <option value="2">2 — Below expectations</option>
                  <option value="3">3 — Satisfactory</option>
                  <option value="4">4 — Good</option>
                  <option value="5">5 — Excellent</option>
                </select>
              </label>

              <label>
                <span>
                  Would you recommend this person for tutoring or
                  teaching work? *
                </span>
                <select
                  name="wouldRecommend"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label>
                <span>
                  Any concerns we should be aware of?
                </span>
                <textarea
                  name="concerns"
                  maxLength={3000}
                />
              </label>

              <label>
                <span>
                  Additional comments
                </span>
                <textarea
                  name="comments"
                  maxLength={5000}
                />
              </label>

              <label className="tutor-check-single">
                <input
                  type="checkbox"
                  name="declaration"
                  value="yes"
                  required
                />

                <span>
                  I confirm that this reference is based on my own
                  knowledge of the applicant and is accurate to the
                  best of my knowledge.
                </span>
              </label>

              <button
                className="button button-primary"
                type="submit"
              >
                Submit confidential reference
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
