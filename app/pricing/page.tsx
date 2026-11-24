import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Online Tutoring Prices",
  description:
    "One-to-one online tutoring with My Academic Tutor starts from £20 an hour. Your exact rate is confirmed before you book.",
};


export default function PricingPage() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">TUTORING PRICES</div>

          <h1>
            Clear pricing before you book.
          </h1>

          <p className="page-lead">
            One-to-one tutoring starts from £20 an hour. Your exact rate depends
            on the subject, academic level and specialist support you need, and
            is confirmed before you decide whether to proceed.
          </p>

          <div className="tutoring-price-note">
            <span>ONE-TO-ONE TUTORING FROM</span>

            <strong>
              £20 an hour
            </strong>

            <p>
              There is no obligation to book after sending an enquiry.
            </p>
          </div>

          <div className="trust-row">
            <span>Price confirmed before booking</span>
            <span>One-off or ongoing support</span>
            <span>Online worldwide</span>
            <span>No obligation to enquire</span>
          </div>
        </div>
      </section>


      <section className="section">
        <div className="shell narrow">
          <div className="section-head">
            <div className="eyebrow">HOW PRICING WORKS</div>

            <h2>
              Your rate is based on the tutoring you actually need.
            </h2>

            <p>
              We do not use one fixed price for every learner because the level
              of teaching and specialist expertise required can vary substantially
              between subjects and courses.
            </p>
          </div>


          <div className="feature-grid">
            <article className="card">
              <h3>
                Subject and level
              </h3>

              <p>
                School-level tutoring, undergraduate modules and advanced
                postgraduate or research topics may require different levels of
                specialist expertise.
              </p>
            </article>


            <article className="card">
              <h3>
                Specialist requirements
              </h3>

              <p>
                Support involving specialist areas such as medical statistics,
                econometrics, programming or particular statistical software may
                require a tutor with more specific experience.
              </p>
            </article>


            <article className="card">
              <h3>
                Tutoring arrangement
              </h3>

              <p>
                You can ask for a one-off lesson, short-term support around a
                difficult topic, or regular ongoing tutoring.
              </p>
            </article>
          </div>
        </div>
      </section>


      <section className="section section-soft">
        <div className="shell narrow">
          <div className="section-head">
            <div className="eyebrow">BEFORE YOU BOOK</div>

            <h2>
              You see the proposed support and price first.
            </h2>
          </div>


          <div className="conversion-journey">
            <article>
              <span>1</span>

              <h3>
                Tell us what you need
              </h3>

              <p>
                Send us the subject, course level, topic and any useful deadline
                or learning context.
              </p>
            </article>


            <article>
              <span>2</span>

              <h3>
                We review the request
              </h3>

              <p>
                We identify a suitable tutor and the type of support that fits
                your academic need.
              </p>
            </article>


            <article>
              <span>3</span>

              <h3>
                You decide
              </h3>

              <p>
                We confirm the tutor, proposed next step and exact price before
                you decide whether to book.
              </p>
            </article>
          </div>
        </div>
      </section>


      <section className="section">
        <div className="shell narrow">
          <div className="quote-card">
            <div className="eyebrow">REQUEST TUTORING</div>

            <strong>
              Not sure what kind of support you need?
            </strong>

            <p>
              Tell us what you are studying and where you are stuck. We will
              review the request and confirm the proposed tutor and price before
              you make any booking.
            </p>

            <p>
              <Link href="/find-a-tutor">
                Request tutoring →
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
