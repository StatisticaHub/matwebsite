import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "Tutor Matching & Standards",
  description:
    "Learn how My Academic Tutor matches students with suitable tutors based on subject, academic level, learning needs and practical fit.",
};


export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">

        <div className="shell narrow">

          <div className="eyebrow">
            TUTOR MATCHING & STANDARDS
          </div>

          <h1>
            The right tutor is about academic fit, not browsing a directory.
          </h1>

          <p className="page-lead">
            Tell us what you are studying, where you are finding difficulty and
            what you want to achieve. We review the academic context and arrange
            suitable one-to-one tutoring around your requirements.
          </p>

          <div className="trust-row">
            <span>Matched to subject and level</span>
            <span>Live one-to-one teaching</span>
            <span>Price confirmed before booking</span>
            <span>No obligation to proceed</span>
          </div>

        </div>

      </section>


      <section className="section">

        <div className="shell">

          <div className="section-head">

            <div>

              <div className="eyebrow">
                WHAT WE LOOK FOR
              </div>

              <h2>
                Strong subject knowledge is only part of good tutoring.
              </h2>

              <p className="section-intro">
                A suitable tutor should be able to teach the required material
                at the right academic depth, communicate clearly and adapt the
                lesson when a student needs a different explanation.
              </p>

            </div>

          </div>


          <div className="standard-grid">

            <article>

              <h2>
                Subject depth
              </h2>

              <p>
                The tutor should be comfortable with the specific topic,
                module and academic level being supported, rather than only
                having broad familiarity with the subject.
              </p>

            </article>


            <article>

              <h2>
                Teaching clarity
              </h2>

              <p>
                Knowing a subject is not enough. Good tutoring requires clear
                explanations, useful questions, worked examples, guided
                practice and the ability to explain an idea differently when
                needed.
              </p>

            </article>


            <article>

              <h2>
                Academic fit
              </h2>

              <p>
                We consider the student's course level, current topic, goals,
                type of support required and any relevant software, technical
                or research-method needs.
              </p>

            </article>


            <article>

              <h2>
                Professional reliability
              </h2>

              <p>
                Preparation, communication, punctuality and respect for agreed
                boundaries are part of a reliable tutoring service.
              </p>

            </article>

          </div>

        </div>

      </section>


      <section className="section section-soft">

        <div className="shell">

          <div className="conversion-section-head">

            <div className="eyebrow">
              HOW MATCHING WORKS
            </div>

            <h2>
              Start with what you need help with.
            </h2>

            <p>
              You do not need to search through public tutor profiles. We use
              your enquiry to identify what kind of teaching support would be
              appropriate.
            </p>

          </div>


          <div className="conversion-journey">

            <article>

              <span>1</span>

              <h3>
                Tell us the academic need
              </h3>

              <p>
                Share the subject, academic level, topic, goal and anything
                important about the difficulty you are facing.
              </p>

            </article>


            <article>

              <span>2</span>

              <h3>
                We review the requirements
              </h3>

              <p>
                We consider the required subject depth, teaching need,
                availability and practical fit.
              </p>

            </article>


            <article>

              <span>3</span>

              <h3>
                We arrange suitable support
              </h3>

              <p>
                We identify a suitable tutoring arrangement and confirm the
                proposed support and price privately before you decide.
              </p>

            </article>


            <article>

              <span>4</span>

              <h3>
                Build continuity
              </h3>

              <p>
                If you continue, sessions can follow your course, current
                priorities and progress over time.
              </p>

            </article>

          </div>


          <div className="center-cta">

            <Link
              className="button button-primary button-large"
              href="/find-a-tutor"
            >
              Request personalised tutoring
            </Link>

          </div>

        </div>

      </section>


      <section className="section">

        <div className="shell two-col">

          <div>

            <div className="eyebrow">
              ACADEMIC RESPONSIBILITY
            </div>

            <h2>
              Tutoring should strengthen the student's own ability.
            </h2>

            <p>
              Tutors can explain concepts, demonstrate methods, work through
              examples, question reasoning and provide guided practice.
            </p>

            <p>
              Assessed work, examinations, dissertations and other academic
              submissions must remain the student's own work.
            </p>

            <Link
              className="text-link"
              href="/academic-integrity"
            >
              Read our academic integrity approach →
            </Link>

          </div>


          <div className="quote-card">

            <div className="eyebrow">
              BEFORE YOU BOOK
            </div>

            <strong>
              You decide after the proposed support and price are clear.
            </strong>

            <p>
              Sending an enquiry does not commit you to tutoring. We review
              what you need first and confirm the next step before any lesson
              is arranged.
            </p>

          </div>

        </div>

      </section>
    </>
  );
}
