import Link from "next/link";
import IntakeAccessManager from "@/components/IntakeAccessManager";
import { applyIntakeToEngagement, saveOnboardingReview } from "@/app/admin/onboarding-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { onboardingStatusLabels, onboardingStatuses, type StudentIntakeLink, type StudentOnboarding } from "@/lib/student-onboarding";
import type { TutoringEngagement, TutoringSession } from "@/lib/delivery-data";

export const metadata = { title: "Student onboarding" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ student?: string }>;
type StudentRow = { id: string; name: string; email: string; status: string; academic_level: string | null; programme: string | null; institution: string | null };
type PortalRow = { id: string; student_id: string };
type TutorRow = { id: string; name: string };

function formatDateTime(value: string | null) {
  if (!value) return "Not yet";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const [studentsResult, onboardingResult, intakeLinkResult, engagementResult, sessionResult, portalResult, tutorResult] = await Promise.all([
    supabase.from("students").select("id,name,email,status,academic_level,programme,institution").order("updated_at", { ascending: false }),
    supabase.from("student_onboarding").select("*").order("updated_at", { ascending: false }),
    supabase.from("student_intake_links").select("id,student_id,token_preview,expires_at,created_at,last_accessed_at").is("revoked_at", null).order("created_at", { ascending: false }),
    supabase.from("tutoring_engagements").select("*").order("created_at", { ascending: false }),
    supabase.from("tutoring_sessions").select("id,engagement_id,status,scheduled_for").eq("status", "planned"),
    supabase.from("student_portal_links").select("id,student_id").eq("access_kind", "admin_link").is("revoked_at", null),
    supabase.from("tutors").select("id,name"),
  ]);

  const students = (studentsResult.data || []) as StudentRow[];
  const onboardingRows = (onboardingResult.data || []) as StudentOnboarding[];
  const intakeLinks = (intakeLinkResult.data || []) as StudentIntakeLink[];
  const engagements = (engagementResult.data || []) as TutoringEngagement[];
  const sessions = (sessionResult.data || []) as Pick<TutoringSession, "id" | "engagement_id" | "status" | "scheduled_for">[];
  const portals = (portalResult.data || []) as PortalRow[];
  const tutors = (tutorResult.data || []) as TutorRow[];

  const onboardingByStudent = new Map(onboardingRows.map((row) => [row.student_id, row]));
  const engagementByStudent = new Map<string, TutoringEngagement>();
  for (const engagement of engagements) if (!engagementByStudent.has(engagement.student_id) || engagement.status === "active") engagementByStudent.set(engagement.student_id, engagement);
  const portalStudents = new Set(portals.map((row) => row.student_id));
  const plannedEngagements = new Set(sessions.map((row) => row.engagement_id));
  const tutorById = new Map(tutors.map((row) => [row.id, row.name]));

  const awaiting = onboardingRows.filter((row) => row.status === "awaiting_intake").length;
  const review = onboardingRows.filter((row) => row.status === "review").length;
  const ready = onboardingRows.filter((row) => row.status === "ready").length;
  const complete = onboardingRows.filter((row) => row.status === "complete").length;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Lead → learner</span>
          <h1>Student onboarding</h1>
          <p>Collect academic context, review learning needs, prepare the tutor, activate the portal and confirm the first session from one place.</p>
        </div>
      </header>

      <section className="admin-metrics admin-metrics-4">
        <div><span>Awaiting intake</span><strong>{awaiting}</strong></div>
        <div><span>Needs review</span><strong>{review}</strong></div>
        <div><span>Ready</span><strong>{ready}</strong></div>
        <div><span>Complete</span><strong>{complete}</strong></div>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><h2>Secure intake links</h2><span>Resend email enabled</span></div></div>
        <p className="admin-portal-intro">Generate a secure link or create and email it directly through Resend. The raw token is shown only when generated; only a hash is stored in Supabase.</p>
        <IntakeAccessManager students={students.map(({ id, name, email, status }) => ({ id, name, email, status }))} links={intakeLinks} focusStudentId={params.student} />
      </section>

      <section className="admin-onboarding-list">
        {students.map((student) => {
          const onboarding = onboardingByStudent.get(student.id);
          const engagement = engagementByStudent.get(student.id);
          const hasPortal = portalStudents.has(student.id);
          const hasTutor = Boolean(engagement?.tutor_id);
          const hasFirstSession = Boolean(engagement && plannedEngagements.has(engagement.id));
          const hasIntake = Boolean(onboarding?.intake_completed_at);
          const status = onboarding?.status || "awaiting_intake";
          return (
            <article key={student.id} className={student.id === params.student ? "is-focus" : ""}>
              <div className="admin-onboarding-head">
                <div><span className="admin-eyebrow">{engagement?.subject || "Student onboarding"}</span><h2>{student.name}</h2><p>{student.email} · {student.programme || student.academic_level || student.institution || "Academic context not set"}</p></div>
                <div className={`admin-onboarding-status status-${status}`}>{onboardingStatusLabels[status]}</div>
              </div>

              <div className="admin-readiness-grid">
                <div className={hasIntake ? "is-done" : ""}><span>1</span><strong>Intake</strong><small>{hasIntake ? `Submitted ${formatDateTime(onboarding?.intake_completed_at || null)}` : "Waiting for student"}</small></div>
                <div className={hasTutor ? "is-done" : ""}><span>2</span><strong>Tutor</strong><small>{hasTutor ? tutorById.get(engagement?.tutor_id || "") || "Assigned" : "Not assigned"}</small></div>
                <div className={hasPortal ? "is-done" : ""}><span>3</span><strong>Portal</strong><small>{hasPortal ? "Active link ready" : "Not prepared"}</small></div>
                <div className={hasFirstSession ? "is-done" : ""}><span>4</span><strong>First session</strong><small>{hasFirstSession ? "Planned" : "Not booked"}</small></div>
              </div>

              {onboarding?.intake_completed_at ? (
                <details className="admin-intake-review" open={status === "review" || student.id === params.student}>
                  <summary>Review submitted learning intake</summary>
                  <div className="admin-intake-review-grid">
                    <div><span>Target outcome</span><p>{onboarding.target_outcome || "Not provided"}</p></div>
                    <div><span>Target date</span><p>{formatDate(onboarding.target_date)}</p></div>
                    <div><span>Confidence</span><p>{onboarding.current_confidence ? `${onboarding.current_confidence}/5` : "Not provided"}</p></div>
                    <div><span>Timezone & availability</span><p>{[onboarding.timezone, onboarding.availability].filter(Boolean).join(" · ") || "Not provided"}</p></div>
                    <div className="wide"><span>Course context</span><p>{onboarding.course_context || "Not provided"}</p></div>
                    <div className="wide"><span>Strong topics</span><p>{onboarding.strong_topics || "Not provided"}</p></div>
                    <div className="wide"><span>Priority / weak topics</span><p>{onboarding.weak_topics || "Not provided"}</p></div>
                    <div className="wide"><span>Learning preferences</span><p>{onboarding.learning_preferences || "Not provided"}</p></div>
                    <div className="wide"><span>Assessment context</span><p>{onboarding.assessment_context || "Not provided"}</p></div>
                    {onboarding.accessibility_requirements && <div className="wide"><span>Teaching adjustments</span><p>{onboarding.accessibility_requirements}</p></div>}
                    {onboarding.anything_else && <div className="wide"><span>Additional context</span><p>{onboarding.anything_else}</p></div>}
                  </div>
                  {engagement && <form action={applyIntakeToEngagement} className="admin-intake-apply"><input type="hidden" name="studentId" value={student.id} /><input type="hidden" name="engagementId" value={engagement.id} /><button type="submit" className="admin-primary-button">Apply intake to tutoring plan</button><small>Copies goal, deadline, confidence, weak topics, learning preferences and assessment context into the active engagement.</small></form>}
                </details>
              ) : <div className="admin-empty compact">No learning intake submitted yet.</div>}

              <div className="admin-onboarding-footer">
                <form action={saveOnboardingReview} className="admin-onboarding-review-form">
                  <input type="hidden" name="studentId" value={student.id} />
                  <select name="status" defaultValue={status}>{onboardingStatuses.map((item) => <option key={item} value={item}>{onboardingStatusLabels[item]}</option>)}</select>
                  <input name="adminNotes" defaultValue={onboarding?.admin_notes || ""} placeholder="Internal onboarding note" />
                  <button type="submit">Save review</button>
                </form>
                <div className="admin-onboarding-links"><Link href={`/admin/students/${student.id}`}>Student record →</Link><Link href={`/admin/portals?student=${student.id}`}>Portal →</Link></div>
              </div>
            </article>
          );
        })}
        {!students.length && <div className="admin-panel admin-empty">No students to onboard yet.</div>}
      </section>
    </div>
  );
}
