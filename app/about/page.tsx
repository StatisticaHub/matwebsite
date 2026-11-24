import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "My Academic Tutor is an online learning and tutoring platform combining free educational resources, structured learning pathways and personalised one-to-one teaching.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">
            ABOUT MY ACADEMIC TUTOR
          </div>

          <h1>
            An education platform built around understanding.
          </h1>

          <p className="page-lead">
            My Academic Tutor brings independent learning and
            personalised teaching together. Students can explore
            educational resources, develop skills through structured
            learning and work one-to-one with a tutor when they need
            deeper explanation, feedback or individual guidance.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              WHAT MAT IS
            </div>

            <h2>
              More than one route to learning.
            </h2>

            <p>
              Different students need different kinds of support at
              different stages. Sometimes a clear explanation or
              worked example is enough. Sometimes a learner needs a
              structured sequence of lessons. At other times,
              personalised teaching is the most useful next step.
            </p>

            <p>
              MAT is being developed around those different learning
              routes rather than around a single tutoring format.
              Free learning resources and personalised tutoring are
              available now, with structured programmes and
              self-paced courses being developed for future launch.
            </p>
          </div>

          <div className="quote-card">
            <div className="eyebrow">
              OUR STANDARD
            </div>

            <strong>
              Good education should leave the learner more capable
              of working independently.
            </strong>

            <p>
              Whether someone is reading a guide, following a course
              or working with a tutor, the objective is stronger
              understanding, better reasoning and skills that can be
              used without constant support.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">
            THE MAT LEARNING MODEL
          </div>

          <h2>
            Learn independently. Follow a pathway. Get support when
            you need it.
          </h2>

          <div className="learning-grid">
            <article>
              <strong>Free learning</strong>
              <p>
                Explanations, guides and educational resources help
                learners understand concepts and explore subjects
                independently.
              </p>
            </article>

            <article>
              <strong>Structured courses & programmes</strong>
              <p>
                Coming soon: organised learning pathways with
                modules, lessons, exercises, resources and visible
                progress.
              </p>
            </article>

            <article>
              <strong>Self-paced learning</strong>
              <p>
                Coming soon: recorded and guided courses that
                students can work through independently at their own
                pace.
              </p>
            </article>

            <article>
              <strong>Personalised tutoring</strong>
              <p>
                One-to-one teaching provides individual explanation,
                guided practice, feedback and continuity when a
                learner needs more direct support.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              EDUCATION FIRST
            </div>

            <h2>
              The product is learning, not access to a tutor list.
            </h2>

            <p>
              MAT is designed around what the learner is trying to
              understand or achieve. The right next step might be a
              free resource, structured study, guided practice or
              personalised teaching.
            </p>

            <p>
              As the platform develops, these learning routes will
              live together inside the same MAT learning experience.
            </p>
          </div>

          <div>
            <div className="eyebrow">
              START LEARNING
            </div>

            <h2>
              Use what is available today.
            </h2>

            <p>
              Explore the Learning Hub independently or request
              personalised tutoring for a subject or academic
              problem that needs individual attention.
            </p>

            <div className="button-row">
              <Link
                className="button button-primary"
                href="/learn"
              >
                Explore free learning
              </Link>

              <Link
                className="button button-secondary"
                href="/find-a-tutor"
              >
                Request tutoring
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
