import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  convertTutorApplication,
  reviewTutorApplication,
  sendTutorReferenceRequest,
  updateTutorDocumentStatus,
  updateTutorReferenceStatus,
  updateTutorDemoReview,
} from "@/app/admin/tutor-application-actions";

export const metadata = {
  title: "Tutor applications",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  application?: string;
  saved?: string;
  error?: string;
}>;

function fmt(value: string | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function TutorApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const supabase = createAdminClient();

  const [
    applicationsResult,
    referencesResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from("tutor_applications")
      .select("*")
      .order("created_at", { ascending: false }),

    supabase
      .from("tutor_application_references")
      .select("*")
      .order("reference_number"),

    supabase
      .from("tutor_application_documents")
      .select("*")
      .order("created_at"),
  ]);

  if (applicationsResult.error) {
    throw new Error(applicationsResult.error.message);
  }

  if (referencesResult.error) {
    throw new Error(referencesResult.error.message);
  }

  if (documentsResult.error) {
    throw new Error(documentsResult.error.message);
  }

  const applications = applicationsResult.data || [];
  const references = referencesResult.data || [];
  const documents = documentsResult.data || [];

  const documentUrls = new Map<string, string>();

  await Promise.all(
    documents.map(async (document) => {
      const { data } = await supabase.storage
        .from(document.storage_bucket)
        .createSignedUrl(document.storage_path, 600);

      if (data?.signedUrl) {
        documentUrls.set(document.id, data.signedUrl);
      }
    }),
  );

  const selected =
    applications.find(
      (item) => item.id === query.application,
    ) ||
    applications.find((item) => item.status === "new") ||
    applications[0] ||
    null;

  const selectedReferences = selected
    ? references.filter(
        (item) => item.application_id === selected.id,
      )
    : [];

  const selectedDocuments = selected
    ? documents.filter(
        (item) => item.application_id === selected.id,
      )
    : [];

  const verifiedReferences = selectedReferences.filter(
    (item) => item.status === "verified",
  ).length;

  const verifiedCertificate = selectedDocuments.some(
    (item) =>
      item.document_type === "degree_certificate" &&
      item.verification_status === "verified",
  );

  const demoComplete = Boolean(
    selected?.demo_subject &&
      selected?.demo_level &&
      selected?.demo_topic &&
      selected?.demo_video_url,
  );

  const demoScores = [
    Number(selected.demo_subject_accuracy || 0),
    Number(selected.demo_explanation_clarity || 0),
    Number(selected.demo_teaching_structure || 0),
    Number(selected.demo_communication || 0),
    Number(selected.demo_professionalism || 0),
  ];

  const demoScoresComplete = demoScores.every(
    (score) => score >= 1 && score <= 5,
  );

  const demoAverage = demoScoresComplete
    ? demoScores.reduce((total, score) => total + score, 0) /
      demoScores.length
    : null;

  const demoSatisfactory =
    demoComplete &&
    demoScoresComplete &&
    selected.demo_review_status === "satisfactory";

  const ready =
    Boolean(selected) &&
    verifiedReferences >= 2 &&
    verifiedCertificate &&
    demoSatisfactory &&
    selected?.academic_integrity_confirmed === true;

  return (
    <div className="admin-page admin-tutor-applications-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">
            Tutor recruitment
          </span>

          <h1>Tutor applications</h1>

          <p>
            Review qualifications, references and teaching
            demonstrations before inviting applicants into tutor
            onboarding.
          </p>
        </div>
      </header>

      {query.saved === "1" && (
        <div className="admin-inline-message success">
          Application review updated.
        </div>
      )}

      {query.error === "requirements" && (
        <div className="admin-inline-message warning">
          This applicant cannot be converted yet. Verify a degree
          certificate and both references, and confirm the teaching
          demonstration is present.
        </div>
      )}

      {query.error === "duplicate" && (
        <div className="admin-inline-message warning">
          A tutor record already exists using this applicant's email
          address.
        </div>
      )}

      <div className="admin-tutor-layout">
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <h2>Applications</h2>
            <span>{applications.length} total</span>
          </div>

          <div className="admin-tutor-list">
            {applications.map((item) => (
              <article key={item.id}>
                <div className="admin-tutor-main">
                  <strong>{item.name}</strong>
                  <span>{item.email}</span>
                  <small>
                    {(item.subjects || []).join(" · ") ||
                      "Subjects not provided"}
                  </small>
                </div>

                <div className="admin-tutor-meta">
                  <span>{item.reference}</span>
                  <span>{fmt(item.created_at)}</span>
                  <span
                    className={`admin-status tutor-${item.status}`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="admin-tutor-actions">
                  <Link
                    className="admin-secondary-button"
                    href={`/admin/tutor-applications?application=${item.id}`}
                  >
                    Review
                  </Link>
                </div>
              </article>
            ))}

            {!applications.length && (
              <div className="admin-empty">
                No tutor applications have been received yet.
              </div>
            )}
          </div>
        </section>

        {selected && (
          <aside className="admin-stack">
            <section className="admin-panel admin-action-card">
              <span className="admin-eyebrow">
                {selected.reference}
              </span>

              <h2>{selected.name}</h2>

              <p>
                {selected.email}
                {selected.country
                  ? ` · ${selected.country}`
                  : ""}
              </p>

              <dl>
                <div>
                  <dt>Submitted</dt>
                  <dd>{fmt(selected.created_at)}</dd>
                </div>

                <div>
                  <dt>Status</dt>
                  <dd>{selected.status}</dd>
                </div>

                <div>
                  <dt>Subjects</dt>
                  <dd>
                    {(selected.subjects || []).join(", ") ||
                      "—"}
                  </dd>
                </div>

                <div>
                  <dt>Levels</dt>
                  <dd>
                    {(selected.levels || []).join(", ") ||
                      "—"}
                  </dd>
                </div>

                <div>
                  <dt>Languages</dt>
                  <dd>
                    {(selected.languages || []).join(", ") ||
                      "—"}
                  </dd>
                </div>

                <div>
                  <dt>Timezone</dt>
                  <dd>{selected.timezone || "—"}</dd>
                </div>
              </dl>
            </section>

            <section className="admin-panel admin-action-card">
              <h2>Applicant background</h2>

              <p>
                <strong>Qualifications</strong>
              </p>
              <p>{selected.qualifications}</p>

              <p>
                <strong>Teaching / professional experience</strong>
              </p>
              <p>{selected.teaching_experience}</p>

              <p>
                <strong>Specialisms</strong>
              </p>
              <p>
                {(selected.specialisms || []).join(", ") ||
                  "Not provided"}
              </p>

              <p>
                <strong>Availability</strong>
              </p>
              <p>{selected.availability || "—"}</p>

              <p>
                <strong>Online teaching setup</strong>
              </p>
              <p>{selected.online_teaching_setup || "—"}</p>

              <p>
                <strong>Motivation</strong>
              </p>
              <p>{selected.motivation || "—"}</p>
            </section>

            <section className="admin-panel admin-action-card">
              <div className="admin-card-head">
                <h2>Degree evidence</h2>

                <span>
                  {verifiedCertificate
                    ? "Verified"
                    : "Needs verification"}
                </span>
              </div>

              {selectedDocuments.map((document) => (
                <article key={document.id}>
                  <p>
                    <strong>{document.original_filename}</strong>
                  </p>

                  <p>
                    {document.mime_type || "Document"}
                    {document.size_bytes
                      ? ` · ${(
                          Number(document.size_bytes) /
                          1024 /
                          1024
                        ).toFixed(2)} MB`
                      : ""}
                  </p>

                  {documentUrls.get(document.id) && (
                    <p>
                      <a
                        href={documentUrls.get(document.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open certificate ↗
                      </a>
                    </p>
                  )}

                  <form
                    action={updateTutorDocumentStatus}
                    className="admin-onboarding-review-form"
                  >
                    <input
                      type="hidden"
                      name="documentId"
                      value={document.id}
                    />

                    <input
                      type="hidden"
                      name="applicationId"
                      value={selected.id}
                    />

                    <select
                      name="status"
                      defaultValue={
                        document.verification_status
                      }
                    >
                      <option value="submitted">
                        Submitted
                      </option>
                      <option value="verified">
                        Verified
                      </option>
                      <option value="rejected">
                        Rejected
                      </option>
                    </select>

                    <input
                      name="adminNotes"
                      defaultValue={
                        document.admin_notes || ""
                      }
                      placeholder="Document verification note"
                    />

                    <button type="submit">
                      Save document review
                    </button>
                  </form>
                </article>
              ))}

              {!selectedDocuments.length && (
                <div className="admin-empty compact">
                  No degree evidence uploaded.
                </div>
              )}
            </section>

            <section className="admin-panel admin-action-card">
              <div className="admin-card-head">
                <h2>References</h2>

                <span>
                  {verifiedReferences}/2 verified
                </span>
              </div>

              {selectedReferences.map((reference) => (
                <article key={reference.id}>
                  <p>
                    <strong>
                      Reference {reference.reference_number}:{" "}
                      {reference.name}
                    </strong>
                  </p>

                  <p>
                    {reference.email}
                    {reference.organisation
                      ? ` · ${reference.organisation}`
                      : ""}
                  </p>

                  <p>
                    Relationship: {reference.relationship}
                  </p>

                  {reference.phone && (
                    <p>Phone: {reference.phone}</p>
                  )}

                  <p>
                    <strong>Status:</strong>{" "}
                    {reference.status === "responded"
                      ? "Response received"
                      : reference.status}
                  </p>

                  {reference.request_sent_at && (
                    <p>
                      Request sent: {fmt(reference.request_sent_at)}
                    </p>
                  )}

                  {reference.responded_at && (
                    <p>
                      Response received: {fmt(reference.responded_at)}
                    </p>
                  )}

                  {reference.responded_at && (
                    <div className="admin-requirement">
                      <p>
                        <strong>Known applicant:</strong>{" "}
                        {reference.how_long_known || "—"}
                      </p>

                      <p>
                        <strong>Context:</strong>{" "}
                        {reference.relationship_context || "—"}
                      </p>

                      <p>
                        <strong>Reliability:</strong>{" "}
                        {reference.reliability_rating || "—"}/5
                      </p>

                      <p>
                        <strong>Communication:</strong>{" "}
                        {reference.communication_rating || "—"}/5
                      </p>

                      <p>
                        <strong>Subject competence:</strong>{" "}
                        {reference.subject_competence_rating || "—"}/5
                      </p>

                      <p>
                        <strong>Professionalism:</strong>{" "}
                        {reference.professionalism_rating || "—"}/5
                      </p>

                      <p>
                        <strong>Would recommend:</strong>{" "}
                        {reference.would_recommend === true
                          ? "Yes"
                          : reference.would_recommend === false
                            ? "No"
                            : "—"}
                      </p>

                      {reference.concerns && (
                        <p>
                          <strong>Concerns:</strong>{" "}
                          {reference.concerns}
                        </p>
                      )}

                      {reference.referee_comments && (
                        <p>
                          <strong>Comments:</strong>{" "}
                          {reference.referee_comments}
                        </p>
                      )}
                    </div>
                  )}

                  {reference.status !== "verified" &&
                    reference.status !== "responded" && (
                    <form
                      action={sendTutorReferenceRequest}
                      style={{ marginBottom: 12 }}
                    >
                      <input
                        type="hidden"
                        name="referenceId"
                        value={reference.id}
                      />

                      <input
                        type="hidden"
                        name="applicationId"
                        value={selected.id}
                      />

                      <button
                        className="admin-secondary-button"
                        type="submit"
                      >
                        {reference.request_sent_at
                          ? "Resend reference request"
                          : "Send reference request"}
                      </button>
                    </form>
                  )}

                  <form
                    action={updateTutorReferenceStatus}
                    className="admin-onboarding-review-form"
                  >
                    <input
                      type="hidden"
                      name="referenceId"
                      value={reference.id}
                    />

                    <input
                      type="hidden"
                      name="applicationId"
                      value={selected.id}
                    />

                    <select
                      name="status"
                      defaultValue={reference.status}
                    >
                      <option value="provided">
                        Provided
                      </option>
                      <option value="contacted">
                        Contacted
                      </option>
                      <option value="responded">
                        Response received
                      </option>
                      <option value="verified">
                        Verified
                      </option>
                      <option value="unresponsive">
                        Unresponsive
                      </option>
                      <option value="concern">
                        Concern
                      </option>
                    </select>

                    <input
                      name="adminNotes"
                      defaultValue={
                        reference.admin_notes || ""
                      }
                      placeholder="Reference verification note"
                    />

                    <button type="submit">
                      Save reference review
                    </button>
                  </form>
                </article>
              ))}
            </section>

            <section className="admin-panel admin-action-card">
              <div className="admin-card-head">
                <div>
                  <span className="admin-eyebrow">
                    Quality assessment
                  </span>
                  <h2>Teaching demonstration</h2>
                </div>

                <span>
                  {!demoComplete
                    ? "Incomplete"
                    : demoSatisfactory
                      ? `Satisfactory · ${demoAverage?.toFixed(1)}/5`
                      : selected.demo_review_status === "rejected"
                        ? "Rejected"
                        : selected.demo_review_status === "needs_review"
                          ? "Needs review"
                          : "Awaiting review"}
                </span>
              </div>

              <dl>
                <div>
                  <dt>Subject</dt>
                  <dd>{selected.demo_subject || "—"}</dd>
                </div>

                <div>
                  <dt>Level</dt>
                  <dd>{selected.demo_level || "—"}</dd>
                </div>

                <div>
                  <dt>Topic</dt>
                  <dd>{selected.demo_topic || "—"}</dd>
                </div>
              </dl>

              {selected.demo_video_url && (
                <p>
                  <a
                    href={selected.demo_video_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Watch teaching demo ↗
                  </a>
                </p>
              )}

              {selected.demo_notes && (
                <div className="admin-requirement">
                  <strong>Applicant notes</strong>
                  <p>{selected.demo_notes}</p>
                </div>
              )}

              {demoAverage !== null && (
                <div
                  className={
                    demoSatisfactory
                      ? "admin-inline-message success"
                      : "admin-inline-message"
                  }
                >
                  Demo assessment average:{" "}
                  <strong>{demoAverage.toFixed(1)}/5</strong>
                </div>
              )}

              <form
                action={updateTutorDemoReview}
                className="admin-compact-form"
              >
                <input
                  type="hidden"
                  name="applicationId"
                  value={selected.id}
                />

                <div className="admin-form-grid-2">
                  <label>
                    <span>Subject accuracy *</span>
                    <select
                      name="demoSubjectAccuracy"
                      required
                      defaultValue={
                        selected.demo_subject_accuracy ?? ""
                      }
                    >
                      <option value="" disabled>
                        Select score
                      </option>
                      <option value="1">1 — Poor</option>
                      <option value="2">2 — Weak</option>
                      <option value="3">3 — Satisfactory</option>
                      <option value="4">4 — Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </label>

                  <label>
                    <span>Explanation clarity *</span>
                    <select
                      name="demoExplanationClarity"
                      required
                      defaultValue={
                        selected.demo_explanation_clarity ?? ""
                      }
                    >
                      <option value="" disabled>
                        Select score
                      </option>
                      <option value="1">1 — Poor</option>
                      <option value="2">2 — Weak</option>
                      <option value="3">3 — Satisfactory</option>
                      <option value="4">4 — Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </label>

                  <label>
                    <span>Teaching structure *</span>
                    <select
                      name="demoTeachingStructure"
                      required
                      defaultValue={
                        selected.demo_teaching_structure ?? ""
                      }
                    >
                      <option value="" disabled>
                        Select score
                      </option>
                      <option value="1">1 — Poor</option>
                      <option value="2">2 — Weak</option>
                      <option value="3">3 — Satisfactory</option>
                      <option value="4">4 — Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </label>

                  <label>
                    <span>Communication *</span>
                    <select
                      name="demoCommunication"
                      required
                      defaultValue={
                        selected.demo_communication ?? ""
                      }
                    >
                      <option value="" disabled>
                        Select score
                      </option>
                      <option value="1">1 — Poor</option>
                      <option value="2">2 — Weak</option>
                      <option value="3">3 — Satisfactory</option>
                      <option value="4">4 — Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </label>

                  <label>
                    <span>Professionalism *</span>
                    <select
                      name="demoProfessionalism"
                      required
                      defaultValue={
                        selected.demo_professionalism ?? ""
                      }
                    >
                      <option value="" disabled>
                        Select score
                      </option>
                      <option value="1">1 — Poor</option>
                      <option value="2">2 — Weak</option>
                      <option value="3">3 — Satisfactory</option>
                      <option value="4">4 — Good</option>
                      <option value="5">5 — Excellent</option>
                    </select>
                  </label>

                  <label>
                    <span>Overall decision *</span>
                    <select
                      name="demoReviewStatus"
                      required
                      defaultValue={
                        selected.demo_review_status &&
                        selected.demo_review_status !== "not_reviewed"
                          ? selected.demo_review_status
                          : ""
                      }
                    >
                      <option value="" disabled>
                        Select decision
                      </option>
                      <option value="needs_review">
                        Needs further review
                      </option>
                      <option value="satisfactory">
                        Satisfactory
                      </option>
                      <option value="rejected">
                        Unsatisfactory
                      </option>
                    </select>
                  </label>
                </div>

                <label>
                  <span>Demo review notes</span>
                  <textarea
                    name="demoReviewNotes"
                    defaultValue={
                      selected.demo_review_notes || ""
                    }
                    placeholder="Strengths, weaknesses, teaching observations or reasons for the decision..."
                  />
                </label>

                <button
                  className="admin-secondary-button"
                  type="submit"
                  disabled={!demoComplete}
                >
                  Save teaching demo review
                </button>
              </form>
            </section>

            <section className="admin-panel admin-action-card admin-application-readiness">
              <div className="admin-action-card-head">
                <div>
                  <div className="admin-readiness-eyebrow">
                    APPROVAL READINESS
                  </div>

                  <h2>
                    {selected.status === "rejected"
                      ? "Application rejected"
                      : ready
                        ? "Ready to approve"
                        : "Checks still required"}
                  </h2>
                </div>

                <span
                  className={
                    selected.status === "rejected"
                      ? "admin-readiness-status is-rejected"
                      : ready
                        ? "admin-readiness-status is-ready"
                        : "admin-readiness-status is-pending"
                  }
                >
                  {selected.status === "rejected"
                    ? "REJECTED"
                    : ready
                      ? "READY"
                      : "IN REVIEW"}
                </span>
              </div>

              <p className="admin-readiness-intro">
                {selected.status === "rejected"
                  ? "This application is currently closed as rejected. The checks below remain visible as part of the review record."
                  : "Complete every required quality check before converting this applicant into a tutor."}
              </p>

              <div className="admin-readiness-list">
                <div
                  className={
                    verifiedCertificate
                      ? "admin-readiness-item is-complete"
                      : "admin-readiness-item is-missing"
                  }
                >
                  <span className="admin-readiness-icon">
                    {verifiedCertificate ? "✓" : "!"}
                  </span>

                  <div>
                    <strong>Degree certificate</strong>
                    <p>
                      {verifiedCertificate
                        ? "Qualification evidence verified."
                        : "Certificate still needs verification."}
                    </p>
                  </div>
                </div>

                <div
                  className={
                    verifiedReferences >= 2
                      ? "admin-readiness-item is-complete"
                      : "admin-readiness-item is-missing"
                  }
                >
                  <span className="admin-readiness-icon">
                    {verifiedReferences >= 2 ? "✓" : "!"}
                  </span>

                  <div>
                    <strong>References</strong>
                    <p>
                      {verifiedReferences >= 2
                        ? "Both references verified."
                        : `${verifiedReferences}/2 references verified.`}
                    </p>
                  </div>
                </div>

                <div
                  className={
                    demoComplete
                      ? "admin-readiness-item is-complete"
                      : "admin-readiness-item is-missing"
                  }
                >
                  <span className="admin-readiness-icon">
                    {demoComplete ? "✓" : "!"}
                  </span>

                  <div>
                    <strong>Teaching demonstration</strong>
                    <p>
                      {demoComplete
                        ? "Teaching demo evidence submitted."
                        : "Teaching demo submission is incomplete."}
                    </p>
                  </div>
                </div>

                <div
                  className={
                    demoSatisfactory
                      ? "admin-readiness-item is-complete"
                      : "admin-readiness-item is-missing"
                  }
                >
                  <span className="admin-readiness-icon">
                    {demoSatisfactory ? "✓" : "!"}
                  </span>

                  <div>
                    <strong>Teaching review</strong>
                    <p>
                      {demoSatisfactory
                        ? "Demo reviewed as satisfactory."
                        : "Demo still needs a satisfactory review."}
                    </p>
                  </div>
                </div>

                <div
                  className={
                    selected.academic_integrity_confirmed
                      ? "admin-readiness-item is-complete"
                      : "admin-readiness-item is-missing"
                  }
                >
                  <span className="admin-readiness-icon">
                    {selected.academic_integrity_confirmed ? "✓" : "!"}
                  </span>

                  <div>
                    <strong>Academic integrity</strong>
                    <p>
                      {selected.academic_integrity_confirmed
                        ? "Applicant confirmed the MAT academic-integrity standard."
                        : "Academic-integrity confirmation is missing."}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="admin-panel admin-action-card admin-application-decision">
              <h2>Application decision</h2>

              <div
                className={
                  ready
                    ? "admin-inline-message success"
                    : "admin-inline-message warning"
                }
              >
                {selected.status === "rejected"
                  ? "This application has been rejected. Reopen the review if you want to assess the applicant again."
                  : ready
                    ? "All mandatory quality checks are complete. This applicant can now be converted into a pending tutor."
                    : "Approval remains locked until every readiness check above is complete."}
              </div>

              {selected.status === "converted" &&
              selected.converted_tutor_id ? (
                <Link
                  className="admin-primary-button"
                  href={`/admin/tutors/${selected.converted_tutor_id}`}
                >
                  Open tutor record →
                </Link>
              ) : selected.status === "rejected" ? (
                <form
                  action={reviewTutorApplication}
                  className="admin-onboarding-review-form"
                >
                  <input
                    type="hidden"
                    name="applicationId"
                    value={selected.id}
                  />

                  <input
                    name="adminNotes"
                    defaultValue={selected.admin_notes || ""}
                    placeholder="Reason for reopening or internal review note"
                  />

                  <button
                    className="admin-secondary-button"
                    type="submit"
                    name="decision"
                    value="reviewing"
                  >
                    Reopen review
                  </button>
                </form>
              ) : (
                <>
                  <form
                    action={reviewTutorApplication}
                    className="admin-onboarding-review-form"
                  >
                    <input
                      type="hidden"
                      name="applicationId"
                      value={selected.id}
                    />

                    <input
                      name="adminNotes"
                      defaultValue={
                        selected.admin_notes || ""
                      }
                      placeholder="Internal application note"
                    />

                    <button
                      type="submit"
                      name="decision"
                      value="reviewing"
                    >
                      Mark reviewing
                    </button>

                    <button
                      type="submit"
                      name="decision"
                      value="rejected"
                      className="admin-danger-button"
                    >
                      Reject
                    </button>
                  </form>

                  <form
                    action={convertTutorApplication}
                    style={{ marginTop: 14 }}
                  >
                    <input
                      type="hidden"
                      name="applicationId"
                      value={selected.id}
                    />

                    <button
                      className="admin-primary-button"
                      type="submit"
                      disabled={!ready}
                    >
                      Approve & create pending tutor
                    </button>
                  </form>

                  <p className="admin-help">
                    After conversion, open the tutor record and
                    send their portal/onboarding invitation using
                    the existing Tutor Portal controls.
                  </p>
                </>
              )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}
