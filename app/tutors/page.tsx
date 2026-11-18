import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Tutor Standards" };

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero"><div className="shell narrow"><div className="eyebrow">TUTOR STANDARDS</div><h1>The tutor matters because the teaching matters.</h1><p className="page-lead">MAT is designed around subject-appropriate teaching, clear communication, responsible academic support and a practical fit with the student’s level and goals.</p></div></section>
      <section className="section"><div className="shell standard-grid">
        <article><h2>Subject depth</h2><p>Tutors should be comfortable with the specific topic and academic level they are supporting, not only a broad subject label.</p></article>
        <article><h2>Teaching ability</h2><p>Knowing a subject is not enough. Tutors should be able to explain, question, demonstrate, listen and adapt when an explanation is not working.</p></article>
        <article><h2>Academic integrity</h2><p>Tutoring should strengthen a student’s own work. Tutors must not become a substitute author for assessed assignments or research.</p></article>
        <article><h2>Professional reliability</h2><p>Clear communication, preparation, punctuality and respect for agreed boundaries are part of the teaching service.</p></article>
      </div><div className="center-cta"><Link className="button button-primary" href="/find-a-tutor">Get personalised tutoring</Link></div></section>
    </>
  );
}
