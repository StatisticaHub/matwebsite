import Link from "next/link";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import { subjects } from "@/lib/tutoring-data";
import { resources } from "@/lib/resources";
import TestimonialCard from "@/components/TestimonialCard";
import { getApprovedTestimonials } from "@/lib/testimonials";

import ConversionProofBar from "@/components/ConversionProofBar";
import HighIntentLinkGrid from "@/components/HighIntentLinkGrid";
import TrackedLink from "@/components/TrackedLink";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const testimonials = await getApprovedTestimonials({ featuredFirst: true, limit: 3 });
  return (
    <>
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              LIVE ONE-TO-ONE ONLINE TUTORING
            </div>

            <h1>
              One-to-one tutoring that starts with what you actually need help with.
            </h1>

            <p className="hero-lead">
              Tell us your subject, level and the topic that is giving you trouble. We’ll match you with a tutor who can explain it clearly, work through examples with you and help you practise until it makes sense.
            </p>

            <div className="button-row">
              <TrackedLink
                className="button button-primary button-large"
                href="/find-a-tutor"
                trackingId="home_hero_request_tutoring"
              >
                Request tutoring
              </TrackedLink>

              <TrackedLink
                className="button button-secondary button-large"
                href="/learn"
                trackingId="home_hero_free_learning"
                contentType="learning_cta"
              >
                Explore free learning
              </TrackedLink>
            </div>

            <div className="trust-row" aria-label="Service highlights">
              <span>Since 2020</span>
              <span>Tutor matching by subject</span>
              <span>School to PhD & research</span>
              <span>Online worldwide</span>
            </div>
          </div>

          <aside
            className="hero-panel lesson-panel"
            aria-label="How tutoring works"
          >
            <div className="hero-panel-label">
              A SESSION BUILT AROUND WHAT YOU NEED
            </div>

            <h2>
              Start with the part that is not making sense.
            </h2>

            <div className="lesson-sequence">
              <div>
                <span>01</span>
                <strong>Clarify</strong>
                <p>
                  Pinpoint the idea, method or step that is causing trouble.
                </p>
              </div>

              <div>
                <span>02</span>
                <strong>Explain</strong>
                <p>
                  Explain it in a way that fits your course and current level.
                </p>
              </div>

              <div>
                <span>03</span>
                <strong>Practise</strong>
                <p>
                  Work through an example together, then try it with guidance.
                </p>
              </div>

              <div>
                <span>04</span>
                <strong>Progress</strong>
                <p>
                  Finish with a clear idea of what you understand and what to practise next.
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

      <ConversionProofBar />

      <section className="section home-tutoring-journey">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">HOW TUTORING WORKS</div>
            <h2>Tell us what you’re studying. We’ll take it from there.</h2>
            <p>We look at what you’re studying, where you’re stuck and what you want to achieve, then match you with a tutor who fits.</p>
            <Link href="/tutors" className="text-link">See our tutor standards</Link>
          </div>
          <div className="conversion-journey">
            <article><span>1</span><h3>Tell us where you’re stuck</h3><p>Tell us your subject, level and the exact topic or problem you want help with.</p></article>
            <article><span>2</span><h3>We read it and match carefully</h3><p>We look at the topic, level and your goals, then find a suitable available tutor.</p></article>
            <article><span>3</span><h3>Meet your tutor online</h3><p>Ask questions, work through examples and practise the parts you find difficult.</p></article>
          </div>
        </div>
      </section>
      {testimonials.length ? (
        <section className="section section-soft testimonial-home-section">
          <div className="shell">
            <div className="section-head">
              <div><div className="eyebrow">STUDENT EXPERIENCES</div><h2>What students say after working with us.</h2><p className="section-intro">Feedback from students who have used My Academic Tutor, published with their permission.</p></div>
              <Link href="/testimonials" className="text-link">Read all testimonials</Link>
            </div>
            <div className="testimonial-grid testimonial-grid-home">{testimonials.map((item) => <TestimonialCard key={item.id} testimonial={item} />)}</div>
          </div>
        </section>
      ) : null}


      <section className="section section-soft">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">SUBJECTS</div>

              <h2>
                Find tutoring for the subject you’re studying.
              </h2>

              <p className="section-intro">
                Choose a subject to see the topics, levels and types of tutoring
                we can cover.
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

            <section className="section section-tint">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">POPULAR SPECIALIST SUPPORT</div>
            <h2>Need help with a specific topic, method or software problem?</h2>
            <p>Start with the problem you have now, then see the related subject tutoring we can arrange.</p>
          </div>
          <HighIntentLinkGrid />
        </div>
      </section>

      <section className="section home-pricing-section" id="pricing">
        <div className="shell home-pricing-grid">
          <div className="section-copy-block">
            <div className="eyebrow">CLEAR PRICING</div>

            <h2>Tutoring starts from £20 an hour.</h2>

            <p className="section-intro">
              The exact rate depends on the subject, course level and any specialist
              requirements. Tell us what you need help with and we’ll confirm the
              price before you book.
            </p>

            <TrackedLink
              className="button button-primary"
              href="/find-a-tutor"
              trackingId="home_pricing_request_tutoring"
            >
              Get a quote
            </TrackedLink>
          </div>

          <aside className="home-pricing-card" aria-label="Tutoring pricing">
            <span className="home-pricing-label">Tutoring starts from</span>

            <div className="home-price-amount">
              £20
              <span>/hour</span>
            </div>

            <p>
              Get in touch for a quote based on your course level,
              subject and requirements.
            </p>

            <small>
              Sending an enquiry does not book a lesson. You’ll know the rate
              before deciding whether to go ahead.
            </small>
          </aside>
        </div>
      </section>


      <section className="section section-soft">
        <div className="shell lead-section-grid">
          <div className="section-copy-block">
            <div className="eyebrow">
              REQUEST TUTORING
            </div>

            <h2>
              Tell us where you’re stuck help understanding.
            </h2>

            <p className="section-intro">
              Send us your subject, academic level and a short description of
              what you are struggling with. We’ll review it and recommend
              suitable one-to-one support.
            </p>

            <ul className="check-list">
              <li>Choose your subject and level</li>
              <li>Tell us where you’re stuck help with</li>
              <li>We read your request</li>
              <li>We confirm the tutor, price and next step</li>
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
                Start with a free guide before you book a lesson.
              </h2>

              <p className="section-intro">
                Use our free explanations and study guides when you want to work
                through a topic on your own first.
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

            <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <div className="eyebrow eyebrow-light">
              READY TO START?
            </div>

            <h2>
              Tell us what you need help with.
            </h2>

            <p>
              Tutoring starts from £20 an hour. Tell us your subject, level and what you’re working on, and we’ll confirm the price before you book.
            </p>
          </div>

          <TrackedLink
            className="button button-light button-large"
            href="/find-a-tutor"
            trackingId="home_footer_request_tutoring"
          >
            Request tutoring
          </TrackedLink>
        </div>
      </section>

      <div className="mobile-home-cta-spacer" aria-hidden="true" />

      <div className="mobile-home-cta" aria-label="Request tutoring">
        <TrackedLink
          className="button button-primary"
          href="/find-a-tutor"
          trackingId="home_mobile_sticky_request"
        >
          Request tutoring · from £20 an hour
        </TrackedLink>
      </div>

</>
  );
}
