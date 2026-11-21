import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">CONTACT</div>
          <h1>Need tutoring or want to ask us something?</h1>
          <p className="page-lead">If you're looking for tutoring, tell us what you're studying and where you're stuck. For anything else, contact the team directly.</p>
        </div>
      </section>
      <section className="section">
        <div className="shell contact-grid">
          <article className="contact-card"><div className="eyebrow">TUTORING</div><h2>Looking for a tutor?</h2><p>Tell us your subject, level and what you want help with.</p><Link className="button button-primary" href="/find-a-tutor">Request tutoring</Link></article>
          <article className="contact-card"><div className="eyebrow">GENERAL ENQUIRIES</div><h2>Something else?</h2><p>For partnerships, tutor applications or anything that is not a tutoring request.</p><a className="text-link" href="mailto:Contact@myacademictutor.com">Contact@myacademictutor.com</a></article>
        </div>
      </section>
    </>
  );
}
