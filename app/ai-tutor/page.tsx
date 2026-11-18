import type { Metadata } from "next";
import AITutorDemo from "@/components/AITutorDemo";

export const metadata: Metadata = {
  title: "AI Tutor Preview",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <>
      <section className="page-hero compact-hero">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">MAT AI TUTOR</div>
            <h1>Ask a question. Build understanding. Move to 1:1 support when you need it.</h1>
            <p className="page-lead">MAT AI is being designed to provide useful first-line academic help, adapt to the learner’s level and make a future handoff into personalised tutoring more informed.</p>
          </div>
          <div className="quote-card">
            <div className="eyebrow">CURRENT STATUS</div>
            <strong>Interactive preview.</strong>
            <p>The experience below demonstrates the intended learning flow. A live AI model will be connected after the public website is finalised.</p>
          </div>
        </div>
      </section>

      <section className="section section-soft"><div className="shell narrow"><AITutorDemo /></div></section>

      <section className="section">
        <div className="shell two-col">
          <div>
            <div className="eyebrow">LEARNING FIRST</div>
            <h2>Useful before a lesson is booked.</h2>
            <p>The AI experience should explain, question and guide—not behave like a disguised sales chatbot.</p>
          </div>
          <div>
            <div className="eyebrow">A BETTER HANDOFF</div>
            <h2>Your context should move with you.</h2>
            <p>If you decide you want 1:1 support, your subject, level and recent question can carry into the tutor request so you do not have to start again.</p>
          </div>
        </div>
      </section>
    </>
  );
}
