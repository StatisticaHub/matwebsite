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
              PERSONALISED, HUMAN-LED ONLINE TUTORING
            </div>

            <h1>
              Specialist one-to-one tutoring for difficult quantitative, technical and research subjects.
            </h1>

            <p className="hero-lead">
              Get personalised help with mathematics, statistics, sciences, computer science, data science, bioinformatics and research methods. Learn the method, practise with guidance and build the confidence to work independently.
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
              <span>Human-led specialist matching</span>
              <span>School to PhD & research</span>
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

      <ConversionProofBar />

      <section className="section home-tutoring-journey">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">HOW TUTORING WORKS</div>
            <h2>Tell us the problem. We organise the right support.</h2>
            <p>We review your academic context and match you with suitable human tutoring, so you can focus on learning rather than browsing tutor profiles.</p>
            <Link href="/tutors" className="text-link">See our tutor standards</Link>
          </div>
          <div className="conversion-journey">
            <article><span>1</span><h3>Tell us what you need</h3><p>Share your subject, academic level and the exact topic or difficulty.</p></article>
            <article><span>2</span><h3>We review and match</h3><p>We review your level, topic and goals, then identify a suitable available tutor.</p></article>
            <article><span>3</span><h3>Start learning one-to-one</h3><p>Work through explanation, examples and guided practice around your priorities.</p></article>
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

            <section className="section section-tint">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">POPULAR SPECIALIST SUPPORT</div>
            <h2>Start with the exact subject, method or software problem.</h2>
            <p>These focused tutoring pages connect common student needs to the wider subject support available across My Academic Tutor.</p>
          </div>
          <HighIntentLinkGrid />
        </div>
      </section>

      <section className="section home-pricing-section" id="pricing">
        <div className="shell home-pricing-grid">
          <div className="section-copy-block">
            <div className="eyebrow">CLEAR PRICING</div>

            <h2>One-to-one tutoring from £20 per hour.</h2>

            <p className="section-intro">
              The final quotation depends on your subject, course level, tutor
              specialism and what you need help with. Tell us your requirements
              and we will confirm the rate before you book.
            </p>

            <TrackedLink
              className="button button-primary"
              href="/find-a-tutor"
              trackingId="home_pricing_request_tutoring"
            >
              Get a tutoring quotation
            </TrackedLink>
          </div>

          <aside className="home-pricing-card" aria-label="Tutoring pricing">
            <span className="home-pricing-label">Tutoring starts from</span>

            <div className="home-price-amount">
              £20
              <span>/hour</span>
            </div>

            <p>
              Get in touch for a quotation based on your course level,
              subject and requirements.
            </p>

            <small>
              No obligation from submitting an enquiry. Your rate is confirmed
              before tutoring is arranged.
            </small>
          </aside>
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
              Tell us your subject, level and what you need help with. Tutoring starts from £20/hour, with the final rate confirmed before you book.
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
          Request tutoring · from £20/hour
        </TrackedLink>
      </div>

</>
  );
}
