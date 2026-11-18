import Link from "next/link";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import { academicLevels, subjects } from "@/lib/tutoring-data";
import { tutoringServices } from "@/lib/tutoring-services";
import { resources } from "@/lib/resources";

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">PERSONALISED ONLINE TUTORING & ACADEMIC SUPPORT</div>
            <h1>Personalised tutoring for deeper understanding.</h1>
            <p className="hero-lead">
              One-to-one teaching for school, university and postgraduate study. Work through difficult concepts,
              practise with guidance and build the confidence to solve the next problem independently.
            </p>
            <div className="button-row">
              <Link className="button button-primary button-large" href="/find-a-tutor">Get personalised tutoring</Link>
              <Link className="button button-secondary button-large" href="/subjects">Explore subjects</Link>
            </div>
            <div className="trust-row" aria-label="Service highlights">
              <span>School to PhD</span>
              <span>Live 1:1 teaching</span>
              <span>Specialist subjects</span>
              <span>Online worldwide</span>
            </div>
          </div>

          <aside className="hero-panel lesson-panel" aria-label="How a tutoring session can work">
            <div className="hero-panel-label">A LESSON BUILT AROUND YOUR UNDERSTANDING</div>
            <h2>From “I don’t get this” to a method you can use yourself.</h2>
            <div className="lesson-sequence">
              <div><span>01</span><strong>Clarify</strong><p>Identify the exact idea, method or step that is causing difficulty.</p></div>
              <div><span>02</span><strong>Explain</strong><p>Rebuild the concept with an explanation that fits your level and course.</p></div>
              <div><span>03</span><strong>Practise</strong><p>Work through examples together, then try the method with guidance.</p></div>
              <div><span>04</span><strong>Progress</strong><p>Review what is secure and decide what to practise or learn next.</p></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="trust-band" aria-label="Academic levels supported">
        <div className="shell trust-band-grid">
          <span>Secondary school</span>
          <span>GCSE / IGCSE</span>
          <span>A-Level / IB / AP</span>
          <span>Undergraduate</span>
          <span>Master’s</span>
          <span>PhD & research</span>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">HOW WE TEACH</div>
              <h2>Learn with structure, not just answers.</h2>
              <p className="section-intro">Good tutoring should make difficult material more understandable and leave you better able to work independently afterwards.</p>
            </div>
          </div>
          <div className="learning-grid">
            <article><strong>Concept explanation</strong><p>Break ideas into manageable steps and connect them to what you already know.</p></article>
            <article><strong>Worked examples</strong><p>See how a method is applied, including the reasoning behind each step.</p></article>
            <article><strong>Guided practice</strong><p>Try problems yourself while your tutor questions, prompts and corrects constructively.</p></article>
            <article><strong>Exam preparation</strong><p>Combine understanding with question practice, timing and assessment technique.</p></article>
            <article><strong>Software & coding</strong><p>Learn how to use tools such as R, Python, SPSS or Stata without relying on copy-and-paste solutions.</p></article>
            <article><strong>Research support</strong><p>Strengthen study design, methods, analysis and interpretation while keeping the academic work yours.</p></article>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">SUBJECTS</div>
              <h2>Support across quantitative, scientific and technical study.</h2>
              <p className="section-intro">Choose the subject you are studying, then explore the topics and kinds of support available at your level.</p>
            </div>
            <Link href="/subjects" className="text-link">View all subjects</Link>
          </div>
          <div className="subject-grid">
            {subjects.slice(0, 6).map((subject, index) => (
              <Link key={subject.slug} href={`/subjects/${subject.slug}`} className="subject-card">
                <span className="subject-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{subject.name}</h3>
                <p>{subject.short}</p>
                <span className="text-link">Explore {subject.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">TUTORING SERVICES</div>
              <h2>Different goals need different kinds of academic support.</h2>
              <p className="section-intro">Use tutoring regularly alongside your course, intensively before an exam, or for a focused technical or research challenge.</p>
            </div>
            <Link href="/tutoring" className="text-link">Explore all tutoring services</Link>
          </div>
          <div className="service-grid">
            {tutoringServices.slice(0, 6).map((service) => (
              <Link className="service-card" href={`/tutoring/${service.slug}`} key={service.slug}>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <span className="text-link">See how it works</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="shell">
          <div className="eyebrow eyebrow-light">A SIMPLE LEARNING PROCESS</div>
          <h2>Start from your course. Build from what you understand now.</h2>
          <div className="steps-grid">
            <article><strong>01</strong><h3>Share your learning goals</h3><p>Tell us what you are studying, what feels difficult and what you need to achieve.</p></article>
            <article><strong>02</strong><h3>Begin at the right level</h3><p>We arrange suitable one-to-one support based on the subject, depth and practical context.</p></article>
            <article><strong>03</strong><h3>Learn through explanation and practice</h3><p>Sessions combine teaching, examples, questions and guided problem-solving rather than passive answers.</p></article>
            <article><strong>04</strong><h3>Adapt as you progress</h3><p>The focus can move with your module, assessments, research project or changing confidence.</p></article>
          </div>
          <div className="dark-link-row"><Link href="/tutoring" className="text-link text-link-light">Explore tutoring services</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">ACADEMIC LEVELS</div>
              <h2>The teaching should change when the level changes.</h2>
            </div>
            <Link href="/levels" className="text-link">View all levels</Link>
          </div>
          <div className="level-strip">
            {academicLevels.slice(0, 6).map((level) => (
              <Link href={`/levels/${level.slug}`} key={level.slug}>
                <strong>{level.name}</strong><span>{level.short}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">LEARNING HUB</div>
              <h2>Learn something useful before you ever book a lesson.</h2>
              <p className="section-intro">Our learning resources explain difficult concepts clearly and help you recognise where personalised teaching could take you further.</p>
            </div>
            <Link href="/learn" className="text-link">Browse the learning hub</Link>
          </div>
          <div className="resource-grid">
            {resources.slice(0, 3).map((resource) => (
              <Link href={`/learn/${resource.slug}`} className="card resource-card" key={resource.slug}>
                <span>{resource.category}</span>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>
                <small>{resource.readTime} read</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col ai-feature">
          <div>
            <div className="eyebrow">MAT AI TUTOR</div>
            <h2>Ask a question. Understand the first step. Continue with a human when you need more.</h2>
            <p>MAT AI is being developed as an educational layer: explain a concept, organise a problem and check understanding. Human tutoring remains the place for deeper teaching, feedback and sustained progress.</p>
            <div className="button-row"><Link className="button button-secondary" href="/ai-tutor">Preview MAT AI</Link></div>
          </div>
          <div className="quote-card">
            <div className="eyebrow">OUR PRINCIPLE</div>
            <strong>AI can support learning. Teaching remains human-led.</strong>
            <p>Technology should make academic help easier to access without turning education into a shortcut around understanding.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell lead-section-grid">
          <div className="section-copy-block">
            <div className="eyebrow">PERSONALISED SUPPORT</div>
            <h2>Tell us what you are studying and where you are getting stuck.</h2>
            <p className="section-intro">Share your course, level, topic and goal. Our team will review the academic context and arrange suitable one-to-one tutoring.</p>
            <ul className="check-list">
              <li>Your subject and academic level</li>
              <li>The topic, module or skill you want to improve</li>
              <li>Your goal: understanding, exams, coursework, coding or research</li>
              <li>Your preferred schedule and urgency</li>
            </ul>
          </div>
          <div className="card form-card"><TutoringLeadForm compact /></div>
        </div>
      </section>

      <section className="section">
        <div className="shell integrity-grid">
          <div>
            <div className="eyebrow">RESPONSIBLE TUTORING</div>
            <h2>Your learning stays yours.</h2>
            <p>We explain, question, guide and practise with students. We do not position tutoring as a way to outsource assessed work. The aim is stronger understanding and greater independence.</p>
            <Link href="/academic-integrity" className="text-link">Read our academic integrity approach</Link>
          </div>
          <div className="quote-card">
            <div className="eyebrow">WHAT GOOD SUPPORT SHOULD LEAVE BEHIND</div>
            <strong>A student who can explain the method, use it and defend their reasoning.</strong>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div><div className="eyebrow eyebrow-light">READY TO START?</div><h2>Get tutoring built around your learning needs.</h2><p>Tell us the subject, level and goal. We’ll take it from there.</p></div>
          <Link className="button button-light button-large" href="/find-a-tutor">Get personalised tutoring</Link>
        </div>
      </section>
    </>
  );
}
