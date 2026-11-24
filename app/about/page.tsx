import type { Metadata } from "next";
import Link from "next/link";


export const metadata: Metadata = {
  title: "About",
  description:
    "My Academic Tutor combines free educational resources with personalised one-to-one online tutoring built around clear explanation, practice and independent learning.",
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
            My Academic Tutor brings independent learning and personalised
            teaching together. Students can explore educational resources and
            work one-to-one with a tutor when they need deeper explanation,
            guided practice, feedback or individual support.
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
              More than one route to understanding.
            </h2>

            <p>
              Different students need different kinds of support at different
              stages. Sometimes a clear explanation or worked example is enough.
              Sometimes regular guided practice is useful. At other times,
              personalised teaching is the most effective next step.
            </p>

            <p>
              MAT brings free educational resources and personalised tutoring
              into one learning environment so students can begin independently
              and access more direct support when they need it.
            </p>

          </div>


          <div className="quote-card">

            <div className="eyebrow">
              OUR STANDARD
            </div>

            <strong>
              Good education should leave the learner more capable of working
              independently.
            </strong>

            <p>
              Whether someone is reading a guide or working with a tutor, the
              objective is stronger understanding, better reasoning and skills
              they can use without constant support.
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
            Learn independently. Practise properly. Get support when you need it.
          </h2>


          <div className="learning-grid">

            <article>

              <strong>
                Free learning
              </strong>

              <p>
                Explanations, guides and educational resources help learners
                understand concepts and explore subjects independently.
              </p>

            </article>


            <article>

              <strong>
                Personalised tutoring
              </strong>

              <p>
                One-to-one teaching provides individual explanation, guided
                practice, feedback and continuity around the student's actual
                course and learning needs.
              </p>

            </article>


            <article>

              <strong>
                Guided practice
              </strong>

              <p>
                Sessions can move from explanation to worked examples and
                student practice so understanding develops into independent
                problem-solving.
              </p>

            </article>


            <article>

              <strong>
                Ongoing learning support
              </strong>

              <p>
                Active tutoring students can use a private learning space for
                sessions, homework, resources, progress and support.
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
              MAT is designed around what the learner is trying to understand
              or achieve. The right next step might be a free resource, guided
              practice or personalised teaching.
            </p>

            <p>
              These routes are designed to work together so students can move
              between independent learning and one-to-one support as their needs
              change.
            </p>

          </div>


          <div>

            <div className="eyebrow">
              START LEARNING
            </div>

            <h2>
              Start with what you need today.
            </h2>

            <p>
              Explore the Learning Hub independently or request personalised
              tutoring for a subject or academic problem that needs individual
              attention.
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
