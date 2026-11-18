import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import TutoringLeadForm from "@/components/TutoringLeadForm";
import { tutoringServices } from "@/lib/tutoring-services";

export function generateStaticParams() {
  return tutoringServices.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = tutoringServices.find((item) => item.slug === slug);
  return service ? { title: service.title, description: service.short } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = tutoringServices.find((item) => item.slug === slug);
  if (!service) notFound();

  return (
    <>
      <section className="page-hero">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">{service.title.toUpperCase()}</div>
            <h1>{service.title}</h1>
            <p className="page-lead">{service.hero}</p>
            <div className="button-row">
              <Link href="/find-a-tutor" className="button button-primary button-large">Get this support</Link>
              <Link href="/tutoring" className="button button-secondary button-large">All tutoring services</Link>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-label">THIS CAN BE A GOOD FIT FOR</div>
            <ul className="check-list">{service.bestFor.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">WHAT WE CAN WORK ON</div>
            <h2>Support built around the actual academic task.</h2>
            <ul className="check-list">{service.includes.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <div className="eyebrow">A TYPICAL SESSION</div>
            <h2>Explanation, practice and feedback in one learning loop.</h2>
            <div className="mini-timeline">
              {service.sessionFlow.map((item, index) => <div key={item}><span>{index + 1}</span><p>{item}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="eyebrow">WHAT PROGRESS CAN LOOK LIKE</div>
          <h2>The goal is stronger independent work.</h2>
          <div className="outcome-grid">
            {service.outcomes.map((item) => <article key={item}><strong>{item}</strong></article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell lead-section-grid">
          <div className="section-copy-block">
            <div className="eyebrow">DISCUSS YOUR LEARNING NEEDS</div>
            <h2>Tell us what you are studying and what you want to improve.</h2>
            <p>Share the course, topic, deadline or assessment context. We will review it and arrange suitable one-to-one academic support.</p>
            <p className="service-integrity-note">We teach, explain, review and guide. We do not complete assessed work on a student’s behalf.</p>
          </div>
          <div className="card form-card">
            <TutoringLeadForm compact defaultSupportType={service.defaultSupportType} submitLabel="Get personalised tutoring" />
          </div>
        </div>
      </section>
    </>
  );
}
