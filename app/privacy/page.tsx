import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell narrow"><div className="eyebrow">PRIVACY</div><h1>Privacy notice.</h1><p className="page-lead">How My Academic Tutor uses information submitted through tutoring enquiries, student onboarding and learning delivery.</p></div>
      </section>
      <section className="section">
        <div className="shell article-shell">
          <section><h2>Information we collect</h2><p>Depending on how you use the service, we may collect your name, contact details, country, academic level, institution or programme, subject and topic information, learning goals, availability, tutoring notes, homework, progress information and messages you send to us.</p></section>
          <section><h2>Why we use it</h2><p>We use this information to respond to enquiries, arrange and deliver tutoring, prepare learning plans, maintain student progress records, provide secure student portal access, communicate about sessions and homework, and operate and improve the service.</p></section>
          <section><h2>Service providers</h2><p>We use specialist service providers to operate the website and tutoring workflow. These currently include Vercel for website hosting, Supabase for application database and authentication infrastructure, Resend for transactional email delivery, and Zoom for live online tutoring sessions. Providers process information only as needed to provide their services to us.</p></section>
          <section><h2>Student portal and intake links</h2><p>Secure intake and learning-portal links are intended only for the student they are issued to. We store cryptographic hashes of access tokens rather than the raw token itself. Students should not forward these links to other people.</p></section>
          <section><h2>Retention and security</h2><p>We keep information only for as long as reasonably required for tutoring delivery, administration, legal or accounting obligations, and legitimate business records. We use access controls and server-side processing for private student and administrative information.</p></section>
          <section><h2>Your choices and questions</h2><p>You can contact My Academic Tutor if you want to ask about the personal information we hold, correct inaccurate details, or raise a privacy question. Contact us at <a href="mailto:Contact@myacademictutor.com">Contact@myacademictutor.com</a>.</p></section>
          <section><h2>Updates</h2><p>This notice may be updated as the service, legal requirements or our technology providers change. The version displayed on this website is the current version.</p></section>
        </div>
      </section>
    </>
  );
}
