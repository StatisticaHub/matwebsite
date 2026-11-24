import Link from "next/link";

import TestimonialCard from "@/components/TestimonialCard";
import TrackedLink from "@/components/TrackedLink";

import { getApprovedTestimonials } from "@/lib/testimonials";
import { subjects } from "@/lib/tutoring-data";
import { resources } from "@/lib/resources";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const testimonials = await getApprovedTestimonials({
    featuredFirst: true,
    limit: 3,
  });

  return (
    <>
      {/* ============================================================
          HERO
          ============================================================ */}

      <section className="home-v2-hero">
        <div className="shell home-v2-hero-grid">
          <div className="home-v2-hero-copy">
            <div className="home-v2-kicker">
              ONLINE LEARNING + PERSONALISED TEACHING
            </div>

            <h1>
              Understand difficult subjects.
              <span> Build skills that last.</span>
            </h1>

            <p>
              My Academic Tutor provides thoughtful one-to-one
              teaching for students who want difficult ideas
              explained clearly, practised properly and understood
              at the level their course requires.
            </p>

            <div className="home-v2-actions">
              <TrackedLink
                className="button button-primary button-large"
                href="/find-a-tutor"
                trackingId="home_v2_request_tutoring"
              >
                Request personalised tutoring
              </TrackedLink>

              <TrackedLink
                className="home-v2-text-action"
                href="/learn"
                trackingId="home_v2_learning_hub"
                contentType="learning_cta"
              >
                Explore free learning
                <span>→</span>
              </TrackedLink>
            </div>

            <div
              className="home-v2-trust"
              aria-label="My Academic Tutor highlights"
            >
              <span>Teaching since 2020</span>
              <span>School to postgraduate</span>
              <span>Free learning resources</span>
              <span>Courses & programmes coming soon</span>
            </div>
          </div>

          <aside className="home-v2-hero-card">
            <div className="home-v2-card-kicker">
              ONE LEARNING PLATFORM
            </div>

            <h2>
              Different ways to learn, one goal: real understanding.
            </h2>

            <p>
              Good tutoring should help you understand why a method
              works, recognise when to use it and become more
              confident working independently.
            </p>

            <div className="home-v2-principles">
              <div>
                <span>01</span>
                <div>
                  <strong>Understand</strong>
                  <p>
                    Build a clear explanation from the foundations.
                  </p>
                </div>
              </div>

              <div>
                <span>02</span>
                <div>
                  <strong>Practise</strong>
                  <p>
                    Apply the idea through guided examples.
                  </p>
                </div>
              </div>

              <div>
                <span>03</span>
                <div>
                  <strong>Become independent</strong>
                  <p>
                    Develop the confidence to solve new problems.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============================================================
          LEVELS
          ============================================================ */}

      <section className="home-v2-level-bar">
        <div className="shell">
          <span className="home-v2-level-label">
            SUPPORT ACROSS YOUR EDUCATION
          </span>

          <div className="home-v2-levels">
            <Link href="/levels/school-secondary">
              Secondary
            </Link>

            <Link href="/levels/gcse-igcse">
              GCSE / IGCSE
            </Link>

            <Link href="/levels/a-level-ib">
              A-Level / IB
            </Link>

            <Link href="/levels/undergraduate">
              Undergraduate
            </Link>

            <Link href="/levels/masters">
              Master&apos;s
            </Link>

            <Link href="/levels/phd-research">
              PhD & research
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          EDUCATIONAL MODEL
          ============================================================ */}

      <section className="section home-v2-learning">
        <div className="shell">
          <div className="home-v2-section-heading">
            <div>
              <span className="home-v2-kicker">
                LEARN IN THE WAY THAT FITS YOU
              </span>

              <h2>
                Learn independently, follow a structured pathway or work one-to-one.
              </h2>
            </div>

            <p>
              Use MAT as a place to learn independently, develop
              technical skills and access one-to-one teaching when
              deeper explanation or feedback would help.
            </p>
          </div>

          <div className="home-v2-learning-grid">
            <article>
              <span className="home-v2-card-number">01</span>

              <h3>Learn concepts clearly</h3>

              <p>
                Read free explanations and study guides designed to
                make difficult academic ideas more approachable.
              </p>

              <Link href="/learn">
                Visit the learning hub →
              </Link>
            </article>

            <article>
              <span className="home-v2-card-number">02</span>

              <h3>Practise the method</h3>

              <p>
                Move from reading an explanation to solving,
                interpreting and applying ideas in realistic
                academic problems.
              </p>

              <Link href="/subjects">
                Explore subjects →
              </Link>
            </article>

            <article>
              <span className="home-v2-card-number">03</span>

              <h3>Work one-to-one</h3>

              <p>
                Get live teaching, guided practice and feedback
                centred on your course, current level and learning
                goals.
              </p>

              <Link href="/tutoring">
                Explore tutoring →
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================
          SUBJECTS
          ============================================================ */}

      <section className="section home-v2-subject-section">
        <div className="shell">
          <div className="home-v2-section-heading">
            <div>
              <span className="home-v2-kicker">
                SUBJECTS
              </span>

              <h2>
                From core academic study to advanced quantitative
                and technical work.
              </h2>
            </div>

            <Link
              href="/subjects"
              className="home-v2-section-link"
            >
              View every subject →
            </Link>
          </div>

          <div className="home-v2-subject-grid">
            {subjects.slice(0, 6).map((subject, index) => (
              <Link
                key={subject.slug}
                href={`/subjects/${subject.slug}`}
                className="home-v2-subject-card"
              >
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <h3>{subject.name}</h3>

                <p>{subject.short}</p>

                <strong>
                  Explore subject
                  <i>→</i>
                </strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW TUTORING WORKS
          ============================================================ */}

      <section className="section home-v2-process">
        <div className="shell home-v2-process-layout">
          <div className="home-v2-process-copy">
            <span className="home-v2-kicker">
              PERSONALISED TUTORING
            </span>

            <h2>
              Start with the academic problem, not a directory of
              tutor profiles.
            </h2>

            <p>
              Tell us what you are studying and where you need help.
              We review the academic context and organise suitable
              one-to-one support around it.
            </p>

            <div className="home-v2-price-note">
              Tutoring from <strong>£20/hour</strong>
              <small>
                Your rate is confirmed before tutoring is arranged.
              </small>
            </div>

            <TrackedLink
              href="/find-a-tutor"
              className="button button-primary"
              trackingId="home_v2_process_request"
            >
              Tell us what you need help with
            </TrackedLink>
          </div>

          <div className="home-v2-process-steps">
            <article>
              <span>1</span>

              <div>
                <h3>Tell us what you are studying</h3>
                <p>
                  Share your subject, level, topic and learning
                  goal.
                </p>
              </div>
            </article>

            <article>
              <span>2</span>

              <div>
                <h3>We review the academic context</h3>
                <p>
                  We consider the required depth, teaching need and
                  practical fit.
                </p>
              </div>
            </article>

            <article>
              <span>3</span>

              <div>
                <h3>Start focused one-to-one learning</h3>
                <p>
                  Your tutor explains, demonstrates and practises
                  the material with you.
                </p>
              </div>
            </article>

            <article>
              <span>4</span>

              <div>
                <h3>Build continuity and progress</h3>
                <p>
                  Sessions can follow your course and develop skills
                  over time.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIALS
          ============================================================ */}

      {testimonials.length ? (
        <section className="section home-v2-testimonials">
          <div className="shell">
            <div className="home-v2-section-heading">
              <div>
                <span className="home-v2-kicker">
                  STUDENT EXPERIENCES
                </span>

                <h2>
                  What students say about learning with MAT.
                </h2>
              </div>

              <Link
                href="/testimonials"
                className="home-v2-section-link"
              >
                Read all feedback →
              </Link>
            </div>

            <div className="testimonial-grid testimonial-grid-home">
              {testimonials.map((item) => (
                <TestimonialCard
                  key={item.id}
                  testimonial={item}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============================================================
          LEARNING HUB
          ============================================================ */}

      <section className="section home-v2-resource-section">
        <div className="shell">
          <div className="home-v2-section-heading">
            <div>
              <span className="home-v2-kicker">
                FREE LEARNING HUB
              </span>

              <h2>
                Start learning before you ever book a lesson.
              </h2>

              <p>
                Read clear explanations across statistics,
                mathematics, data science and research methods.
              </p>
            </div>

            <Link
              href="/learn"
              className="home-v2-section-link"
            >
              Browse all learning →
            </Link>
          </div>

          <div className="home-v2-resource-grid">
            {resources.slice(0, 3).map((resource) => (
              <Link
                href={`/learn/${resource.slug}`}
                key={resource.slug}
                className="home-v2-resource-card"
              >
                <span>{resource.category}</span>

                <h3>{resource.title}</h3>

                <p>{resource.description}</p>

                <small>
                  {resource.readTime} read
                  <strong>→</strong>
                </small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA
          ============================================================ */}

      <section className="home-v2-final">
        <div className="shell">
          <div className="home-v2-final-card">
            <div>
              <span className="home-v2-kicker">
                WHEN YOU NEED MORE THAN A GUIDE
              </span>

              <h2>
                Get one-to-one teaching built around what you are
                learning now.
              </h2>

              <p>
                Tell us the subject, your academic level and the
                problem you want to understand. We will review your
                requirements and organise the next step.
              </p>
            </div>

            <div className="home-v2-final-actions">
              <TrackedLink
                href="/find-a-tutor"
                className="button button-light button-large"
                trackingId="home_v2_final_request"
              >
                Request tutoring
              </TrackedLink>

              <Link href="/how-it-works">
                How MAT works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div
        className="home-v2-mobile-cta"
        aria-label="Request tutoring"
      >
        <TrackedLink
          href="/find-a-tutor"
          className="button button-primary"
          trackingId="home_v2_mobile_request"
        >
          Request tutoring
        </TrackedLink>
      </div>
    </>
  );
}
