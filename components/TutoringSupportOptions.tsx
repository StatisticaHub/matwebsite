import Link from "next/link";

import styles from "./TutoringSupportOptions.module.css";

type TutoringSupportOptionsProps = {
  ctaHref?: string;
};

const supportOptions = [
  {
    number: "01",
    label: "Focused session",
    title: "Get help with one specific learning blocker.",
    description:
      "Best when you already know what you are stuck on and want a tutor to explain it clearly in a focused session.",
    examples: [
      "A difficult concept or method",
      "A coding or software problem",
      "Interpreting an analysis or result",
    ],
  },
  {
    number: "02",
    label: "Short-term support",
    title: "Work towards a clear academic goal.",
    description:
      "Useful when you need several sessions around an exam, module, project, dissertation stage or another defined learning goal.",
    examples: [
      "Exam or assessment preparation",
      "A challenging university module",
      "Project or dissertation support",
    ],
  },
  {
    number: "03",
    label: "Ongoing tutoring",
    title: "Build understanding over time.",
    description:
      "Designed for students who want regular personalised teaching, continuity with one tutor and steady progress across a subject.",
    examples: [
      "Weekly or recurring sessions",
      "Long-term subject support",
      "Structured skill development",
    ],
  },
];

export default function TutoringSupportOptions({
  ctaHref = "/find-a-tutor",
}: TutoringSupportOptionsProps) {
  return (
    <section
      className={`section ${styles.section}`}
      aria-labelledby="tutoring-support-options-title"
    >
      <div className={`shell ${styles.shell}`}>
        <div className={styles.heading}>
          <span className="eyebrow">Flexible tutoring support</span>

          <h2 id="tutoring-support-options-title">
            Choose the kind of support that fits your goal.
          </h2>

          <p>
            You do not need to choose a package before speaking to us. Tell us
            what you are trying to learn and we will review the requirement,
            then suggest the most suitable tutoring route.
          </p>
        </div>

        <div className={styles.grid}>
          {supportOptions.map((option) => (
            <article className={styles.card} key={option.label}>
              <div className={styles.cardTop}>
                <span className={styles.number}>{option.number}</span>
                <span className={styles.label}>{option.label}</span>
              </div>

              <h3>{option.title}</h3>

              <p className={styles.description}>{option.description}</p>

              <ul className={styles.examples}>
                {option.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>

              <Link href={ctaHref} className="button">
                Request tutoring
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className={styles.reassurance}>
          <strong>Not sure which one you need?</strong>
          <span>
            That is completely fine. Submit your subject, level and goal and we
            will help determine the right starting point.
          </span>
        </div>
      </div>
    </section>
  );
}
