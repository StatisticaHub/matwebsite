import type { Metadata } from "next";
import TutorApplicationForm from "@/components/TutorApplicationForm";

export const metadata: Metadata = {
  title: "Become a Tutor",
  description:
    "Apply to join My Academic Tutor. Tutors are reviewed for subject knowledge, qualifications, references and teaching ability.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">BECOME A TUTOR</div>

          <h1>
            Join a tutoring network built around subject expertise and
            teaching quality.
          </h1>

          <p className="page-lead">
            We review every tutor before they can work with students.
            Applications include qualification evidence, two references and
            a short teaching demonstration.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">OUR TUTOR STANDARD</div>
            <h2>What we look for</h2>

            <ul className="check-list">
              <li>Strong and current subject knowledge</li>
              <li>Relevant academic qualifications</li>
              <li>Clear explanations and teaching ability</li>
              <li>Two academic or professional referees</li>
              <li>A short teaching demonstration</li>
              <li>Reliable availability and online teaching setup</li>
              <li>Commitment to academic integrity</li>
            </ul>

            <h3>How applications work</h3>

            <ol>
              <li>Submit your application and degree evidence.</li>
              <li>Provide two referees.</li>
              <li>Submit a short recorded teaching demonstration.</li>
              <li>The MAT team reviews and verifies your application.</li>
              <li>
                Successful applicants are invited to complete tutor
                onboarding.
              </li>
              <li>
                Tutors are activated for student matching only after the
                review process is complete.
              </li>
            </ol>
          </div>

          <div className="card form-card">
            <TutorApplicationForm />
          </div>
        </div>
      </section>
    </>
  );
}
