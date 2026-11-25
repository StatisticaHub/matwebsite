import Link from "next/link";

import ConversionProofBar from "@/components/ConversionProofBar";
import TestimonialCard from "@/components/TestimonialCard";
import TutoringLeadForm from "@/components/TutoringLeadForm";

import {
  marketPages,
  type MarketSlug,
} from "@/lib/market-pages";

import {
  dataAnalysisLeadSource,
  dataAnalysisMarketPages,
} from "@/lib/market-data-analysis-pages";

import { getApprovedTestimonials } from "@/lib/testimonials";

type Props = {
  market: MarketSlug;
};

export default async function MarketDataAnalysisPage({
  market,
}: Props) {
  const config = marketPages[market];
  const page = dataAnalysisMarketPages[market];

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

  const quantitativeTestimonials =
    approvedTestimonials.filter(
      (testimonial) => {
        const context = [
          testimonial.subject,
          testimonial.display_context,
          testimonial.academic_level,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return [
          "stat",
          "data",
          "econom",
          "research",
          "r programming",
          "spss",
        ].some((term) =>
          context.includes(term),
        );
      },
    );

  const testimonials = [
    ...preferredTestimonials,
    ...quantitativeTestimonials,
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
    name:
      `R, SPSS, Stata and data analysis tutoring in ${config.country}`,
    serviceType:
      "Online statistical software and data analysis tutoring",
    url:
      `${siteUrl}/${market}/r-spss-data-analysis`,
    provider: {
      "@type": "Organization",
      name: "My Academic Tutor",
      url: siteUrl,
    },
    areaServed: {
      "@type": "Country",
      name: config.country,
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

      {/* HERO */}

      <section className="market-hero data-analysis-market-hero">
        <div className="shell market-hero-grid">
          <div className="market-hero-copy">
            <div className="eyebrow">
              {config.flag} STATISTICAL SOFTWARE & DATA
            </div>

            <h1>{page.headline}</h1>

            <p className="page-lead">
              {page.lead}
            </p>

            <div className="market-hero-actions">
              <a
                href="#data-analysis-enquiry"
                className="button button-primary button-large"
              >
                Request data analysis tutoring
              </a>

              <Link
                href={`/${market}/statistics`}
                className="button button-secondary button-large"
              >
                Statistics tutoring
              </Link>
            </div>

            <div className="market-trust-row">
              <span>Live 1:1 tutoring</span>
              <span>R · SPSS · Stata · Python</span>
              <span>Ages 18+</span>
              <span>Academic integrity protected</span>
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
              SOFTWARE + STATISTICS
            </span>

            <h2>
              Understand the analysis, not just the
              commands.
            </h2>

            <p>
              A tutor can help you connect your research
              question to an appropriate statistical
              method, implement it in software and
              interpret what the results mean.
            </p>

            <div className="market-price-card">
              <strong>{config.priceTitle}</strong>
              <p>{config.priceCopy}</p>
            </div>
          </aside>
        </div>
      </section>

      <ConversionProofBar />

      {/* SOFTWARE */}

      <section className="section">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              SOFTWARE TUTORING
            </div>

            <h2>
              Learn the tools used in quantitative
              courses and research.
            </h2>

            <p>
              The goal is not simply to reproduce code.
              You should understand what the analysis is
              doing and how to explain the result.
            </p>
          </div>

          <div className="data-analysis-software-grid">
            {page.software.map((software) => (
              <article key={software.name}>
                <span>{software.name}</span>

                <p>{software.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* METHODS */}

      <section className="section section-soft">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              DATA ANALYSIS METHODS
            </div>

            <h2>
              Software makes more sense when the
              statistics makes sense.
            </h2>
          </div>

          <div className="statistics-topic-grid">
            {page.methods.map((method) => (
              <article key={method}>
                <span aria-hidden="true">∑</span>
                <strong>{method}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW */}

      <section className="section">
        <div className="shell">
          <div className="market-section-heading">
            <div className="eyebrow">
              ANALYTICAL WORKFLOW
            </div>

            <h2>
              Learn how the pieces fit together.
            </h2>
          </div>

          <div className="market-process-grid">
            <article>
              <span>01</span>
              <h3>Clarify the question</h3>
              <p>
                Identify the outcome, variables, study
                design and statistical question before
                choosing software commands.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Choose the method</h3>
              <p>
                Understand why a test, model or
                analytical approach is appropriate and
                what assumptions it relies on.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Run and interpret it</h3>
              <p>
                Use the software correctly, read the
                output and translate statistical results
                into clear interpretation.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* CONTEXT */}

      <section className="section section-soft">
        <div className="shell market-context-grid">
          <div>
            <div className="eyebrow">
              WHERE THIS SUPPORT FITS
            </div>

            <h2>
              Built around your academic context.
            </h2>

            <p>
              Sessions can support software learning,
              quantitative modules, statistical methods
              and research-methods understanding.
            </p>

            <ul className="market-context-list">
              {page.studyContexts.map((context) => (
                <li key={context}>
                  {context}
                </li>
              ))}
            </ul>
          </div>

          <article className="market-timing-card">
            <span>ACADEMIC INTEGRITY</span>

            <h3>
              Guidance without completing assessed work
              for you.
            </h3>

            <p>
              Tutors can teach software, explain
              statistical methods, demonstrate examples,
              review your reasoning and help you
              understand output.
            </p>

            <p>
              Your assessed analysis, dissertation,
              examination or submission remains your
              own work.
            </p>

            <Link
              href="/academic-integrity"
              className="text-link"
            >
              Academic integrity →
            </Link>
          </article>
        </div>
      </section>

      {/* TESTIMONIALS */}

      {testimonials.length ? (
        <section className="section">
          <div className="shell">
            <div className="market-section-heading market-heading-row">
              <div>
                <div className="eyebrow">
                  STUDENT EXPERIENCES
                </div>

                <h2>
                  Feedback from students learning with
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

      {/* ENQUIRY */}

      <section
        id="data-analysis-enquiry"
        className="section market-enquiry-section"
      >
        <div className="shell market-enquiry-grid">
          <div className="market-enquiry-copy">
            <div className="eyebrow">
              REQUEST DATA ANALYSIS TUTORING
            </div>

            <h2>
              Tell us the software, method and course
              you are working with.
            </h2>

            <p>
              In the request, mention whether you need
              help with R, SPSS, Stata, Python or a
              particular statistical method.
            </p>

            <div className="market-enquiry-notes">
              <div>
                <strong>Statistics preselected</strong>
                <span>
                  This gives us the correct quantitative
                  subject context immediately.
                </span>
              </div>

              <div>
                <strong>{config.currency} quote context</strong>
                <span>
                  We confirm the proposed support and
                  exact price before anything is booked.
                </span>
              </div>

              <div>
                <strong>Explain what you need</strong>
                <span>
                  Include the software, topic, course
                  and what you are finding difficult.
                </span>
              </div>
            </div>
          </div>

          <div className="card form-card form-card-large">
            <TutoringLeadForm
              defaultSubject="Statistics"
              defaultCountry={config.country}
              defaultCurrency={config.currency}
              defaultSource={dataAnalysisLeadSource(
                market,
              )}
            />
          </div>
        </div>
      </section>

      {/* RELATED */}

      <section className="market-switcher">
        <div className="shell market-switcher-inner">
          <span>
            Related tutoring
          </span>

          <nav aria-label="Related tutoring pages">
            <Link href={`/${market}/statistics`}>
              Statistics tutoring
            </Link>

            <Link href={`/${market}`}>
              {config.flag} All {config.country} tutoring
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
