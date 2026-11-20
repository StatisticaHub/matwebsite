import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resources } from "@/lib/resources";

export function generateStaticParams() {
  return resources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);
  return resource ? { title: resource.title, description: resource.description } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = resources.find((item) => item.slug === slug);
  if (!resource) notFound();

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">{resource.category.toUpperCase()} · LEARNING RESOURCE</div>
          <h1>{resource.title}</h1>
          <p className="page-lead">{resource.description}</p>
          <span className="reading-time">{resource.readTime} read</span>
        </div>
      </section>
      <article className="section">
        <div className="shell article-shell">
          {resource.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </section>
          ))}
          <div className="article-learning-note">
            <strong>Use this actively</strong>
            <p>After reading, try to explain the idea without looking back. Then work through a fresh example or question. If you cannot explain a step, that is a useful signal for what to practise next.</p>
          </div>
          <div className="article-cta">
            <h2>Want to work through this with a tutor?</h2>
            <p>Tell us your academic level and the exact part that is still confusing. We can arrange one-to-one teaching around the topic rather than just giving you an answer.</p>
            <Link className="button button-primary" href="/find-a-tutor">Get help with this topic</Link>
          </div>
        </div>
      </article>
    </>
  );
}
