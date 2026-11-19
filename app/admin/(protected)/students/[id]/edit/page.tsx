import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Student } from "@/lib/delivery-data";
import {
  archiveStudent,
  deleteStudentSafely,
  updateStudentProfile,
} from "@/app/admin/student-management-actions";

export const metadata = { title: "Edit student" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

async function exactCount(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const result = await query;
  if (result.error) throw new Error(result.error.message);
  return result.count || 0;
}

export default async function EditStudentPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: studentData, error }, engagementCount, communicationCount, portalCount, supportCount, submissionCount, intakeLinkCount, onboardingResult] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).single(),
    exactCount(supabase.from("tutoring_engagements").select("id", { count: "exact", head: true }).eq("student_id", id)),
    exactCount(supabase.from("student_communications").select("id", { count: "exact", head: true }).eq("student_id", id)),
    exactCount(supabase.from("student_portal_links").select("id", { count: "exact", head: true }).eq("student_id", id)),
    exactCount(supabase.from("student_support_requests").select("id", { count: "exact", head: true }).eq("student_id", id)),
    exactCount(supabase.from("homework_submissions").select("id", { count: "exact", head: true }).eq("student_id", id)),
    exactCount(supabase.from("student_intake_links").select("id", { count: "exact", head: true }).eq("student_id", id)),
    supabase.from("student_onboarding").select("status,intake_completed_at,reviewed_at").eq("student_id", id).maybeSingle(),
  ]);

  if (error || !studentData) notFound();
  if (onboardingResult.error) throw new Error(onboardingResult.error.message);

  const student = studentData as Student;
  const onboardingHasHistory = Boolean(
    onboardingResult.data &&
      (onboardingResult.data.status !== "awaiting_intake" ||
        onboardingResult.data.intake_completed_at ||
        onboardingResult.data.reviewed_at)
  );
  const linkedHistory = engagementCount + communicationCount + portalCount + supportCount + submissionCount + intakeLinkCount + (onboardingHasHistory ? 1 : 0);
  const canDelete = linkedHistory === 0;

  return (
    <div className="admin-page">
      <div className="admin-breadcrumb">
        <Link href={`/admin/students/${student.id}`}>← Student record</Link>
        <span>Edit profile</span>
      </div>

      <header className="admin-page-head admin-lead-head">
        <div>
          <span className="admin-eyebrow">Student management</span>
          <h1>Edit {student.name}</h1>
          <p>Update the learner profile without changing their tutoring history.</p>
        </div>
        <span className={`admin-status student-${student.status}`}>{student.status}</span>
      </header>

      <div className="admin-student-management-grid">
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head">
            <div><span className="admin-eyebrow">Profile</span><h2>Student details</h2></div>
            <span>Created {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(student.created_at))}</span>
          </div>

          <form action={updateStudentProfile} className="admin-student-edit-form">
            <input type="hidden" name="studentId" value={student.id} />
            <div className="admin-form-grid-2">
              <label><span>Name</span><input name="name" required defaultValue={student.name} /></label>
              <label><span>Email</span><input name="email" type="email" required defaultValue={student.email} /></label>
              <label><span>Phone</span><input name="phone" defaultValue={student.phone || ""} /></label>
              <label><span>Country</span><input name="country" defaultValue={student.country || ""} /></label>
              <label><span>Academic level</span><input name="academicLevel" defaultValue={student.academic_level || ""} placeholder="Master's" /></label>
              <label><span>Institution</span><input name="institution" defaultValue={student.institution || ""} /></label>
              <label><span>Programme / course</span><input name="programme" defaultValue={student.programme || ""} /></label>
              <label><span>Curriculum</span><input name="curriculum" defaultValue={student.curriculum || ""} /></label>
            </div>
            <label><span>Status</span><select name="status" defaultValue={student.status}><option value="active">Active</option><option value="prospect">Prospect</option><option value="inactive">Inactive / archived</option></select></label>
            <label><span>Internal student notes</span><textarea name="notes" defaultValue={student.notes || ""} placeholder="Operational notes visible only to admins…" /></label>
            <div className="admin-edit-actions">
              <button type="submit" className="admin-primary-button">Save student profile</button>
              <Link href={`/admin/students/${student.id}`} className="admin-secondary-button">Cancel</Link>
            </div>
          </form>
        </section>

        <aside className="admin-student-management-side">
          <section className="admin-panel admin-action-card">
            <h2>Record history</h2>
            <dl className="admin-student-history-counts">
              <div><dt>Tutoring engagements</dt><dd>{engagementCount}</dd></div>
              <div><dt>Communications</dt><dd>{communicationCount}</dd></div>
              <div><dt>Portal links</dt><dd>{portalCount}</dd></div>
              <div><dt>Support requests</dt><dd>{supportCount}</dd></div>
              <div><dt>Homework submissions</dt><dd>{submissionCount}</dd></div>
              <div><dt>Intake links</dt><dd>{intakeLinkCount}</dd></div>
            </dl>
          </section>

          <section className="admin-panel admin-action-card">
            <h2>Archive student</h2>
            <p className="admin-help">Archiving keeps all learning, communication and portal history while removing the learner from your active-student count.</p>
            {student.status === "inactive" ? (
              <span className="admin-status student-inactive">Already archived</span>
            ) : (
              <form action={archiveStudent}>
                <input type="hidden" name="studentId" value={student.id} />
                <button type="submit" className="admin-secondary-button">Archive student</button>
              </form>
            )}
          </section>

          <section className="admin-panel admin-action-card admin-danger-zone">
            <span className="admin-eyebrow">Danger zone</span>
            <h2>Delete student</h2>
            {canDelete ? (
              <>
                <p className="admin-help">This student has no meaningful tutoring, onboarding, communication or portal history, so permanent deletion is available.</p>
                <form action={deleteStudentSafely} className="admin-delete-form">
                  <input type="hidden" name="studentId" value={student.id} />
                  <label><span>Type <strong>{student.name}</strong> to confirm</span><input name="confirmation" required autoComplete="off" /></label>
                  <button type="submit" className="admin-danger-button">Permanently delete student</button>
                </form>
              </>
            ) : (
              <>
                <p className="admin-help">Permanent deletion is blocked because this record already has linked history. Archive the student instead so your academic and operational records remain intact.</p>
                <div className="admin-delete-blocked">Deletion protected · {linkedHistory} linked record{linkedHistory === 1 ? "" : "s"}</div>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
