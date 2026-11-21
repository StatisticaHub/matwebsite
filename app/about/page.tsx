import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">ABOUT MY ACADEMIC TUTOR</div>
          <h1>Good tutoring starts with understanding what the student actually needs.</h1>
          <p className="page-lead">My Academic Tutor is a one-to-one tutoring service for students who want difficult material explained clearly and at the level their course actually requires.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">WHAT WE DO</div>
            <h2>A tutoring service, not a list of profiles.</h2>
            <p>Students come to MAT because they need help learning a subject, preparing for an assessment, understanding data, building technical skills or navigating advanced research methods.</p>
            <p>Our role is to understand that academic need and organise one-to-one teaching around it. Tutor selection happens behind the service; the student experience stays focused on learning.</p>
          </div>
          <div className="quote-card">
            <div className="eyebrow">OUR STANDARD</div>
            <strong>A good session should leave the student understanding more than when it started.</strong>
            <p>That might mean a concept finally clicks, a method becomes usable, code starts making sense or the student knows exactly what to practise next.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">HOW MAT WORKS</div>
          <h2>Learn on your own when you can. Use a tutor when you need one.</h2>
          <div className="learning-grid">
            <article><strong>Learn</strong><p>Free explanations and guides help students begin understanding a topic before committing to tutoring.</p></article>
            <article><strong>Practise</strong><p>Examples and practice help students check whether the idea actually makes sense before moving on.</p></article>
            <article><strong>Work one-to-one</strong><p>A tutor can slow down, change the explanation, answer questions and give feedback while the student practises.</p></article>
            <article><strong>Use it yourself</strong><p>The aim is for students to become more confident using the method without needing someone beside them every time.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell narrow">
          <div className="eyebrow">ACADEMIC INTEGRITY</div>
          <h2>Tutoring should help students understand their work, not do it for them.</h2>
          <p>Tutors can explain methods, discuss reasoning, work through examples, help students understand feedback and practise similar problems. Assessed work must remain the student’s own.</p>
          <div className="button-row">
            <Link href="/academic-integrity" className="button button-secondary">Read our approach</Link>
            <Link href="/find-a-tutor" className="button button-primary">Request tutoring</Link>
          </div>
        </div>
      </section>
    </>
  );
}
