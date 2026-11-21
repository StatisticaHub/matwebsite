import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "How Tutoring Works" };

export default function Page() {
  const steps = [
    ["Tell us what you are learning", "Share your subject, academic level, module or topic, current difficulty and goal."],
    ["We read your request", "We look at the subject, course level, topic and availability so we can match you with a tutor who fits."],
    ["We arrange suitable 1:1 teaching", "You receive a clear next step for starting tutoring with someone able to support the work at your level."],
    ["Begin from the problem in front of you", "The first session uses the context you shared so time can be spent on understanding rather than repeating background."],
    ["Learn through explanation and practice", "Your tutor explains, questions, demonstrates, gives guided practice and checks whether the method is becoming independent."],
    ["Adapt the support as you progress", "The focus can move with your module, exams, software needs, research project or changing confidence."],
  ];

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">HOW TUTORING WORKS</div>
          <h1>From academic difficulty to structured one-to-one learning.</h1>
          <p className="page-lead">Start with what you are trying to understand. We organise the support around your level, course and goal, then the teaching adapts as you progress.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell narrow">
          <div className="timeline">
            {steps.map((step, index) => (
              <div key={step[0]}>
                <strong>{index + 1}</strong>
                <section><h2>{step[0]}</h2><p>{step[1]}</p></section>
              </div>
            ))}
          </div>
          <div className="center-cta"><Link className="button button-primary button-large" href="/find-a-tutor">Get personalised tutoring</Link></div>
        </div>
      </section>
    </>
  );
}
