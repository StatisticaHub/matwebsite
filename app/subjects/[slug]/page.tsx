import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import TutoringLeadForm from "@/components/TutoringLeadForm";
import { subjects } from "@/lib/tutoring-data";
import { getResourcesForSubject, resources } from "@/lib/resources";

import ConversionFaq from "@/components/ConversionFaq";
import StickyTutoringCta from "@/components/StickyTutoringCta";
import SubjectRelatedSupport from "@/components/SubjectRelatedSupport";
import TrackedLink from "@/components/TrackedLink";
import { subjectConversionFaqs } from "@/lib/seo-conversion";
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export function generateStaticParams() {
  return subjects.map((subject) => ({
    slug: subject.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const subject = subjects.find(
    (item) => item.slug === slug
  );

  if (!subject) {
    return {};
  }

  const canonical =
    `${siteUrl}/subjects/${subject.slug}`;

  const audienceText =
    subject.audiences.slice(0, 4).join(", ");

  const description =
    `Online ${subject.name} tutoring for ${audienceText}. Get one-to-one help with ${subject.topics
      .slice(0, 4)
      .join(", ")} and more.`;

  return {
    title:
      `Online ${subject.name} Tutor | One-to-One Tutoring`,

    description,

    alternates: {
      canonical,
    },

    openGraph: {
      type: "website",
      url: canonical,
      title:
        `Online ${subject.name} Tutoring | My Academic Tutor`,
      description,
      siteName: "My Academic Tutor",
    },

    twitter: {
      card: "summary",
      title:
        `Online ${subject.name} Tutoring | My Academic Tutor`,
      description,
    },
  };
}

function relatedResources(
  subjectName: string
) {
  const direct = resources.filter(
    (resource) =>
      resource.category.toLowerCase() ===
      subjectName.toLowerCase()
  );

  if (direct.length >= 3) {
    return direct.slice(0, 3);
  }

  return [
    ...direct,
    ...resources.filter(
      (resource) =>
        !direct.includes(resource)
    ),
  ].slice(0, 3);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const subject = subjects.find(
    (item) => item.slug === slug
  );

  if (!subject) {
    notFound();
  }

  const related =
    relatedResources(subject.name);

  const pageUrl =
    `${siteUrl}/subjects/${subject.slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",

    "@id": `${pageUrl}#service`,

    name:
      `${subject.name} Tutoring`,

    serviceType:
      `Online ${subject.name} tutoring`,

    url: pageUrl,

    description:
      subject.intro,

    provider: {
      "@id":
        `${siteUrl}/#organisation`,
    },

    areaServed: "Worldwide",

    audience: subject.audiences.map(
      (audience) => ({
        "@type": "Audience",
        audienceType: audience,
      })
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            serviceSchema
          ).replace(/</g, "\\u003c"),
        }}
      />

      <section className="page-hero compact-hero">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              {subject.name.toUpperCase()} TUTORING
            </div>

            <h1>
              Online {subject.name} tutoring for the course and level you are studying.
            </h1>

            <p className="page-lead">
              {subject.intro}
            </p>

            <p>
              We can arrange one-to-one tutoring for{" "}
              {subject.audiences.join(", ")} learners.
              Bring a single difficult topic, ongoing course work,
              exam preparation or an advanced technical question.
            </p>

            <div className="button-row">
              <TrackedLink
                className="button button-primary button-large"
                href={`/find-a-tutor?subject=${encodeURIComponent(subject.name)}`}
                trackingId={`subject_${subject.slug}_hero`}
              >
                Request {subject.name} tutoring
              </TrackedLink>

              <Link
                className="button button-secondary button-large"
                href="/learn"
              >
                Explore free resources
              </Link>
            </div>
          </div>

          <div className="card detail-card">
            <div className="eyebrow">
              TOPICS WE CAN COVER
            </div>

            <h3>
              Start with the topic that is giving you trouble.
            </h3>

            <div className="tag-row tags-large">
              {subject.topics.map(
                (topic) => (
                  <span
                    key={topic}
                    className="tag"
                  >
                    {topic}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">
              HOW TUTORING CAN HELP
            </div>

            <h2>
              Understand the method, then practise using it.
            </h2>

            <div className="mini-timeline">
              <div>
                <span>1</span>

                <p>
                  Pinpoint the concept, notation
                  or method that is causing trouble.
                </p>
              </div>

              <div>
                <span>2</span>

                <p>
                  Work through a useful example
                  together, step by step.
                </p>
              </div>

              <div>
                <span>3</span>

                <p>
                  Try a fresh problem yourself
                  with prompts and feedback
                  when you need them.
                </p>
              </div>

              <div>
                <span>4</span>

                <p>
                  Review mistakes and assumptions,
                  then finish with a clear idea of
                  what to practise next.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="eyebrow">
              WHO WE SUPPORT
            </div>

            <h2>
              Tutoring that changes with your level.
            </h2>

            <div className="audience-list">
              {subject.audiences.map(
                (audience) => (
                  <div key={audience}>
                    {audience}
                  </div>
                )
              )}
            </div>

            <ul className="check-list">
              {subject.outcomes.map(
                (outcome) => (
                  <li key={outcome}>
                    {outcome}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">RELATED TUTORING OPTIONS</div>
            <h2>Choose tutoring that fits how you are studying {subject.name.toLowerCase()}.</h2>
            <p>Choose a focused option below, or simply send us the topic if you are not sure which route fits.</p>
          </div>
          <SubjectRelatedSupport subjectSlug={subject.slug} />
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">
                FREE LEARNING RESOURCES
              </div>

              <h2>
                Review a topic in your own time.
              </h2>

              <p className="section-intro">
                Use the free guides to revisit important
                ideas before or after a tutoring session.
              </p>
            </div>

            <Link
              href="/learn"
              className="text-link"
            >
              Browse all learning resources
            </Link>
          </div>

          <div className="resource-grid">
            {related.map(
              (resource) => (
                <Link
                  href={`/learn/${resource.slug}`}
                  className="card resource-card"
                  key={resource.slug}
                >
                  <span>
                    {resource.category}
                  </span>

                  <h3>
                    {resource.title}
                  </h3>

                  <p>
                    {resource.description}
                  </p>

                  <small>
                    {resource.readTime} read
                  </small>
                </Link>
              )
            )}
          </div>
        </div>
      </section>

            <ConversionFaq
        title={`Common questions about ${subject.name.toLowerCase()} tutoring`}
        intro="A few practical answers about how one-to-one tutoring can work for this subject."
        items={subjectConversionFaqs(subject)}
      />

<section className="section section-soft">
        <div className="shell lead-section-grid">
          <div>
            <div className="eyebrow">
              REQUEST{" "}
              {subject.name.toUpperCase()} TUTORING
            </div>

            <h2>
              Tell us what you’re studying and where you’re stuck.
            </h2>

            <p>
              Send us your level and the specific
              topic or problem you are working on.
              We’ll read the request and match you
              with a suitable tutor.
            </p>

            <ul className="check-list">
              <li>
                One-to-one online sessions
              </li>

              <li>
                Tutoring matched to your course level
              </li>

              <li>
                Clear explanations and guided practice
              </li>

              <li>
                Flexible support as your needs change
              </li>
            </ul>
          </div>

          <div className="card form-card">
            <TutoringLeadForm
              compact
              defaultSubject={subject.name}
              submitLabel={`Request ${subject.name} tutoring`}
            />
          </div>
        </div>
      </section>
      <StickyTutoringCta
        label={`Request ${subject.name} tutoring`}
        trackingId={`subject_${subject.slug}_sticky`}
        href={`/find-a-tutor?subject=${encodeURIComponent(subject.name)}`}
      />
    </>
  );
}
