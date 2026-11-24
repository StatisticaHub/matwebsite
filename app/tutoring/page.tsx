import type { Metadata } from "next";
import Link from "next/link";
import TrackedLink from "@/components/TrackedLink";
import { tutoringServices } from "@/lib/tutoring-services";
import { highIntentTutoringPages } from "@/lib/high-intent-tutoring";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.myacademictutor.com";

export const metadata: Metadata = {
  title: "Online Tutoring Services",
  description: "One-to-one online tutoring for regular study, exams, university modules, statistics, coding, data analysis and research methods.",
  alternates: { canonical: `${siteUrl}/tutoring` },
};

export default function Page() {
  return (
    <>
      <section className="page-hero">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">TUTORING SERVICES</div>
            <h1>One-to-one tutoring for the work you're doing right now.</h1>
            <p className="page-lead">Choose the kind of support that fits your current goal. Sessions can follow a course over time, focus on an exam, strengthen a technical method or help you understand a research problem.</p>
            <div className="button-row">
              <TrackedLink
                href="/find-a-tutor"
                className="button button-primary button-large"
                trackingId="tutoring_index_hero"
              >
                Request tutoring
              </TrackedLink>
              <Link href="/subjects" className="button button-secondary button-large">Explore subjects</Link>
            </div>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-label">WHAT 1:1 TUTORING CAN INCLUDE</div>
            <ul className="check-list">
              <li>Clear explanations of difficult concepts</li>
              <li>Worked examples and guided practice</li>
              <li>Exam and assessment preparation</li>
              <li>Statistics, software and coding practice</li>
              <li>Research methods and dissertation methodology</li>
              <li>A clear plan for what to practise next</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section tutoring-process-section">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">HOW TUTORING WORKS</div>
            <h2>Tell us where you're stuck. We'll arrange suitable tutoring.</h2>
          </div>
          <div className="conversion-journey">
            <article><span>1</span><h3>Tell us where you're stuck</h3><p>Send us the subject, level and exact topic or problem.</p></article>
            <article><span>2</span><h3>We read it and match carefully</h3><p>We look at the topic, level and availability, then find a suitable tutor.</p></article>
            <article><span>3</span><h3>Meet your tutor online</h3><p>Ask questions, work through examples and practise the parts you find difficult.</p></article>
          </div>
        </div>
      </section>

      <section className="section section-soft tutoring-service-choice">
        <div className="shell">
          <div className="eyebrow">WAYS TO USE TUTORING</div>
          <h2>Start with what you want to understand or improve.</h2>
          <p className="section-intro">You don't need to search through profiles. Tell us what you're working on and we'll help you find the right starting point.</p>
          <div className="service-grid service-grid-page">
            {tutoringServices.map((service) => (
              <Link className="service-card" href={`/tutoring/${service.slug}`} key={service.slug}>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <span className="text-link">See how this works</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tint">
        <div className="shell">
          <div className="section-head">
            <div>
              <div className="eyebrow">POPULAR SPECIALIST SUPPORT</div>
              <h2>Need help with a specific topic, method or software problem?</h2>
              <p className="section-intro">These focused tutoring pages are designed around common student needs in statistics, quantitative study, software and research methods.</p>
            </div>
          </div>

          <div className="service-grid">
            {highIntentTutoringPages.map((page) => (
              <Link className="service-card" href={`/tutoring/${page.slug}`} key={page.slug}>
                <h3>{page.title}</h3>
                <p>{page.metaDescription}</p>
                <span className="text-link">Explore this topic</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">HOW SESSIONS WORK</div>
            <h2>A tutor can change the explanation when something isn't clicking.</h2>
            <p>A tutor can change the explanation, work through another example, ask you to justify a step, check your reasoning and adapt the next session to what you have actually understood.</p>
            <p>That matters when a course is moving quickly and one unclear topic starts affecting everything that follows.</p>
          </div>
          <div className="quote-card">
            <div className="eyebrow">OUR APPROACH</div>
            <strong>The aim is to understand it, not just get through it.</strong>
            <p>Tutors explain the method, give you room to practise and help you spot mistakes so you can use the idea yourself later.</p>
            <Link className="text-link" href="/academic-integrity">Academic integrity</Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <div className="eyebrow eyebrow-light">NEED A TUTOR?</div>
            <h2>Tell us what you are studying and where you are stuck.</h2>
            <p>Tutoring starts from £20 an hour. Tell us what you're studying and we'll confirm the tutor and exact rate before you book.</p>
          </div>
          <TrackedLink
            href="/find-a-tutor"
            className="button button-light button-large"
            trackingId="tutoring_index_footer"
          >
            Request tutoring
          </TrackedLink>
        </div>
      </section>

    </>
  );
}
