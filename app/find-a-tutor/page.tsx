import type { Metadata } from "next";

import ConversionProofBar from "@/components/ConversionProofBar";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import TutoringSupportOptions from "@/components/TutoringSupportOptions";

export const metadata: Metadata = {
  title: "Request Online Tutoring",
  description:
    "Tell us what you are studying and where you are stuck. We will read your request, match you with a suitable tutor and confirm the price before you book.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero conversion-request-hero">
        <div className="shell narrow">
          <div className="eyebrow">REQUEST TUTORING</div>

          <h1>
            Tell us what you’re studying and where you’re stuck.
          </h1>

          <p className="page-lead">
            Tell us the subject, level and problem you want help with. We’ll
            review the request, match it to a suitable tutor and confirm the
            price before you decide.
          </p>

          <div className="tutoring-price-note">
            <span>ONE-TO-ONE TUTORING FROM</span>
            <strong>£20 an hour</strong>
            <p>
              The exact rate depends on your subject, course level and any specialist
              requirements. Tell us what you need help with and we’ll confirm
              the price before you book.
            </p>
          </div>

          <div className="trust-row">
            <span>No obligation</span>
            <span>School to postgraduate</span>
            <span>Live 1:1 tutoring</span>
            <span>Online worldwide</span>
          </div>
        </div>
      </section>

      <ConversionProofBar />

      {/* ================================================================
          TUTORING SUPPORT CHOICE
         ================================================================ */}

      <TutoringSupportOptions ctaHref="#tutoring-enquiry" />

      {/* ================================================================
          TUTORING ENQUIRY FORM
         ================================================================ */}

      <section
        id="tutoring-enquiry"
        className="section section-soft conversion-request-form-section"
      >
        <div className="shell narrow">
          <div className="card form-card form-card-large conversion-request-card">
            <div className="form-intro">
              <div className="eyebrow">WHAT DO YOU NEED HELP WITH?</div>

              <h2>Start with the course, topic or problem.</h2>

              <p>
                You do not need to choose from a tutor directory. Tell us what
                you’re working on, what is difficult and what you want to achieve,
                and we’ll take it from there.
              </p>

              <div
                className="conversion-form-reassurance"
                aria-label="Enquiry reassurance"
              >
                <span>No booking until you agree</span>
                <span>Read by our team</span>
                <span>Your assessed work stays yours</span>
              </div>
            </div>

            <TutoringLeadForm />
          </div>
        </div>
      </section>

      {/* ================================================================
          WHAT HAPPENS NEXT
         ================================================================ */}

      <section className="section conversion-next-steps">
        <div className="shell narrow">
          <div className="conversion-section-head">
            <div className="eyebrow">WHAT HAPPENS NEXT</div>

            <h2>Sending an enquiry does not book a lesson.</h2>

            <p>
              We use the information you send to understand the academic need
              before suggesting the next step.
            </p>
          </div>

          <div className="conversion-journey">
            <article>
              <span>1</span>

              <h3>We read your request</h3>

              <p>
                We look at the subject, level, topic, goal and availability so we
                know what kind of tutor would fit.
              </p>
            </article>

            <article>
              <span>2</span>

              <h3>We suggest a tutor</h3>

              <p>
                We identify a suitable available tutor and confirm the proposed
                session format and price.
              </p>
            </article>

            <article>
              <span>3</span>

              <h3>You decide whether to proceed</h3>

              <p>
                You see the tutor, price and next step before deciding whether
                to book.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
