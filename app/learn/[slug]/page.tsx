import {
  learningHubCategoryTutoringHref,
  learningHubResourceTutoringHref,
} from "@/lib/learning-hub-conversion";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import LearningBreadcrumbs from "@/components/LearningBreadcrumbs";
import LearningResourceCard from "@/components/LearningResourceCard";
import TrackedLink from "@/components/TrackedLink";
import {
  getRelatedResources,
  getResource,
  getResourceCategory,
  getResourcesByCategory,
  resourceCategories,
  resources,
} from "@/lib/resources";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export function generateStaticParams() {
  return [
    ...resources.map((resource) => ({ slug: resource.slug })),
    ...resourceCategories.map((category) => ({ slug: category.slug })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getResourceCategory(slug);

  if (category) {
    const canonical = `${siteUrl}/learn/${category.slug}`;
    return {
      title: `${category.name} Guides | Learning Hub`,
      description: category.description,
      alternates: { canonical },
      openGraph: {
        type: "website",
        url: canonical,
        siteName: "My Academic Tutor",
        title: `${category.name} Guides | My Academic Tutor`,
        description: category.description,
      },
    };
  }

  const resource = getResource(slug);
  if (!resource) return {};

  const canonical = `${siteUrl}/learn/${resource.slug}`;

  return {
    title: resource.title,
    description: resource.description,
    keywords: resource.keywords,
    authors: [{ name: "My Academic Tutor Academic Team", url: `${siteUrl}/about` }],
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: "My Academic Tutor",
      title: resource.title,
      description: resource.description,
      publishedTime: resource.publishedAt,
      modifiedTime: resource.updatedAt,
      section: resource.category,
      tags: resource.keywords,
    },
    twitter: {
      card: "summary",
      title: resource.title,
      description: resource.description,
    },
  };
}

function CategoryPage({ slug }: { slug: string }) {
  const category = getResourceCategory(slug);
  if (!category) notFound();

  const categoryResources = getResourcesByCategory(category.slug);
  const pageUrl = `${siteUrl}/learn/${category.slug}`;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Learning Hub", item: `${siteUrl}/learn` },
      { "@type": "ListItem", position: 3, name: category.name, item: pageUrl },
    ],
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} learning guides`,
    description: category.description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categoryResources.map((resource, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: resource.title,
        url: `${siteUrl}/learn/${resource.slug}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c") }} />

      <section className="page-hero compact-hero learning-category-hero">
        <div className="shell narrow">
          <LearningBreadcrumbs items={[{ label: "Learning Hub", href: "/learn" }, { label: category.name }]} />
          <div className="eyebrow">{category.name.toUpperCase()} · LEARNING HUB</div>
          <h1>{category.name} guides for deeper understanding.</h1>
          <p className="page-lead">{category.description}</p>
          <div className="button-row">
            <a className="button button-primary" href="#guides">Browse {categoryResources.length} guides</a>
            {category.tutoringHref ? (
              <TrackedLink
                href={category.tutoringHref}
                className="button button-secondary"
                trackingId={`learn_category_${category.slug}_tutoring`}
                contentType="learning_hub_cta"
              >
                {category.tutoringLabel ?? "Get tutoring"}
              </TrackedLink>
            ) : null}
          </div>
        </div>
      </section>

      <section className="section" id="guides">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">GUIDE DIRECTORY</div>
              <h2>Build the topic one idea at a time.</h2>
              <p>Start with the guide closest to your current course problem, then follow the related-reading links.</p>
            </div>
          </div>
          <div className="resource-grid resource-grid-page">
            {categoryResources.map((resource) => (
              <LearningResourceCard key={resource.slug} resource={resource} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">USE THE HUB ACTIVELY</div>
            <h2>Read → explain → practise → check.</h2>
            <div className="mini-timeline">
              <div><span>1</span><p>Read one guide with a specific question in mind.</p></div>
              <div><span>2</span><p>Close it and explain the idea in your own words.</p></div>
              <div><span>3</span><p>Work through a fresh example without copying the guide.</p></div>
              <div><span>4</span><p>Use the point where you get stuck to decide what to revise or ask a tutor.</p></div>
            </div>
          </div>
          <div className="card learning-category-support-card">
            <div className="eyebrow">ONE-TO-ONE SUPPORT</div>
            <h3>Need the explanation adapted to your module?</h3>
            <p>Share the notation, software, assignment context or method your course is using. Tutoring can build directly from the same topic.</p>
            {category.tutoringHref ? (
              <TrackedLink
                href={category.tutoringHref}
                className="button button-primary"
                trackingId={`learn_category_${category.slug}_bottom`}
                contentType="learning_hub_cta"
              >
                {category.tutoringLabel ?? "Get tutoring"}
              </TrackedLink>
            ) : (
              <TrackedLink href={learningHubCategoryTutoringHref(category.slug, category.name)} className="button button-primary" trackingId={`learn_category_${category.slug}_bottom`} contentType="learning_hub_cta">Get tutoring</TrackedLink>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function ResourcePage({ slug }: { slug: string }) {
  const resource = getResource(slug);
  if (!resource) notFound();

  const category = getResourceCategory(resource.categorySlug);
  const related = getRelatedResources(resource, 3);
  const pageUrl = `${siteUrl}/learn/${resource.slug}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: resource.title,
    description: resource.description,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    ...(resource.publishedAt ? { datePublished: resource.publishedAt } : {}),
    ...(resource.updatedAt ? { dateModified: resource.updatedAt } : {}),
    author: {
      "@type": "Organization",
      name: "My Academic Tutor Academic Team",
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "My Academic Tutor",
      url: siteUrl,
    },
    articleSection: resource.category,
    keywords: resource.keywords.join(", "),
    inLanguage: "en",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Learning Hub", item: `${siteUrl}/learn` },
      ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${siteUrl}/learn/${category.slug}` }] : []),
      { "@type": "ListItem", position: category ? 4 : 3, name: resource.title, item: pageUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />

      <section className="page-hero compact-hero learning-article-hero">
        <div className="shell article-shell">
          <LearningBreadcrumbs
            items={[
              { label: "Learning Hub", href: "/learn" },
              ...(category ? [{ label: category.name, href: `/learn/${category.slug}` }] : []),
              { label: resource.title },
            ]}
          />
          <div className="eyebrow">{resource.category.toUpperCase()} · LEARNING GUIDE</div>
          <h1>{resource.title}</h1>
          <p className="page-lead">{resource.description}</p>
          <div className="learning-article-byline">
            <span>{resource.readTime} read</span>
            <span>{resource.level}</span>
            <span>Prepared by My Academic Tutor Academic Team</span>
            {resource.updatedAt ? <span>Updated {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${resource.updatedAt}T00:00:00Z`))}</span> : null}
          </div>
        </div>
      </section>

      <article className="section learning-article">
        <div className="shell article-shell">
          <aside className="learning-takeaways" aria-label="Key takeaways">
            <div className="eyebrow">KEY TAKEAWAYS</div>
            <ul>
              {resource.takeaways.map((takeaway) => <li key={takeaway}>{takeaway}</li>)}
            </ul>
          </aside>

          <div className="learning-article-body">
            {resource.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul className="learning-article-list">
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
                {section.note ? <div className="learning-note"><strong>Keep in mind</strong><p>{section.note}</p></div> : null}
              </section>
            ))}
          </div>

          <div className="article-learning-note">
            <strong>Use this actively</strong>
            <p>Close the guide and explain the main idea without looking back. Then work through a fresh example. The first step you cannot explain is usually the best place to focus your next revision session.</p>
          </div>

          <div className="learning-tutoring-links">
            <div>
              <div className="eyebrow">
                NEED HELP APPLYING THIS?
              </div>

              <h2>
                Work through {resource.title} with a tutor.
              </h2>

              <p>
                If the concept makes sense in the guide but becomes
                difficult in your own course, dataset, software or
                problem set, one-to-one tutoring can work through the
                reasoning with you and help you use the method
                independently.
              </p>
            </div>

            <div className="learning-tutoring-link-list">
              <TrackedLink
                href={learningHubResourceTutoringHref(resource)}
                className="button button-primary"
                trackingId={`learn_${resource.slug}_topic_help`}
                contentType="learning_hub_cta"
              >
                Get help with this topic
              </TrackedLink>

              {resource.tutoringLinks.map((link, index) => (
                <TrackedLink
                  key={link.href}
                  href={link.href}
                  className="button button-secondary"
                  trackingId={`learn_${resource.slug}_support_${index + 1}`}
                  contentType="learning_hub_cta"
                >
                  {link.label}
                </TrackedLink>
              ))}
            </div>
          </div>

          {related.length ? (
            <section className="learning-related-section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">RELATED LEARNING</div>
                  <h2>Continue the reasoning.</h2>
                </div>
                {category ? <Link className="text-link" href={`/learn/${category.slug}`}>All {category.name} guides</Link> : null}
              </div>
              <div className="resource-grid">
                {related.map((item) => <LearningResourceCard key={item.slug} resource={item} />)}
              </div>
            </section>
          ) : null}

          <div className="learning-editorial-note">
            <p><strong>About this guide:</strong> Educational content from My Academic Tutor. It is intended to support understanding and independent study, not replace course-specific teaching, supervision or assessed work.</p>
            <Link href="/learn/editorial-policy">Read our Learning Hub editorial approach</Link>
          </div>
        </div>
      </article>
    </>
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (getResourceCategory(slug)) return <CategoryPage slug={slug} />;
  if (getResource(slug)) return <ResourcePage slug={slug} />;
  notFound();
}
