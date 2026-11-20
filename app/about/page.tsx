import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">ABOUT MY ACADEMIC TUTOR</div>
          <h1>Education first. Personalised teaching when it matters.</h1>
          <p className="page-lead">My Academic Tutor is organised around a simple idea: students should be able to understand difficult academic material with support that respects their level, goals and independence.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">WHAT WE DO</div>
            <h2>A tutoring service, not a directory.</h2>
            <p>Students come to MAT because they need help learning a subject, preparing for an assessment, understanding data, building technical skills or navigating advanced research methods.</p>
            <p>Our role is to understand that academic need and organise one-to-one teaching around it. Tutor selection happens behind the service; the student experience stays focused on learning.</p>
          </div>
          <div className="quote-card">
            <div className="eyebrow">OUR STANDARD</div>
            <strong>A useful session should leave the student more capable than when it began.</strong>
            <p>That means clearer concepts, better questions, more confident practice and less dependence on someone else supplying the answer.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">THE MAT MODEL</div>
          <h2>Learning resources, technology and human teaching working together.</h2>
          <div className="learning-grid">
            <article><strong>Learn</strong><p>Free explanations and guides help students begin understanding a topic before committing to tutoring.</p></article>
            <article><strong>Ask</strong><p>Digital learning tools can help students organise questions and review first steps without pretending to replace a teacher.</p></article>
            <article><strong>Work one-to-one</strong><p>Human tutoring provides deeper explanation, feedback, guided practice and continuity over time.</p></article>
            <article><strong>Progress independently</strong><p>The objective is always to strengthen the student’s own reasoning and ability to work alone.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell narrow">
          <div className="eyebrow">ACADEMIC INTEGRITY</div>
          <h2>Support should improve the student’s work, not replace it.</h2>
          <p>MAT tutors can explain methods, review reasoning, demonstrate examples, help students interpret feedback and practise similar problems. They should not complete assessed work on behalf of a student.</p>
          <div className="button-row">
            <Link href="/academic-integrity" className="button button-secondary">Read our approach</Link>
            <Link href="/find-a-tutor" className="button button-primary">Request tutoring</Link>
          </div>
        </div>
      </section>
    </>
  );
}
