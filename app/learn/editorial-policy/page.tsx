import type { Metadata } from "next";
import Link from "next/link";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const metadata: Metadata = {
  title: "Learning Hub Editorial Approach",
  description: "How My Academic Tutor organises, reviews and maintains educational Learning Hub content.",
  alternates: { canonical: `${siteUrl}/learn/editorial-policy` },
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">LEARNING HUB · EDITORIAL APPROACH</div>
          <h1>Educational content should help you reason, not just rank in search.</h1>
          <p className="page-lead">Our Learning Hub is organised around questions students repeatedly need to understand in statistics, quantitative methods, coding and research.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell article-shell editorial-policy-copy">
          <section>
            <h2>What the guides are for</h2>
            <p>Learning Hub articles are designed to explain concepts, assumptions, interpretation and workflows in a way that supports independent study. They are not written to provide answers to a specific assessed assignment, dissertation or exam.</p>
          </section>
          <section>
            <h2>How topics are selected</h2>
            <p>We prioritise recurring learning problems across statistics, medical statistics, research methods, R, SPSS, econometrics, data science, bioinformatics and mathematics. A topic should be useful to a real learner even if they arrive directly rather than through a search engine.</p>
          </section>
          <section>
            <h2>How guides are structured</h2>
            <p>Where possible, a guide starts from the question or interpretation problem, explains the reasoning, highlights common mistakes and connects the concept to related methods. We avoid turning statistical methods into button-click recipes without explaining what the analysis is estimating.</p>
          </section>
          <section>
            <h2>Review and updates</h2>
            <p>Content is maintained by the My Academic Tutor academic team. Guides should be reviewed when methods, software workflows or teaching needs change. Material with a substantive update displays an updated date.</p>
          </section>
          <section>
            <h2>Academic integrity</h2>
            <p>Learning resources can teach methods, demonstrate general examples and help students practise. They are not a replacement for a student's own assessed work.</p>
            <Link href="/academic-integrity" className="text-link">Read our academic integrity approach</Link>
          </section>
          <div className="article-cta">
            <h2>Looking for a specific topic?</h2>
            <p>Browse the Learning Hub first. If you still need course-specific explanation, you can request one-to-one tutoring.</p>
            <div className="button-row">
              <Link className="button button-primary" href="/learn">Browse Learning Hub</Link>
              <Link className="button button-secondary" href="/find-a-tutor">Request tutoring</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
