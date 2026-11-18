import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { academicLevels, subjects } from "@/lib/tutoring-data";

export function generateStaticParams() { return academicLevels.map((level) => ({ slug: level.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const level = academicLevels.find((item) => item.slug === slug);
  return level ? { title: `${level.name} Tutoring`, description: level.short } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const level = academicLevels.find((item) => item.slug === slug);
  if (!level) notFound();

  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">{level.name.toUpperCase()}</div>
          <h1>Personalised tutoring for {level.name.toLowerCase()} study.</h1>
          <p className="page-lead">{level.short}</p>
          <div className="button-row"><Link className="button button-primary button-large" href="/find-a-tutor">Get tutoring at this level</Link></div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">COMMON FOCUS</div>
            <h2>Support for the work in front of you.</h2>
            <ul className="check-list">{level.focus.map((focus) => <li key={focus}>{focus}</li>)}</ul>
          </div>
          <div>
            <div className="eyebrow">HOW THE TEACHING ADAPTS</div>
            <h2>Right depth, right pace, right kind of practice.</h2>
            <p>Sessions can move from explanation to worked examples, guided practice, exam-style questions, software or research discussion depending on what this stage of study requires.</p>
            <p>The aim is not simply to solve today’s problem. It is to strengthen the knowledge and reasoning needed for the next one.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">EXPLORE SUBJECTS</div>
          <h2>Choose the subject you are studying.</h2>
          <div className="tag-row tags-large">{subjects.map((subject) => <Link className="tag" key={subject.slug} href={`/subjects/${subject.slug}`}>{subject.name}</Link>)}</div>
        </div>
      </section>
    </>
  );
}
