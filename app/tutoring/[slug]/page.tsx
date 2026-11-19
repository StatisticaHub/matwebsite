import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import TutoringLeadForm from "@/components/TutoringLeadForm";
import { tutoringServices } from "@/lib/tutoring-services";
import {
  getHighIntentTutoringPage,
  highIntentTutoringPages,
} from "@/lib/high-intent-tutoring";

import ConversionFaq from "@/components/ConversionFaq";
import StickyTutoringCta from "@/components/StickyTutoringCta";
import ConversionProofBar from "@/components/ConversionProofBar";
import TrackedLink from "@/components/TrackedLink";
import { serviceConversionFaqs, specialistConversionFaqs } from "@/lib/seo-conversion";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export function generateStaticParams() {
  return [
    ...tutoringServices.map((service) => ({ slug: service.slug })),
    ...highIntentTutoringPages.map((page) => ({ slug: page.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const specialist = getHighIntentTutoringPage(slug);

  if (specialist) {
    const canonical = `${siteUrl}/tutoring/${specialist.slug}`;

    return {
      title: specialist.metaTitle,
      description: specialist.metaDescription,
      alternates: { canonical },
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "My Academic Tutor",
        title: specialist.metaTitle,
        description: specialist.metaDescription,
      },
      twitter: {
        card: "summary",
        title: specialist.metaTitle,
        description: specialist.metaDescription,
      },
    };
  }

  const service = tutoringServices.find((item) => item.slug === slug);

  if (!service) return {};

  const canonical = `${siteUrl}/tutoring/${service.slug}`;

  return {
    title: service.title,
    description: service.short,
    alternates: { canonical },
  };
}

function SpecialistPage({
  page,
}: {
  page: NonNullable<ReturnType<typeof getHighIntentTutoringPage>>;
}) {
  const pageUrl = `${siteUrl}/tutoring/${page.slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${pageUrl}#service`,
    name: page.title,
    serviceType: page.title,
    url: pageUrl,
    description: page.metaDescription,
    provider: { "@id": `${siteUrl}/#organisation` },
    areaServed: "Worldwide",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Tutoring", item: `${siteUrl}/tutoring` },
      { "@type": "ListItem", position: 3, name: page.title, item: pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="page-hero compact-hero">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">{page.eyebrow}</div>
            <h1>{page.hero}</h1>
            <p className="page-lead">{page.intro}</p>
            <div className="button-row">
              <TrackedLink className="button button-primary button-large" href="/find-a-tutor" trackingId={`specialist_${page.slug}_hero`}>
                Request tutoring
              </TrackedLink>
              <Link className="button button-secondary button-large" href="/tutoring">
                Explore tutoring services
              </Link>
            </div>
          </div>

          <aside className="card detail-card">
            <div className="eyebrow">GOOD FIT FOR</div>
            <h3>Focused support around the problem you are working on now.</h3>
            <ul className="check-list">
              {page.bestFor.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </aside>
        </div>
      </section>

      {/* specialist_conversion_proof_marker */}
      <ConversionProofBar />

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">TOPICS WE CAN WORK ON</div>
            <h2>Start from the exact concept, method or software skill.</h2>
            <div className="tag-row tags-large">
              {page.topics.map((topic) => <span className="tag" key={topic}>{topic}</span>)}
            </div>
          </div>

          <div>
            <div className="eyebrow">A TYPICAL SESSION</div>
            <h2>Explanation, application and independent practice.</h2>
            <div className="mini-timeline">
              {page.sessionFlow.map((item, index) => (
                <div key={item}><span>{index + 1}</span><p>{item}</p></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">WHAT PROGRESS CAN LOOK LIKE</div>
          <h2>The goal is to make you more independent.</h2>
          <div className="outcome-grid">
            {page.outcomes.map((item) => <article key={item}><strong>{item}</strong></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">RELATED SUPPORT</div>
            <h2>Continue from the problem to the wider subject.</h2>
            <div className="service-grid" style={{ gridTemplateColumns: "1fr" }}>
              {page.relatedLinks.map((item) => (
                <Link className="service-card" href={item.href} key={item.href}>
                  <h3>{item.label}</h3>
                  <span className="text-link">Explore this support</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="quote-card">
            <div className="eyebrow">ACADEMIC INTEGRITY</div>
            <strong>We teach the method; the academic work stays yours.</strong>
            <p>
              Sessions can explain concepts, review methods, practise analysis and help you interpret results. We do not complete assessed work, dissertations or research on a student’s behalf.
            </p>
            <Link className="text-link" href="/academic-integrity">Read our academic integrity approach</Link>
          </div>
        </div>
      </section>

            {/* specialist_conversion_faq_marker */}
      <ConversionFaq
        title={`Questions about ${page.title.toLowerCase()}`}
        items={specialistConversionFaqs(page.title, page.subject)}
      />

<section className="section section-soft">
        <div className="shell lead-section-grid">
          <div className="section-copy-block">
            <div className="eyebrow">PERSONALISED SUPPORT</div>
            <h2>Tell us what you are studying and where you are stuck.</h2>
            <p>
              Share your academic level and a short description of the topic, analysis or software problem. We’ll review the context and arrange suitable one-to-one support.
            </p>
          </div>

          <div className="card form-card">
            <TutoringLeadForm
              compact
              defaultSubject={page.subject}
              defaultSupportType={page.supportType}
              submitLabel={`Request ${page.title}`}
            />
          </div>
        </div>
      </section>
      {/* specialist_sticky_cta_marker */}
      <StickyTutoringCta label={`Request ${page.title}`} trackingId={`specialist_${page.slug}_sticky`} />
    </>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const specialist = getHighIntentTutoringPage(slug);

  if (specialist) {
    return <SpecialistPage page={specialist} />;
  }

  const service = tutoringServices.find((item) => item.slug === slug);
  if (!service) notFound();

  return (
    <>
      <section className="page-hero">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">{service.title.toUpperCase()}</div>
            <h1>{service.title}</h1>
            <p className="page-lead">{service.hero}</p>
            <div className="button-row">
              <TrackedLink href="/find-a-tutor" className="button button-primary button-large" trackingId={`service_${service.slug}_hero`}>Get this support</TrackedLink>
              <Link href="/tutoring" className="button button-secondary button-large">All tutoring services</Link>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-label">THIS CAN BE A GOOD FIT FOR</div>
            <ul className="check-list">{service.bestFor.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* service_conversion_proof_marker */}
      <ConversionProofBar />

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">WHAT WE CAN WORK ON</div>
            <h2>Support built around the actual academic task.</h2>
            <ul className="check-list">{service.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <div className="eyebrow">A TYPICAL SESSION</div>
            <h2>Explanation, practice and feedback in one learning loop.</h2>
            <div className="mini-timeline">
              {service.sessionFlow.map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">WHAT PROGRESS CAN LOOK LIKE</div>
          <h2>The goal is stronger independent work.</h2>
          <div className="outcome-grid">
            {service.outcomes.map((item) => <article key={item}><strong>{item}</strong></article>)}
          </div>
        </div>
      </section>

            {/* service_conversion_faq_marker */}
      <ConversionFaq
        title={`Questions about ${service.title.toLowerCase()}`}
        items={serviceConversionFaqs(service)}
      />

<section className="section">
        <div className="shell lead-section-grid">
          <div className="section-copy-block">
            <div className="eyebrow">DISCUSS YOUR LEARNING NEEDS</div>
            <h2>Tell us what you are studying and what you want to improve.</h2>
            <p>Share the course, topic, deadline or assessment context. We will review it and arrange suitable one-to-one academic support.</p>
            <p className="service-integrity-note">We teach, explain, review and guide. We do not complete assessed work on a student’s behalf.</p>
          </div>
          <div className="card form-card">
            <TutoringLeadForm compact defaultSupportType={service.defaultSupportType} submitLabel="Get personalised tutoring" />
          </div>
        </div>
      </section>
      {/* service_sticky_cta_marker */}
      <StickyTutoringCta label="Get personalised tutoring" trackingId={`service_${service.slug}_sticky`} />
    </>
  );
}
