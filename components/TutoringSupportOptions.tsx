import Link from "next/link";

import styles from "./TutoringSupportOptions.module.css";

type TutoringSupportOptionsProps = {
  ctaHref?: string;
};

const supportOptions = [
  {
    number: "01",
    label: "One focused session",
    title: "Work through one specific problem.",
    description:
      "A good option when you already know what is confusing you and want focused time with a tutor to work through it properly.",
    examples: [
      "One difficult concept or method",
      "A coding or software error",
      "A statistical result you do not understand",
    ],
  },
  {
    number: "02",
    label: "A few sessions",
    title: "Work towards a clear deadline or goal.",
    description:
      "Useful when the problem is bigger than one lesson, such as preparing for an exam, catching up on a module or working through a dissertation method.",
    examples: [
      "Exam or assessment preparation",
      "Catching up on a difficult module",
      "Dissertation or project methodology",
    ],
  },
  {
    number: "03",
    label: "Regular tutoring",
    title: "Keep up with the course over time.",
    description:
      "Regular sessions give you continuity with one tutor and a place to deal with difficult topics before several weeks of material build up.",
    examples: [
      "Weekly or recurring sessions",
      "Ongoing subject tutoring",
      "Building skills over a term or semester",
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
          <span className="eyebrow">Flexible one-to-one tutoring</span>

          <h2 id="tutoring-support-options-title">
            Choose the amount of tutoring that fits what you need.
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
