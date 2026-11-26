import type { Metadata } from "next";
import Link from "next/link";
import { subjects } from "@/lib/tutoring-data";

export const metadata: Metadata = {
  title: "Subjects",
  description: "Explore online tutoring for learners aged 18+ across mathematics, statistics, science, computing, data science and research methods.",
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell">
          <div className="eyebrow">SUBJECTS</div>
          <h1>Learn the subject at the level you are actually studying it.</h1>
          <p className="page-lead">Explore learning from school-level foundations through advanced university and research methods. Live one-to-one tutoring enquiries are currently available to learners aged 18+.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="subject-grid subject-grid-page">
            {subjects.map((subject, index) => (
              <Link key={subject.slug} href={`/subjects/${subject.slug}`} className="subject-card">
                <span className="subject-index">{String(index + 1).padStart(2, "0")}</span>
                <h2>{subject.name}</h2>
                <p>{subject.short}</p>
                <div className="tag-row">{subject.topics.slice(0, 4).map((topic) => <span className="tag" key={topic}>{topic}</span>)}</div>
                <span className="text-link">Explore {subject.name} learning & tutoring</span>
              </Link>
            ))}
          </div>
          <div className="center-cta">
            <p>Studying something related that is not listed?</p>
            <Link className="button button-primary" href="/find-a-tutor">Tell us what you are studying</Link>
          </div>
        </div>
      </section>
    </>
  );
}
