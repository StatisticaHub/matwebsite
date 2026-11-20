import type { Metadata } from "next";

import ConversionProofBar from "@/components/ConversionProofBar";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import TutoringSupportOptions from "@/components/TutoringSupportOptions";

export const metadata: Metadata = {
  title: "Request Personalised Tutoring",
  description:
    "Tell My Academic Tutor what you are studying, where you need help and what you want to achieve. We will review the request and arrange suitable one-to-one academic support.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero conversion-request-hero">
        <div className="shell narrow">
          <div className="eyebrow">REQUEST PERSONALISED TUTORING</div>

          <h1>
            Tell us what you are studying and where you are getting stuck.
          </h1>

          <p className="page-lead">
            Share the subject, academic level and problem you want to solve. We
            review the academic context first, then arrange suitable one-to-one
            support.
          </p>

          <div className="trust-row">
            <span>No obligation</span>
            <span>School to postgraduate</span>
            <span>Live 1:1 teaching</span>
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
              <div className="eyebrow">YOUR LEARNING REQUIREMENTS</div>

              <h2>Start with the academic problem.</h2>

              <p>
                You do not need to search tutor profiles or know the exact type
                of support you need. Give us enough context to understand the
                problem and we will review the fit.
              </p>

              <div
                className="conversion-form-reassurance"
                aria-label="Enquiry reassurance"
              >
                <span>No booking commitment</span>
                <span>Reviewed by our team</span>
                <span>Your academic work stays yours</span>
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

            <h2>A tutoring request is a starting point, not a commitment.</h2>

            <p>
              We use the information you send to understand the academic need
              before suggesting the next step.
            </p>
          </div>

          <div className="conversion-journey">
            <article>
              <span>1</span>

              <h3>We review the context</h3>

              <p>
                Subject, level, topic, goals and availability are checked so
                the request is understood properly.
              </p>
            </article>

            <article>
              <span>2</span>

              <h3>We arrange suitable support</h3>

              <p>
                We identify the most appropriate available tutor or learning
                route for the request.
              </p>
            </article>

            <article>
              <span>3</span>

              <h3>You decide whether to proceed</h3>

              <p>
                The proposed support is made clear before ongoing tutoring
                begins.
              </p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}