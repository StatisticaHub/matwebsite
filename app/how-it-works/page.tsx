import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "How Tutoring Works",
  description:
    "See how personalised one-to-one tutoring works with My Academic Tutor, from your first enquiry through tutor matching, lessons and ongoing progress.",
};


export default function Page() {

  const steps = [
    [
      "Tell us what you are learning",
      "Share your subject, academic level, module or topic, current difficulty and goal.",
    ],
    [
      "We review your request",
      "We look at the subject, course level, topic, teaching need and availability so we can identify suitable support.",
    ],
    [
      "We arrange suitable one-to-one tutoring",
      "We confirm the proposed tutoring arrangement and exact price before you decide whether to proceed.",
    ],
    [
      "Begin from the problem in front of you",
      "The first session can use the context you shared so more time can be spent understanding the material that is causing difficulty.",
    ],
    [
      "Learn through explanation and practice",
      "Your tutor can explain, question, demonstrate, provide guided practice and check whether you can use the method independently.",
    ],
    [
      "Build continuity as you progress",
      "The focus can move with your module, exams, software needs, research project or changing learning priorities.",
    ],
  ];


  return (
    <>
      <section className="page-hero compact-hero">

        <div className="shell narrow">

          <div className="eyebrow">
            HOW TUTORING WORKS
          </div>

          <h1>
            From academic difficulty to structured one-to-one learning.
          </h1>

          <p className="page-lead">
            Start with what you are trying to understand. We review your
            requirements, arrange suitable support and confirm the price
            before you decide whether to proceed.
          </p>

          <div className="trust-row">
            <span>No public profile searching</span>
            <span>Matched to the academic need</span>
            <span>From £20/hour</span>
            <span>No obligation to proceed</span>
          </div>

        </div>

      </section>


      <section className="section">

        <div className="shell narrow">

          <div className="timeline">

            {steps.map(
              (step, index) => (
                <div key={step[0]}>

                  <strong>
                    {index + 1}
                  </strong>

                  <section>

                    <h2>
                      {step[0]}
                    </h2>

                    <p>
                      {step[1]}
                    </p>

                  </section>

                </div>
              ),
            )}

          </div>


          <div className="center-cta">

            <Link
              className="button button-primary button-large"
              href="/find-a-tutor"
            >
              Request tutoring
            </Link>

          </div>

        </div>

      </section>
    </>
  );
}
