import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import { subjects } from "@/lib/tutoring-data";
import { resources } from "@/lib/resources";

export function generateStaticParams() { return subjects.map((subject) => ({ slug: subject.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const subject = subjects.find((item) => item.slug === slug);
  return subject ? { title: `${subject.name} Tutoring`, description: subject.short } : {};
}

function relatedResources(subjectName: string) {
  const direct = resources.filter((resource) => resource.category.toLowerCase() === subjectName.toLowerCase());
  if (direct.length >= 3) return direct.slice(0, 3);
  return [...direct, ...resources.filter((resource) => !direct.includes(resource))].slice(0, 3);
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const subject = subjects.find((item) => item.slug === slug);
  if (!subject) notFound();
  const related = relatedResources(subject.name);

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">{subject.name.toUpperCase()} LEARNING & TUTORING</div>
            <h1>Understand {subject.name.toLowerCase()} more deeply, one topic at a time.</h1>
            <p className="page-lead">{subject.intro}</p>
            <div className="button-row">
              <Link className="button button-primary button-large" href="/find-a-tutor">Get {subject.name} tutoring</Link>
              <Link className="button button-secondary button-large" href="/learn">Explore free resources</Link>
            </div>
          </div>
          <div className="card detail-card">
            <div className="eyebrow">TOPICS WE CAN SUPPORT</div>
            <h3>Start from the exact area you are studying.</h3>
            <div className="tag-row tags-large">{subject.topics.map((topic) => <span key={topic} className="tag">{topic}</span>)}</div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">HOW TUTORING CAN HELP</div>
            <h2>Move from explanation to independent problem-solving.</h2>
            <div className="mini-timeline">
              <div><span>1</span><p>Clarify the underlying concept, notation or method.</p></div>
              <div><span>2</span><p>Work through a representative example step by step.</p></div>
              <div><span>3</span><p>Practise a fresh problem with prompts rather than a supplied answer.</p></div>
              <div><span>4</span><p>Review mistakes, assumptions and the reasoning you need to reuse later.</p></div>
            </div>
          </div>
          <div>
            <div className="eyebrow">WHO WE SUPPORT</div>
            <h2>Teaching that reflects your academic level.</h2>
            <div className="audience-list">{subject.audiences.map((audience) => <div key={audience}>{audience}</div>)}</div>
            <ul className="check-list">{subject.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">LEARN FIRST</div>
              <h2>Explore a concept before your next session.</h2>
            </div>
            <Link href="/learn" className="text-link">Browse all learning resources</Link>
          </div>
          <div className="resource-grid">
            {related.map((resource) => (
              <Link href={`/learn/${resource.slug}`} className="card resource-card" key={resource.slug}>
                <span>{resource.category}</span><h3>{resource.title}</h3><p>{resource.description}</p><small>{resource.readTime} read</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell lead-section-grid">
          <div>
            <div className="eyebrow">PERSONALISED {subject.name.toUpperCase()} SUPPORT</div>
            <h2>Tell us the topic, course and goal.</h2>
            <p>Describe what you are studying and the point at which it becomes difficult. We will review the context and arrange suitable one-to-one teaching.</p>
          </div>
          <div className="card form-card"><TutoringLeadForm compact defaultSubject={subject.name} /></div>
        </div>
      </section>
    </>
  );
}
