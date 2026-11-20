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
  description: "Personalised one-to-one tutoring for regular study, exams, university modules, statistics, coding, software, data science and research methods.",
  alternates: { canonical: `${siteUrl}/tutoring` },
};

export default function Page() {
  return (
    <>
      <section className="page-hero">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow">TUTORING SERVICES</div>
            <h1>One-to-one teaching for the work you are actually doing.</h1>
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
              <li>Clear explanation of difficult concepts</li>
              <li>Worked examples and guided practice</li>
              <li>Exam and assessment preparation</li>
              <li>Statistics, software and coding support</li>
              <li>Research-methods and dissertation guidance</li>
              <li>Study planning and feedback between topics</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section tutoring-process-section">
        <div className="shell">
          <div className="conversion-section-head">
            <div className="eyebrow">HOW TUTORING WORKS</div>
            <h2>Start with the learning problem. We handle the matching.</h2>
          </div>
          <div className="conversion-journey">
            <article><span>1</span><h3>Tell us what you need</h3><p>Share the subject, level and exact topic or difficulty.</p></article>
            <article><span>2</span><h3>We review and match</h3><p>We identify suitable support based on the academic context and availability.</p></article>
            <article><span>3</span><h3>Start one-to-one tutoring</h3><p>Begin with explanation, examples and guided practice around your priorities.</p></article>
          </div>
        </div>
      </section>

      <section className="section section-soft tutoring-service-choice">
        <div className="shell">
          <div className="eyebrow">CHOOSE YOUR SUPPORT</div>
          <h2>Start with the academic goal, not the tutor profile.</h2>
          <p className="section-intro">You do not need to know what kind of tutor to search for. Start with the learning problem you want to solve.</p>
          <div className="service-grid service-grid-page">
            {tutoringServices.map((service) => (
              <Link className="service-card" href={`/tutoring/${service.slug}`} key={service.slug}>
                <h3>{service.title}</h3>
                <p>{service.short}</p>
                <span className="text-link">Explore this service</span>
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
              <h2>Start from the exact topic, software or research problem.</h2>
              <p className="section-intro">These focused tutoring pages are designed around common student needs in statistics, quantitative study, software and research methods.</p>
            </div>
          </div>

          <div className="service-grid">
            {highIntentTutoringPages.map((page) => (
              <Link className="service-card" href={`/tutoring/${page.slug}`} key={page.slug}>
                <h3>{page.title}</h3>
                <p>{page.metaDescription}</p>
                <span className="text-link">Explore specialist support</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">HOW SESSIONS WORK</div>
            <h2>Teaching that responds to your understanding.</h2>
            <p>A tutor can change the explanation, work through another example, ask you to justify a step, check your reasoning and adapt the next session to what you have actually understood.</p>
            <p>That flexibility is especially valuable when a course is moving quickly or when the difficulty is not just one isolated question.</p>
          </div>
          <div className="quote-card">
            <div className="eyebrow">OUR APPROACH</div>
            <strong>Understanding comes before shortcuts.</strong>
            <p>We support students to learn methods, practise responsibly and become increasingly confident working independently.</p>
            <Link className="text-link" href="/academic-integrity">Academic integrity</Link>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="shell cta-band-inner">
          <div>
            <div className="eyebrow eyebrow-light">NEED PERSONALISED HELP?</div>
            <h2>Tell us what you are studying and where you are stuck.</h2>
            <p>We will review the academic context and arrange suitable one-to-one support.</p>
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
