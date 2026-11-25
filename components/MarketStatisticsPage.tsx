import Link from "next/link";

import ConversionProofBar from "@/components/ConversionProofBar";
import TestimonialCard from "@/components/TestimonialCard";
import TutoringLeadForm from "@/components/TutoringLeadForm";

import {
  marketPages,
  type MarketSlug,
} from "@/lib/market-pages";

import {
  statisticsLeadSource,
  statisticsMarketPages,
} from "@/lib/market-statistics-pages";

import { getApprovedTestimonials } from "@/lib/testimonials";

type Props = {
  market: MarketSlug;
};

export default async function MarketStatisticsPage({
  market,
}: Props) {
  const config = marketPages[market];
  const page = statisticsMarketPages[market];

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

  const statisticsTestimonials =
    approvedTestimonials.filter((testimonial) =>
      [
        testimonial.subject,
        testimonial.display_context,
        testimonial.academic_level,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes("stat"),
    );

  const testimonials = [
    ...preferredTestimonials,
    ...statisticsTestimonials,
    ...approvedTestimonials,
  ]
    .filter(
      (testimonial, index, array) =>
        array.findIndex(
          (candidate) =>
            candidate.id === testimonial.id,
        ) === index,
    )
    .slice(0, 3);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(
      /\/$/,
      "",
    ) || "https://www.myacademictutor.com";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Online statistics tutoring in ${config.country}`,
    serviceType: "Online statistics tutoring",
    url: `${siteUrl}/${market}/statistics`,
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
          HIGH-INTENT HERO
          ============================================================ */}

      <section className="market-hero statistics-market-hero">
        <div className="shell market-hero-grid">
          <div className="market-hero-copy">
            <div className="eyebrow">
              {config.flag} ONLINE STATISTICS TUTORING
            </div>

            <h1>{page.headline}</h1>

            <p className="page-lead">
              {page.lead}
            </p>

            <div className="market-hero-actions">
              <a
                href="#statistics-enquiry"
                className="button button-primary button-large"
              >
                Request a statistics tutor
              </a>

              <Link
                href="/learn"
                className="button button-secondary button-large"
              >
                Explore free statistics lessons
              </Link>
            </div>

            <div
              className="market-trust-row"
              aria-label="Statistics tutoring highlights"
            >
              <span>Live one-to-one teaching</span>
              <span>University & postgraduate</span>
              <span>Ages 18+</span>
              <span>No booking until you agree</span>
            </div>
          </div>

          <aside className="market-hero-panel statistics-hero-panel">
            <div className="market-country-badge">
              <span aria-hidden="true">
                {config.flag}
              </span>
              <strong>{config.country}</strong>
            </div>

            <span className="market-panel-label">
              STATISTICS SUPPORT
            </span>

            <h2>
              Bring the topic that is not clicking.
            </h2>

            <ul className="statistics-hero-list">
              <li>Probability</li>
              <li>Hypothesis testing</li>
              <li>Regression</li>
              <li>Statistical inference</li>
              <li>R / SPSS / Stata</li>
              <li>Research methods</li>
            </ul>

            <div className="market-price-card">
              <strong>{config.priceTitle}</strong>
              <p>{config.priceCopy}</p>
            </div>
          </aside>
        </div>
      </section>

      <ConversionProofBar />

      {/* ============================================================
          WHAT WE CAN TEACH
          ============================================================ */}

      <section className="section">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              STATISTICS TOPICS
            </div>

            <h2>
              Build understanding from the method
              upwards.
            </h2>

            <p>
              Sessions can focus on a single difficult
              topic or follow your statistics module
              over time.
            </p>
          </div>

          <div className="statistics-topic-grid">
            {page.topics.map((topic) => (
              <article key={topic}>
                <span aria-hidden="true">∑</span>
                <strong>{topic}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          COURSE CONTEXT + SOFTWARE
          ============================================================ */}

      <section className="section section-soft">
        <div className="shell market-context-grid">
          <div>
            <div className="eyebrow">
              COURSE CONTEXT
            </div>

            <h2>
              Statistics tutoring that follows your
              actual course.
            </h2>

            <p>
              Tell us what you are studying, the depth
              expected by your course and the areas
              causing difficulty.
            </p>

            <ul className="market-context-list">
              {page.contexts.map((context) => (
                <li key={context}>
                  {context}
                </li>
              ))}
            </ul>
          </div>

          <article className="market-timing-card statistics-software-card">
            <span>STATISTICAL SOFTWARE</span>

            <h3>
              Learn the analysis and the interpretation.
            </h3>

            <p>
              Software tutoring is most useful when you
              understand both what to run and why the
              method is appropriate.
            </p>

            <div className="statistics-software-list">
              {page.software.map((software) => (
                <strong key={software}>
                  {software}
                </strong>
              ))}
            </div>

            <small>
              Software support depends on the academic
              context and tutor availability.
            </small>
          </article>
        </div>
      </section>

      {/* ============================================================
          HOW A SESSION CAN HELP
          ============================================================ */}

      <section className="section">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              ONE-TO-ONE LEARNING
            </div>

            <h2>
              What can happen in a statistics session?
            </h2>
          </div>

          <div className="market-specialism-grid">
            {page.examples.map((example) => (
              <article key={example}>
                <span aria-hidden="true">✓</span>
                <strong>{example}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ACADEMIC INTEGRITY
          ============================================================ */}

      <section className="section section-soft">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              ACADEMICALLY RESPONSIBLE SUPPORT
            </div>

            <h2>
              We teach the statistics. We do not replace
              your assessed work.
            </h2>

            <p>
              Tutors can explain concepts, demonstrate
              methods with appropriate examples, review
              your reasoning, help you practise and
              teach statistical software.
            </p>

            <p>
              Assessed assignments, examinations,
              dissertations and other submissions must
              remain your own work.
            </p>

            <Link
              href="/academic-integrity"
              className="text-link"
            >
              Read our academic integrity approach →
            </Link>
          </div>

          <div className="quote-card">
            <div className="eyebrow">
              THE GOAL
            </div>

            <strong>
              Be able to explain what you did and why.
            </strong>

            <p>
              Good statistics tutoring should leave you
              more able to choose, apply and interpret
              methods independently.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
          TESTIMONIALS
          ============================================================ */}

      {testimonials.length ? (
        <section className="section">
          <div className="shell">
            <div className="market-section-heading market-heading-row">
              <div>
                <div className="eyebrow">
                  STUDENT EXPERIENCES
                </div>

                <h2>
                  What students say about learning with
                  MAT.
                </h2>
              </div>

              <Link href="/testimonials">
                Read all feedback →
              </Link>
            </div>

            <div className="testimonial-grid">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ============================================================
          ENQUIRY FORM
          ============================================================ */}

      <section
        id="statistics-enquiry"
        className="section market-enquiry-section"
      >
        <div className="shell market-enquiry-grid">
          <div className="market-enquiry-copy">
            <div className="eyebrow">
              REQUEST STATISTICS TUTORING
            </div>

            <h2>
              Tell us the statistics you need help
              understanding.
            </h2>

            <p>
              Include your course, academic level, topic
              and any useful timing information. The
              Statistics subject and your country are
              already selected for you.
            </p>

            <div className="market-enquiry-notes">
              <div>
                <strong>Statistics preselected</strong>
                <span>
                  You can still change the subject in
                  the form if needed.
                </span>
              </div>

              <div>
                <strong>
                  {config.currency} quote context
                </strong>
                <span>
                  Your exact tutoring rate is confirmed
                  before you decide whether to book.
                </span>
              </div>

              <div>
                <strong>No assignment completion</strong>
                <span>
                  Tutoring is for explanation, guided
                  practice and independent learning.
                </span>
              </div>
            </div>
          </div>

          <div className="card form-card form-card-large">
            <TutoringLeadForm
              defaultSubject="Statistics"
              defaultCountry={config.country}
              defaultCurrency={config.currency}
              defaultSource={statisticsLeadSource(
                market,
              )}
            />
          </div>
        </div>
      </section>

      {/* ============================================================
          RELATED PATHS
          ============================================================ */}

      <section className="market-switcher">
        <div className="shell market-switcher-inner">
          <span>
            More tutoring in {config.country}
          </span>

          <nav aria-label="Related tutoring pages">
            <Link href={`/${market}`}>
              {config.flag} All {config.country} tutoring
            </Link>

            <Link href="/subjects/statistics">
              Statistics subject guide
            </Link>

            <Link href={`/${market}/r-spss-data-analysis`}>
              R, SPSS, Stata & data analysis
            </Link>

            <Link href="/learn">
              Free Learning Hub
            </Link>
          </nav>
        </div>
      </section>
    </>
  );
}
