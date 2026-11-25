import { learningHubIndexTutoringHref } from "@/lib/learning-hub-conversion";
import type { Metadata } from "next";
import Link from "next/link";

import LearningHubExplorer from "@/components/LearningHubExplorer";
import LearningResourceCard from "@/components/LearningResourceCard";
import TrackedLink from "@/components/TrackedLink";
import { getCategoryCounts, getFeaturedResources, learningHubStats } from "@/lib/learning-hub";
import { resourceCategories, resources } from "@/lib/resources";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const metadata: Metadata = {
  title: "Learning Hub | Statistics, R, SPSS, Research & Data Guides",
  description:
    "Free, education-first guides across statistics, medical statistics, R, SPSS, econometrics, data science, bioinformatics, mathematics and research methods.",
  alternates: { canonical: `${siteUrl}/learn` },
  openGraph: {
    type: "website",
    url: `${siteUrl}/learn`,
    siteName: "My Academic Tutor",
    title: "My Academic Tutor Learning Hub",
    description:
      "Practical academic guides that explain difficult quantitative and research topics clearly.",
  },
};

export default function Page() {
  const categories = getCategoryCounts();
  const featured = getFeaturedResources(6);

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "My Academic Tutor Learning Hub",
    url: `${siteUrl}/learn`,
    description: metadata.description,
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: featured.map((resource, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: resource.title,
        url: `${siteUrl}/learn/${resource.slug}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="page-hero learning-hub-hero">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">LEARNING HUB</div>
            <h1>Understand the method before you memorise the steps.</h1>
            <p className="page-lead">
              Free academic guides across statistics, medical statistics, R, SPSS,
              econometrics, data science, bioinformatics, mathematics and research methods.
              Each guide is written to help you reason through the topic, not just copy a formula.
            </p>
            <div className="button-row">
              <a className="button button-primary button-large" href="#all-guides">Browse all guides</a>
              <TrackedLink
                className="button button-secondary button-large"
                href={learningHubIndexTutoringHref()}
                trackingId="learning_hub_hero_tutoring"
                contentType="learning_hub_cta"
              >
                Get personalised tutoring
              </TrackedLink>
            </div>
          </div>

          <aside className="card learning-hub-summary-card">
            <div className="eyebrow">BUILT FOR ACTIVE LEARNING</div>
            <div className="learning-hub-stat-grid">
              <div><strong>{learningHubStats.guides}</strong><span>guides</span></div>
              <div><strong>{learningHubStats.categories}</strong><span>topic areas</span></div>
              <div><strong>1:1</strong><span>support when needed</span></div>
            </div>
            <p>
              Start with a free explanation. If the difficult part is still unclear,
              continue the same topic with a tutor who can adapt the explanation to your course.
            </p>
            <Link href="/learn/editorial-policy" className="text-link">How our learning content is organised</Link>
          </aside>
        </div>
      </section>

      <section className="section section-soft learning-category-section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">TOPIC HUBS</div>
              <h2>Follow a subject path instead of opening random articles.</h2>
              <p>Each hub groups related guides and connects the topic to the relevant tutoring route.</p>
            </div>
          </div>

          <div className="learning-category-grid">
            {categories.map((category) => (
              <Link key={category.slug} href={`/learn/${category.slug}`} className="card learning-category-card">
                <span>{category.count} guide{category.count === 1 ? "" : "s"}</span>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <strong className="text-link">Explore {category.name}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">FEATURED GUIDES</div>
              <h2>Start with the topics students repeatedly need to reason through.</h2>
            </div>
          </div>
          <div className="resource-grid resource-grid-page">
            {featured.map((resource) => (
              <LearningResourceCard key={resource.slug} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint" id="all-guides">
        <div className="shell">
          <div className="section-head learning-all-guides-head">
            <div>
              <div className="eyebrow">ALL LEARNING RESOURCES</div>
              <h2>Search by concept, method, software or subject.</h2>
              <p>Use the filter to narrow the library without losing the full crawlable guide directory.</p>
            </div>
          </div>
          <LearningHubExplorer resources={resources} categories={resourceCategories} />
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <div className="eyebrow eyebrow-light">NEED MORE THAN A GUIDE?</div>
            <h2>Work through the exact point where your reasoning gets stuck.</h2>
            <p>Tell us your course, level and topic. We can arrange one-to-one teaching around it.</p>
          </div>
          <TrackedLink
            className="button button-light button-large"
            href={learningHubIndexTutoringHref()}
            trackingId="learning_hub_bottom_tutoring"
            contentType="learning_hub_cta"
          >
            Get personalised tutoring
          </TrackedLink>
        </div>
      </section>
    </>
  );
}
