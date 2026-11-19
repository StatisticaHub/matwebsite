import type { Metadata } from "next";
import TutoringLeadForm from "@/components/TutoringLeadForm";

import ConversionProofBar from "@/components/ConversionProofBar";
export const metadata: Metadata = {
  title: "Get Personalised Tutoring",
  description: "Tell My Academic Tutor what you are studying, where you need help and what you want to achieve. We will arrange suitable one-to-one academic support.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">GET PERSONALISED TUTORING</div>
          <h1>Tell us what you are studying and where you are getting stuck.</h1>
          <p className="page-lead">Share your course, academic level, topic and goal. Our team will review the academic context and arrange suitable one-to-one support.</p>
          <div className="trust-row">
            <span>School to postgraduate</span>
            <span>Live 1:1 teaching</span>
            <span>Online worldwide</span>
          </div>
        </div>
      </section>

      <ConversionProofBar />

      <section className="section">
        <div className="shell narrow">
          <div className="conversion-section-head">
            <div className="eyebrow">WHAT HAPPENS NEXT</div>
            <h2>A tutoring request is a starting point, not a commitment.</h2>
            <p>We use the information you send to understand the academic need before suggesting the next step.</p>
          </div>
          <div className="conversion-journey">
            <article><span>1</span><h3>We review the context</h3><p>Subject, level, topic, goals and availability are checked so the request is understood properly.</p></article>
            <article><span>2</span><h3>We arrange suitable support</h3><p>We identify the most appropriate available tutor or learning route for the request.</p></article>
            <article><span>3</span><h3>You decide whether to proceed</h3><p>The proposed support is made clear before ongoing tutoring begins.</p></article>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell narrow">
          <div className="card form-card form-card-large">
            <div className="form-intro">
              <div className="eyebrow">YOUR LEARNING REQUIREMENTS</div>
              <h2>Give us the academic context.</h2>
              <p>Describe what you are studying, what you currently understand, where the difficulty starts and what you want tutoring to help you achieve. You do not need to know what kind of tutor to search for.</p>
            </div>
            <TutoringLeadForm />
          </div>
        </div>
      </section>
    </>
  );
}
