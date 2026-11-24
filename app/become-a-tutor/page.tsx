import type {
  Metadata,
} from "next";

import TutorApplicationForm from "@/components/TutorApplicationForm";

export const metadata: Metadata = {
  title: "Become a Tutor",
  description:
    "Apply to join My Academic Tutor as an online tutor. Share your subject expertise, teaching experience, references and qualification evidence.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">
            BECOME A TUTOR
          </div>

          <h1>
            Join a tutoring service
            built around subject
            expertise and teaching
            quality.
          </h1>

          <p className="page-lead">
            We are interested in tutors
            who can explain difficult
            ideas clearly, work
            responsibly and help
            students become more
            independent learners.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              WHAT WE LOOK FOR
            </div>

            <h2>
              Strong knowledge matters.
              Teaching it clearly
              matters too.
            </h2>

            <ul className="check-list">
              <li>
                Strong subject
                knowledge
              </li>
              <li>
                Relevant qualifications
                or professional
                expertise
              </li>
              <li>
                Clear communication and
                teaching ability
              </li>
              <li>
                Reliable availability
                for online tutoring
              </li>
              <li>
                A professional online
                teaching setup
              </li>
              <li>
                Commitment to academic
                integrity
              </li>
            </ul>
          </div>

          <div className="quote-card">
            <div className="eyebrow">
              APPLICATION PROCESS
            </div>

            <strong>
              Applications are reviewed
              before tutors join MAT.
            </strong>

            <p>
              We review your subject
              background, teaching
              experience, qualification
              evidence, two references
              and a short teaching
              demonstration.
            </p>

            <p>
              Approval is not automatic.
              Tutors are added to the
              teaching team only after
              the required checks are
              completed.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell narrow">
          <div className="section-copy-block">
            <div className="eyebrow">
              TUTOR APPLICATION
            </div>

            <h2>
              Apply to teach with
              My Academic Tutor
            </h2>

            <p>
              Complete the application
              below. Have your degree
              certificate, two referee
              contacts and teaching
              demonstration link ready
              before submitting.
            </p>
          </div>

          <div
            className="card form-card"
            style={{
              marginTop: 28,
            }}
          >
            <TutorApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
