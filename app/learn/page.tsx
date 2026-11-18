import type { Metadata } from "next";
import Link from "next/link";
import { resources } from "@/lib/resources";
import { subjects } from "@/lib/tutoring-data";

export const metadata: Metadata = {
  title: "Learning Hub",
  description: "Clear academic explanations, worked concepts and study guidance across statistics, mathematics, data, bioinformatics and research methods.",
};

export default function Page() {
  const categories = Array.from(new Set(resources.map((resource) => resource.category)));

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">LEARNING HUB</div>
          <h1>Learn something useful before you book a lesson.</h1>
          <p className="page-lead">Clear explanations for difficult concepts, methods and study problems. Use the hub to strengthen your understanding, then continue with personalised tutoring when you need deeper guidance.</p>
        </div>
      </section>

      <section className="section section-soft learn-directory">
        <div className="shell">
          <div className="learn-directory-grid">
            <div>
              <div className="eyebrow">BROWSE BY SUBJECT</div>
              <div className="tag-row tags-large">
                {subjects.map((subject) => <Link className="tag" href={`/subjects/${subject.slug}`} key={subject.slug}>{subject.name}</Link>)}
              </div>
            </div>
            <div>
              <div className="eyebrow">RESOURCE CATEGORIES</div>
              <div className="tag-row tags-large">
                {categories.map((category) => <span className="tag" key={category}>{category}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">EXPLANATIONS & GUIDES</div>
              <h2>Start with the idea you are trying to understand.</h2>
            </div>
          </div>
          <div className="resource-grid resource-grid-page">
            {resources.map((resource) => (
              <Link href={`/learn/${resource.slug}`} className="card resource-card" key={resource.slug}>
                <span>{resource.category}</span>
                <h2>{resource.title}</h2>
                <p>{resource.description}</p>
                <small>{resource.readTime} read</small>
                <div className="text-link">Learn this topic</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div><div className="eyebrow eyebrow-light">NEED MORE THAN A GUIDE?</div><h2>Work through the topic one-to-one.</h2><p>Tell us your level, course and what is still unclear. We can arrange personalised tutoring around it.</p></div>
          <Link className="button button-light button-large" href="/find-a-tutor">Get personalised tutoring</Link>
        </div>
      </section>
    </>
  );
}
