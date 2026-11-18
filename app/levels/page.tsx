import type { Metadata } from "next";
import Link from "next/link";
import { academicLevels } from "@/lib/tutoring-data";

export const metadata: Metadata = { title: "Academic Levels" };

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell">
          <div className="eyebrow">ACADEMIC LEVELS</div>
          <h1>Tutoring should change as the academic level changes.</h1>
          <p className="page-lead">A school learner, an undergraduate and a postgraduate researcher need different explanations, expectations and kinds of practice. Our support is designed around the level of work in front of the student.</p>
        </div>
      </section>

      <section className="section">
        <div className="shell level-grid">
          {academicLevels.map((level) => (
            <Link key={level.slug} href={`/levels/${level.slug}`} className="card level-card">
              <h2>{level.name}</h2>
              <p>{level.short}</p>
              <div className="tag-row">{level.focus.map((focus) => <span className="tag" key={focus}>{focus}</span>)}</div>
              <span className="text-link">Explore tutoring at this level</span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
