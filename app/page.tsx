import Link from "next/link";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import { subjects } from "@/lib/tutoring-data";
import { tutoringServices } from "@/lib/tutoring-services";
import { resources } from "@/lib/resources";
import TestimonialCard from "@/components/TestimonialCard";
import { getApprovedTestimonials } from "@/lib/testimonials";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const testimonials = await getApprovedTestimonials({ featuredFirst: true, limit: 3 });
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              PERSONALISED ONLINE TUTORING
            </div>

            <h1>
              Understand difficult subjects with personalised one-to-one tutoring.
            </h1>

            <p className="hero-lead">
              Online tutoring for school, university and postgraduate students.
              Learn difficult concepts clearly, practise with guidance and build
              the confidence to work independently.
            </p>

            <div className="button-row">
              <Link
                className="button button-primary button-large"
                href="/find-a-tutor"
              >
                Request tutoring
              </Link>

              <Link
                className="button button-secondary button-large"
                href="/subjects"
              >
                Explore subjects
              </Link>
            </div>

            <div className="trust-row" aria-label="Service highlights">
              <span>Since 2020</span>
              <span>Live 1:1 teaching</span>
              <span>School to postgraduate</span>
              <span>Online worldwide</span>
            </div>
          </div>

          <aside
            className="hero-panel lesson-panel"
            aria-label="How tutoring works"
          >
            <div className="hero-panel-label">
              A LESSON BUILT AROUND YOUR UNDERSTANDING
            </div>

            <h2>
              From “I don’t understand this” to a method you can use yourself.
            </h2>

            <div className="lesson-sequence">
              <div>
                <span>01</span>
                <strong>Clarify</strong>
                <p>
                  Identify the exact concept, method or step causing difficulty.
                </p>
              </div>

              <div>
                <span>02</span>
                <strong>Explain</strong>
                <p>
                  Rebuild the idea with an explanation appropriate to your level.
                </p>
              </div>

              <div>
                <span>03</span>
                <strong>Practise</strong>
                <p>
                  Work through examples and apply the method with guidance.
                </p>
              </div>

              <div>
                <span>04</span>
                <strong>Progress</strong>
                <p>
                  Strengthen understanding and decide what to work on next.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="trust-band" aria-label="Academic levels supported">
        <div className="shell trust-band-grid">
          <Link href="/levels/school-secondary">Secondary school</Link>
          <Link href="/levels/gcse-igcse">GCSE / IGCSE</Link>
          <Link href="/levels/a-level-ib">A-Level / IB</Link>
          <Link href="/levels/undergraduate">Undergraduate</Link>
          <Link href="/levels/masters">Master’s</Link>
          <Link href="/levels/phd-research">PhD & research</Link>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">HOW WE TEACH</div>

              <h2>
                Learn the method, not just the answer.
              </h2>

              <p className="section-intro">
                Good tutoring should make difficult material clearer and leave
                you more capable of solving the next problem independently.
              </p>
            </div>
          </div>

          <div className="learning-grid">
            <article>
              <strong>Clear explanation</strong>
              <p>
                Break difficult ideas into manageable steps and connect them to
                what you already understand.
              </p>
            </article>

            <article>
              <strong>Worked examples</strong>
              <p>
                See how a method is applied and understand the reasoning behind
                each step.
              </p>
            </article>

            <article>
              <strong>Guided practice</strong>
              <p>
                Try questions yourself while your tutor prompts, checks and
                corrects constructively.
              </p>
            </article>

            <article>
              <strong>Independent progress</strong>
              <p>
                Build the confidence to apply what you have learned outside the
                tutoring session.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">SUBJECTS</div>

              <h2>
                Specialist support across quantitative and technical subjects.
              </h2>

              <p className="section-intro">
                Explore the subject you are studying and the kinds of tutoring
                available at your level.
              </p>
            </div>

            <Link href="/subjects" className="text-link">
              View all subjects
            </Link>
          </div>

          <div className="subject-grid">
            {subjects.slice(0, 6).map((subject, index) => (
              <Link
                key={subject.slug}
                href={`/subjects/${subject.slug}`}
                className="subject-card"
              >
                <span className="subject-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{subject.name}</h3>

                <p>{subject.short}</p>

                <span className="text-link">
                  Explore {subject.name}
                </span>
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

              <h2>
                Academic support built around what you need to achieve.
              </h2>

              <p className="section-intro">
                Use tutoring alongside your course, for exam preparation or for
                a focused technical, statistical or research challenge.
              </p>
            </div>

            <Link href="/tutoring" className="text-link">
              Explore tutoring services
            </Link>
          </div>

          <div className="service-grid">
            {tutoringServices.slice(0, 4).map((service) => (
              <Link
                className="service-card"
                href={`/tutoring/${service.slug}`}
                key={service.slug}
              >
                <h3>{service.title}</h3>

                <p>{service.short}</p>

                <span className="text-link">
                  See how it works
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="shell">
          <div className="eyebrow eyebrow-light">
            HOW IT WORKS
          </div>

          <h2>
            Start from where you are now.
          </h2>

          <div className="steps-grid">
            <article>
              <strong>01</strong>
              <h3>Tell us what you need</h3>
              <p>
                Share your subject, academic level and the problem you want help
                understanding.
              </p>
            </article>

            <article>
              <strong>02</strong>
              <h3>We review your request</h3>
              <p>
                We identify suitable support based on your subject and academic
                context.
              </p>
            </article>

            <article>
              <strong>03</strong>
              <h3>Start one-to-one tutoring</h3>
              <p>
                Learn through explanation, examples, questions and guided
                practice.
              </p>
            </article>

            <article>
              <strong>04</strong>
              <h3>Keep progressing</h3>
              <p>
                Sessions adapt as your course, assessments and learning needs
                change.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell lead-section-grid">
          <div className="section-copy-block">
            <div className="eyebrow">
              PERSONALISED SUPPORT
            </div>

            <h2>
              Tell us what you need help understanding.
            </h2>

            <p className="section-intro">
              Send us your subject, academic level and a short description of
              what you are struggling with. We’ll review it and recommend
              suitable one-to-one support.
            </p>

            <ul className="check-list">
              <li>Choose your subject and academic level</li>
              <li>Tell us what you need help with</li>
              <li>We review the academic context</li>
              <li>You receive suitable tutoring options</li>
            </ul>
          </div>

          <div className="card form-card">
            <TutoringLeadForm compact />
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">
                LEARNING HUB
              </div>

              <h2>
                Learn something useful before you book a lesson.
              </h2>

              <p className="section-intro">
                Explore free explanations and study resources across statistics,
                mathematics, data science and research methods.
              </p>
            </div>

            <Link href="/learn" className="text-link">
              Browse the learning hub
            </Link>
          </div>

          <div className="resource-grid">
            {resources.slice(0, 3).map((resource) => (
              <Link
                href={`/learn/${resource.slug}`}
                className="card resource-card"
                key={resource.slug}
              >
                <span>{resource.category}</span>

                <h3>{resource.title}</h3>

                <p>{resource.description}</p>

                <small>{resource.readTime} read</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {testimonials.length ? (
        <section className="section section-soft testimonial-home-section">
          <div className="shell">
            <div className="section-head">
              <div><div className="eyebrow">STUDENT EXPERIENCES</div><h2>Learning support students can describe in their own words.</h2><p className="section-intro">Approved feedback from students who have used My Academic Tutor. Testimonials are published only with the student’s permission.</p></div>
              <Link href="/testimonials" className="text-link">Read all testimonials</Link>
            </div>
            <div className="testimonial-grid testimonial-grid-home">{testimonials.map((item) => <TestimonialCard key={item.id} testimonial={item} />)}</div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="shell integrity-grid">
          <div>
            <div className="eyebrow">
              RESPONSIBLE TUTORING
            </div>

            <h2>
              Your learning stays yours.
            </h2>

            <p>
              We explain, question, guide and practise with students. We do not
              complete assessed work on behalf of students. The aim is stronger
              understanding and greater independence.
            </p>

            <Link
              href="/academic-integrity"
              className="text-link"
            >
              Read our academic integrity approach
            </Link>
          </div>

          <div className="quote-card">
            <div className="eyebrow">
              OUR GOAL
            </div>

            <strong>
              A student who can understand the method, apply it and explain
              their reasoning.
            </strong>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <div className="eyebrow eyebrow-light">
              READY TO START?
            </div>

            <h2>
              Get tutoring built around your learning needs.
            </h2>

            <p>
              Tell us your subject, level and what you need help with.
            </p>
          </div>

          <Link
            className="button button-light button-large"
            href="/find-a-tutor"
          >
            Request tutoring
          </Link>
        </div>
      </section>
    </>
  );
}
