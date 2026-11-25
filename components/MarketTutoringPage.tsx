import Link from "next/link";

import ConversionProofBar from "@/components/ConversionProofBar";
import TestimonialCard from "@/components/TestimonialCard";
import TutoringLeadForm from "@/components/TutoringLeadForm";

import {
  marketPages,
  marketSlugs,
  type MarketSlug,
} from "@/lib/market-pages";

import { getApprovedTestimonials } from "@/lib/testimonials";

type Props = {
  market: MarketSlug;
};

export default async function MarketTutoringPage({
  market,
}: Props) {
  const config = marketPages[market];

  const approvedTestimonials =
    await getApprovedTestimonials({
      featuredFirst: true,
      limit: 30,
    });

  const preferredTestimonials =
    config.preferredTestimonials
      .map((name) =>
        approvedTestimonials.find(
          (testimonial) =>
            testimonial.display_name
              .trim()
              .toLowerCase() ===
            name.trim().toLowerCase(),
        ),
      )
      .filter(Boolean) as typeof approvedTestimonials;

  const remainingTestimonials =
    approvedTestimonials.filter(
      (testimonial) =>
        !preferredTestimonials.some(
          (preferred) =>
            preferred.id === testimonial.id,
        ),
    );

  const testimonials = [
    ...preferredTestimonials,
    ...remainingTestimonials,
  ].slice(0, 3);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(
      /\/$/,
      "",
    ) || "https://www.myacademictutor.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Online tutoring for ${config.country}`,
    serviceType: "One-to-one online tutoring",
    url: `${siteUrl}/${config.slug}`,
    provider: {
      "@type": "Organization",
      name: "My Academic Tutor",
      url: siteUrl,
    },
    areaServed: {
      "@type": "Country",
      name: config.country,
    },
    audience: {
      "@type": "EducationalAudience",
      audienceType:
        "Adult university and postgraduate students",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />

      {/* ============================================================
          MARKET HERO
          ============================================================ */}

      <section className="market-hero">
        <div className="shell market-hero-grid">
          <div className="market-hero-copy">
            <div className="eyebrow">
              {config.eyebrow}
            </div>

            <h1>{config.headline}</h1>

            <p className="page-lead">
              {config.lead}
            </p>

            <div className="market-hero-actions">
              <a
                href="#market-enquiry"
                className="button button-primary button-large"
              >
                Request tutoring
              </a>

              <Link
                href="/how-it-works"
                className="button button-secondary button-large"
              >
                See how tutoring works
              </Link>
            </div>

            <div
              className="market-trust-row"
              aria-label={`${config.country} tutoring highlights`}
            >
              <span>Live 1:1 online</span>
              <span>Ages 18+</span>
              <span>No obligation to enquire</span>
              <span>Price confirmed first</span>
            </div>
          </div>

          <aside className="market-hero-panel">
            <div className="market-country-badge">
              <span aria-hidden="true">
                {config.flag}
              </span>
              <strong>{config.country}</strong>
            </div>

            <span className="market-panel-label">
              PERSONALISED SUPPORT
            </span>

            <h2>
              Start with the academic problem.
            </h2>

            <p>
              Tell us the subject, academic level,
              topic and goal. We review the request
              before proposing the next step.
            </p>

            <div className="market-price-card">
              <strong>{config.priceTitle}</strong>
              <p>{config.priceCopy}</p>
            </div>

            <small>{config.audienceLabel}</small>
          </aside>
        </div>
      </section>

      <ConversionProofBar />

      {/* ============================================================
          SPECIALIST POSITIONING
          ============================================================ */}

      <section className="section">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              SPECIALIST ACADEMIC SUPPORT
            </div>

            <h2>
              Particularly strong for quantitative and
              research-focused study.
            </h2>

            <p>
              MAT can support broader academic subjects,
              but our strongest online tutoring areas
              include statistics, data and quantitative
              methods.
            </p>
          </div>

          <div className="market-specialism-grid">
            {config.specialistAreas.map(
              (area) => (
                <article key={area}>
                  <span aria-hidden="true">✓</span>
                  <strong>{area}</strong>
                </article>
              ),
            )}
          </div>

          <div className="market-inline-links">
            <Link href={`/${config.slug}/statistics`}>
              Statistics tutoring in {config.country} →
            </Link>

            <Link href="/subjects/statistics">
              Explore the statistics subject guide →
            </Link>

            <Link href="/subjects">
              View all subjects →
            </Link>

            <Link href="/learn">
              Browse the free Learning Hub →
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          LOCAL STUDY CONTEXT
          ============================================================ */}

      <section className="section section-soft">
        <div className="shell market-context-grid">
          <div>
            <div className="eyebrow">
              {config.country.toUpperCase()} STUDY CONTEXT
            </div>

            <h2>
              Support can follow the course you are
              actually taking.
            </h2>

            <p>
              A tutoring request can be based around one
              difficult concept, a short run of sessions,
              exam preparation or continuing support
              across a module.
            </p>

            <ul className="market-context-list">
              {config.studyContexts.map(
                (context) => (
                  <li key={context}>
                    {context}
                  </li>
                ),
              )}
            </ul>
          </div>

          <article className="market-timing-card">
            <span>SESSION TIMING</span>

            <h3>{config.timingTitle}</h3>

            <p>{config.timingCopy}</p>

            <small>
              Final scheduling depends on tutor
              availability and the student's preferred
              times.
            </small>
          </article>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}

      <section className="section">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              HOW IT WORKS
            </div>

            <h2>
              From enquiry to focused one-to-one
              learning.
            </h2>
          </div>

          <div className="market-process-grid">
            <article>
              <span>01</span>

              <h3>Tell us what you need</h3>

              <p>
                Share the subject, academic level,
                topic, goal, timing and anything else
                that will help us understand the
                academic need.
              </p>
            </article>

            <article>
              <span>02</span>

              <h3>We review the request</h3>

              <p>
                We consider the required depth,
                teaching need and practical fit before
                proposing suitable support.
              </p>
            </article>

            <article>
              <span>03</span>

              <h3>You decide whether to proceed</h3>

              <p>
                We confirm the proposed next step and
                price. Sending an enquiry does not book
                a lesson or take payment.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIALS
          ============================================================ */}

      {testimonials.length ? (
        <section className="section section-soft">
          <div className="shell">
            <div className="market-section-heading market-heading-row">
              <div>
                <div className="eyebrow">
                  STUDENT EXPERIENCES
                </div>

                <h2>
                  Feedback from students who have
                  learned with MAT.
                </h2>
              </div>

              <Link href="/testimonials">
                Read all feedback →
              </Link>
            </div>

            <div className="testimonial-grid">
              {testimonials.map(
                (testimonial) => (
                  <TestimonialCard
                    key={testimonial.id}
                    testimonial={testimonial}
                  />
                ),
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============================================================
          ENQUIRY
          ============================================================ */}

      <section
        id="market-enquiry"
        className="section market-enquiry-section"
      >
        <div className="shell market-enquiry-grid">
          <div className="market-enquiry-copy">
            <div className="eyebrow">
              REQUEST TUTORING
            </div>

            <h2>
              Tell us what you are studying and where
              you need help.
            </h2>

            <p>
              This form goes directly into the MAT
              tutoring workflow. We review the academic
              context before suggesting the next step.
            </p>

            <div className="market-enquiry-notes">
              <div>
                <strong>18+ enquiries only</strong>
                <span>
                  Personalised tutoring is currently
                  available only to adult learners.
                </span>
              </div>

              <div>
                <strong>
                  No booking on submission
                </strong>
                <span>
                  You review the proposed support and
                  price before deciding.
                </span>
              </div>

              <div>
                <strong>
                  Academically responsible
                </strong>
                <span>
                  We teach and guide; assessed work
                  remains your own.
                </span>
              </div>
            </div>
          </div>

          <div className="card form-card form-card-large">
            <TutoringLeadForm
              defaultCountry={config.country}
              defaultCurrency={config.currency}
              defaultSource={`market_${config.slug}`}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          MARKET SWITCHER
          ============================================================ */}

      <section className="market-switcher">
        <div className="shell market-switcher-inner">
          <span>Other MAT regions</span>

          <nav aria-label="International tutoring regions">
            {marketSlugs
              .filter(
                (slug) => slug !== market,
              )
              .map((slug) => {
                const item = marketPages[slug];

                return (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                  >
                    {item.flag} {item.country}
                  </Link>
                );
              })}
          </nav>
        </div>
      </section>
    </>
  );
}
