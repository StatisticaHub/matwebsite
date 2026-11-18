import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StudentIntakeForm from "@/components/StudentIntakeForm";
import { getIntakeContext } from "@/lib/student-onboarding";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Student learning intake",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type Params = Promise<{ token: string }>;

export default async function StudentIntakePage({ params }: { params: Params }) {
  const { token } = await params;
  const context = await getIntakeContext(token);
  if (!context) notFound();

  const { student, onboarding, engagement, tutorName } = context;
  return (
    <main className="intake-shell">
      <header className="intake-topbar">
        <a href="/" className="portal-brand"><strong>My Academic Tutor</strong><span>Student onboarding</span></a>
        <span>Secure learning intake</span>
      </header>

      <div className="intake-page">
        <section className="intake-hero">
          <div>
            <span className="portal-kicker">Preparing your tutoring</span>
            <h1>Tell us how you learn best, {student.name.split(" ")[0]}.</h1>
            <p>This short academic intake helps us prepare tutoring around your course, goals, current confidence and preferred way of learning.</p>
          </div>
          <aside>
            <span>Current tutoring setup</span>
            <strong>{engagement?.subject || "Tutoring support"}</strong>
            <small>{engagement?.module || student.programme || student.academic_level || "Academic details being prepared"}</small>
            <dl>
              <div><dt>Tutor</dt><dd>{tutorName || "To be confirmed"}</dd></div>
              <div><dt>Format</dt><dd>{engagement?.frequency || "Flexible"}</dd></div>
            </dl>
          </aside>
        </section>

        {onboarding.intake_completed_at && (
          <div className="intake-existing-note">You have already submitted this intake. You can update any details below and submit again.</div>
        )}

        <StudentIntakeForm token={token} onboarding={onboarding} student={student} />
      </div>
    </main>
  );
}
