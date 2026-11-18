import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Contact" };

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow">
          <div className="eyebrow">CONTACT</div>
          <h1>Talk to us about tutoring, academic support or the MAT platform.</h1>
          <p className="page-lead">For tutoring, the learning-requirements form gives us the academic context needed to respond properly. For general enquiries, contact the team directly.</p>
        </div>
      </section>
      <section className="section">
        <div className="shell contact-grid">
          <article className="contact-card"><div className="eyebrow">TUTORING</div><h2>Need academic support?</h2><p>Tell us your subject, level, topic and learning goal.</p><Link className="button button-primary" href="/find-a-tutor">Get personalised tutoring</Link></article>
          <article className="contact-card"><div className="eyebrow">GENERAL ENQUIRIES</div><h2>Contact the MAT team.</h2><p>For partnerships, tutor applications and general questions.</p><a className="text-link" href="mailto:Contact@myacademictutor.com">Contact@myacademictutor.com</a></article>
        </div>
      </section>
    </>
  );
}
