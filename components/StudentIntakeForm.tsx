"use client";

import { useState, type FormEvent } from "react";
import type { StudentOnboarding } from "@/lib/student-onboarding";

export default function StudentIntakeForm({
  token,
  onboarding,
  student,
}: {
  token: string;
  onboarding: StudentOnboarding;
  student: { academic_level: string | null; institution: string | null; programme: string | null };
}) {
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`/api/intake/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not save your intake form.");
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your intake form.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="intake-success-card">
        <span>Submitted</span>
        <h2>Thank you — your tutoring team has your learning details.</h2>
        <p>We will use this information to refine your learning plan, tutor preparation and first sessions. You can safely close this page.</p>
      </div>
    );
  }

  return (
    <form className="intake-form" onSubmit={submit}>
      <input className="intake-honeypot" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <section className="intake-form-section">
        <div><span>01</span><h2>Your course</h2><p>Tell us about your course so your tutor can prepare for the right level and topics.</p></div>
        <div className="intake-fields">
          <label><span>Academic level</span><input name="academicLevel" defaultValue={student.academic_level || ""} placeholder="e.g. MSc / Year 12 / AP" /></label>
          <label><span>Institution or school</span><input name="institution" defaultValue={student.institution || ""} placeholder="University, college or school" /></label>
          <label className="wide"><span>Programme / course</span><input name="programme" defaultValue={student.programme || ""} placeholder="e.g. MSc Finance, A-Level Mathematics" /></label>
          <label className="wide"><span>Course or module context</span><textarea name="courseContext" defaultValue={onboarding.course_context || ""} placeholder="Module name, syllabus, current teaching block, software used, or anything else that helps us prepare." /></label>
        </div>
      </section>

      <section className="intake-form-section">
        <div><span>02</span><h2>Your goals</h2><p>Tell us what a successful tutoring outcome looks like.</p></div>
        <div className="intake-fields">
          <label className="wide"><span>Target outcome</span><textarea name="targetOutcome" defaultValue={onboarding.target_outcome || ""} required placeholder="What would you like to be able to do, understand or achieve?" /></label>
          <label><span>Important date</span><input name="targetDate" type="date" defaultValue={onboarding.target_date || ""} /></label>
          <label><span>Current confidence</span><select name="currentConfidence" defaultValue={onboarding.current_confidence?.toString() || ""}><option value="">Select</option><option value="1">1 — very low</option><option value="2">2</option><option value="3">3 — mixed</option><option value="4">4</option><option value="5">5 — strong</option></select></label>
          <label className="wide"><span>Upcoming assessment context</span><textarea name="assessmentContext" defaultValue={onboarding.assessment_context || ""} placeholder="Exam, assignment, dissertation milestone, coursework, interview, resit, etc." /></label>
        </div>
      </section>

      <section className="intake-form-section">
        <div><span>03</span><h2>How you learn</h2><p>This helps us shape explanations, practice and lesson pacing around you.</p></div>
        <div className="intake-fields">
          <label className="wide"><span>Topics you already feel comfortable with</span><textarea name="strongTopics" defaultValue={onboarding.strong_topics || ""} placeholder="List topics, methods or skills you already understand reasonably well." /></label>
          <label className="wide"><span>Topics you find difficult</span><textarea name="weakTopics" defaultValue={onboarding.weak_topics || ""} placeholder="Be as specific as you can — concepts, question types, software, mathematical steps, etc." /></label>
          <label className="wide"><span>Learning preferences</span><textarea name="learningPreferences" defaultValue={onboarding.learning_preferences || ""} placeholder="Worked examples, derivations, visual explanations, exam practice, slower theory, coding demonstrations…" /></label>
        </div>
      </section>

      <section className="intake-form-section">
        <div><span>04</span><h2>Scheduling & support</h2><p>Give us the practical details that help tutoring run smoothly.</p></div>
        <div className="intake-fields">
          <label><span>Timezone</span><input name="timezone" defaultValue={onboarding.timezone || ""} placeholder="e.g. Europe/London" /></label>
          <label><span>Typical availability</span><input name="availability" defaultValue={onboarding.availability || ""} placeholder="e.g. Mon/Tue evenings, Sat morning" /></label>
          <label className="wide"><span>Accessibility or teaching adjustments</span><textarea name="accessibilityRequirements" defaultValue={onboarding.accessibility_requirements || ""} placeholder="Optional. Share anything you would like us to consider when preparing or teaching." /></label>
          <label className="wide"><span>Anything else we should know?</span><textarea name="anythingElse" defaultValue={onboarding.anything_else || ""} placeholder="Optional additional context for your tutoring team." /></label>
        </div>
      </section>

      <section className="intake-submit-panel">
        <label className="intake-consent"><input type="checkbox" name="consent" value="yes" required defaultChecked={onboarding.consent_confirmed} /><span>I confirm that the information above can be used by My Academic Tutor to organise and deliver my tutoring support.</span></label>
        {error && <p className="intake-error">{error}</p>}
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : onboarding.intake_completed_at ? "Update learning intake" : "Submit learning intake"}</button>
        <small>You can use this same secure link again until it expires or is replaced.</small>
      </section>
    </form>
  );
}
