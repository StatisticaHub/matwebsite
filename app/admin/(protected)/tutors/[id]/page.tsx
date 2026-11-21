import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/admin-data";
import { deleteTutor, updateTutor } from "@/app/admin/actions";
import { disableTutorPortal, sendTutorPortalInvite } from "@/app/admin/tutor-portal-actions";

export const metadata = { title: "Edit tutor" };
export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ updated?: string; delete?: string; portal?: string }>;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function TutorDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = createAdminClient();

  const [
    { data: tutorData, error: tutorError },
    leadsResult,
    engagementsResult,
    sessionsResult,
  ] = await Promise.all([
    supabase.from("tutors").select("*").eq("id", id).single(),
    supabase.from("tutoring_leads").select("id", { count: "exact", head: true }).eq("assigned_tutor_id", id),
    supabase.from("tutoring_engagements").select("id", { count: "exact", head: true }).eq("tutor_id", id),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }).eq("tutor_id", id),
  ]);

  if (tutorError || !tutorData) notFound();
  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (engagementsResult.error) throw new Error(engagementsResult.error.message);
  if (sessionsResult.error) throw new Error(sessionsResult.error.message);

  const tutor = tutorData as Tutor;
  const leadCount = leadsResult.count || 0;
  const engagementCount = engagementsResult.count || 0;
  const sessionCount = sessionsResult.count || 0;
  const linkedCount = leadCount + engagementCount + sessionCount;

  return (
    <div className="admin-page">
      <div className="admin-breadcrumb"><Link href="/admin/tutors">← Tutor records</Link><span>{tutor.name}</span></div>

      <header className="admin-page-head admin-lead-head">
        <div>
          <span className="admin-eyebrow">Tutor profile</span>
          <h1>{tutor.name}</h1>
          <p>{tutor.email}</p>
        </div>
        <span className={`admin-status tutor-${tutor.status}`}>{tutor.status}</span>
      </header>

      {query.updated === "1" && (
        <div className="admin-inline-message success">Tutor profile updated.</div>
      )}
      {query.delete === "name_mismatch" && (
        <div className="admin-inline-message warning">The confirmation name did not match. Tutor was not deleted.</div>
      )}
      {query.delete === "linked" && (
        <div className="admin-inline-message warning">This tutor has linked CRM or session records, so permanent deletion is blocked. Set the tutor to inactive instead.</div>
      )}
      {query.portal === "sent" && <div className="admin-inline-message success">Tutor portal access email sent.</div>}
      {query.portal === "disabled" && <div className="admin-inline-message warning">Tutor portal access disabled.</div>}

      <div className="admin-tutor-layout">
        <section className="admin-panel admin-detail-card admin-tutor-edit-card">
          <div className="admin-card-head"><h2>Edit tutor</h2><span>{tutor.verified ? "Verified" : "Not verified"}</span></div>
          <form action={updateTutor} className="admin-tutor-edit-form">
            <input type="hidden" name="tutorId" value={tutor.id} />

            <label><span>Name</span><input name="name" required defaultValue={tutor.name} /></label>
            <label><span>Email</span><input name="email" type="email" required defaultValue={tutor.email} /></label>
            <label><span>Professional headline</span><input name="headline" defaultValue={tutor.headline || ""} placeholder="Medical Statistician · MSc Statistics" /></label>
            <label><span>Subjects</span><input name="subjects" defaultValue={tutor.subjects.join(", ")} placeholder="Statistics, Data Science" /><small>Comma-separated</small></label>
            <label><span>Levels</span><input name="levels" defaultValue={tutor.levels.join(", ")} placeholder="Undergraduate, Master's" /><small>Comma-separated</small></label>

            <label>
              <span>Specialist topics / methods</span>
              <input
                name="specialisms"
                defaultValue={(tutor.specialisms || []).join(", ")}
                placeholder="Regression, Econometrics, R, Survival Analysis"
              />
              <small>Comma-separated — used by smart matching</small>
            </label>

            <label>
              <span>Qualifications</span>
              <textarea
                name="qualifications"
                defaultValue={tutor.qualifications || ""}
                placeholder="Degrees, qualifications and relevant professional training"
              />
            </label>

            <label>
              <span>Teaching / tutoring experience</span>
              <textarea
                name="teachingExperience"
                defaultValue={tutor.teaching_experience || ""}
                placeholder="Teaching, tutoring, research or relevant professional experience"
              />
            </label>

            <label>
              <span>Teaching languages</span>
              <input
                name="languages"
                defaultValue={(tutor.languages || []).join(", ")}
                placeholder="English, Hindi"
              />
              <small>Comma-separated</small>
            </label>

            <label><span>Timezone</span><input name="timezone" defaultValue={tutor.timezone || ""} placeholder="Europe/London" /></label>
            <label><span>Availability notes</span><textarea name="availability" defaultValue={tutor.availability_notes || ""} placeholder="Tue/Thu evenings; weekends" /></label>

            <fieldset className="admin-match-fieldset"><legend>Available days</legend><div className="admin-check-grid">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => { const value = day.toLowerCase(); return <label className="admin-check" key={day}><input type="checkbox" name="availabilityDays" value={value} defaultChecked={(tutor.availability_days || []).includes(value)} /><span>{day}</span></label>; })}</div></fieldset>
            <fieldset className="admin-match-fieldset"><legend>Teaching periods</legend><div className="admin-check-grid compact">{["Morning","Afternoon","Evening"].map((period) => { const value = period.toLowerCase(); return <label className="admin-check" key={period}><input type="checkbox" name="availabilityPeriods" value={value} defaultChecked={(tutor.availability_periods || []).includes(value)} /><span>{period}</span></label>; })}</div></fieldset>
            <div className="admin-form-grid-2"><label><span>Weekly capacity (hours)</span><input name="weeklyCapacityHours" type="number" min="0" max="80" step="0.5" defaultValue={tutor.weekly_capacity_hours ?? ""} placeholder="10" /></label><label><span>Max active students</span><input name="maxActiveStudents" type="number" min="0" max="100" defaultValue={tutor.max_active_students ?? ""} placeholder="8" /></label></div>
            <label className="admin-check"><input type="checkbox" name="acceptsTrials" value="yes" defaultChecked={tutor.accepts_trials !== false} /><span>Accepting trial sessions</span></label>

            <div className="admin-form-grid-2">
              <label><span>Status</span><select name="status" defaultValue={tutor.status}><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option></select></label>
              <label><span>Internal hourly rate</span><div className="admin-rate-row"><select name="currency" defaultValue={tutor.currency || "GBP"}><option>GBP</option><option>USD</option><option>EUR</option><option>INR</option></select><input name="hourlyRate" type="number" min="0" step="0.01" defaultValue={tutor.hourly_rate ?? ""} /></div></label>
            </div>

            <label>
              <span>Verification notes (internal)</span>
              <textarea
                name="verificationNotes"
                defaultValue={tutor.verification_notes || ""}
                placeholder="Qualification checked, identity reviewed, reference notes…"
              />
              <small>Private admin information. Tutors and students do not see this.</small>
            </label>

            <label className="admin-check">
              <input
                type="checkbox"
                name="verified"
                value="yes"
                defaultChecked={tutor.verified}
              />
              <span>Qualifications / identity verified</span>
            </label>

            <button className="admin-primary-button" type="submit">
              Save tutor changes
            </button>
          </form>
        </section>

        <aside className="admin-detail-side">
          <section className="admin-panel admin-action-card admin-tutor-record-card">
            <h2>Record summary</h2>
            <dl className="admin-tutor-record-summary">
              <div><dt>Created</dt><dd>{formatDate(tutor.created_at)}</dd></div>
              <div><dt>Updated</dt><dd>{formatDate(tutor.updated_at)}</dd></div>
              <div><dt>Assigned leads</dt><dd>{leadCount}</dd></div>
              <div><dt>Engagements</dt><dd>{engagementCount}</dd></div>
              <div><dt>Sessions</dt><dd>{sessionCount}</dd></div>
            </dl>
          </section>

          <section className="admin-panel admin-action-card">
            <h2>Onboarding review</h2>

            <dl className="admin-tutor-record-summary">
              <div>
                <dt>Status</dt>
                <dd>{tutor.onboarding_status.replaceAll("_", " ")}</dd>
              </div>

              <div>
                <dt>Submitted</dt>
                <dd>
                  {tutor.onboarding_submitted_at
                    ? formatDate(tutor.onboarding_submitted_at)
                    : "Not submitted"}
                </dd>
              </div>

              <div>
                <dt>Last onboarding update</dt>
                <dd>
                  {tutor.onboarding_updated_at
                    ? formatDate(tutor.onboarding_updated_at)
                    : "Not recorded"}
                </dd>
              </div>
            </dl>

            {tutor.onboarding_status === "submitted" && (
              <div className="admin-inline-message success">
                Tutor profile is ready for review.
              </div>
            )}

            {tutor.status === "pending" && (
              <p className="admin-help">
                Review qualifications, experience, subjects,
                specialisms and availability above. When satisfied,
                verify the tutor and change their status to
                <strong> Active</strong>. This also marks onboarding
                as approved.
              </p>
            )}
          </section>

          <section className="admin-panel admin-action-card">
            <h2>Tutor portal</h2>
            <p className="admin-help">Give this tutor secure access to only their assigned students, trials, sessions and availability.</p>
            <dl className="admin-tutor-record-summary">
              <div><dt>Portal</dt><dd>{tutor.portal_enabled ? "Enabled" : "Disabled"}</dd></div>
              <div><dt>Auth account</dt><dd>{tutor.auth_user_id ? "Linked" : "Not linked"}</dd></div>
              <div><dt>Last access email</dt><dd>{tutor.portal_invited_at ? formatDate(tutor.portal_invited_at) : "Never"}</dd></div>
            </dl>
            <form action={sendTutorPortalInvite}>
              <input type="hidden" name="tutorId" value={tutor.id} />
              <button className="admin-primary-button" type="submit">{tutor.auth_user_id ? "Send password / access link" : "Enable & send portal invite"}</button>
            </form>
            {tutor.portal_enabled && <form action={disableTutorPortal} style={{ marginTop: 10 }}><input type="hidden" name="tutorId" value={tutor.id} /><button className="admin-secondary-button" type="submit">Disable portal access</button></form>}
          </section>

          <section className="admin-panel admin-action-card admin-danger-zone">
            <h2>Delete tutor</h2>
            {linkedCount > 0 ? (
              <>
                <p>This tutor is connected to {linkedCount} CRM/session record{linkedCount === 1 ? "" : "s"}. Permanent deletion is disabled to preserve your history.</p>
                <p className="admin-help">To remove the tutor from active matching, set their status to <strong>Inactive</strong> above.</p>
              </>
            ) : (
              <>
                <p>This tutor has no linked leads, engagements or sessions. You can permanently remove the profile.</p>
                <form action={deleteTutor} className="admin-delete-tutor-form">
                  <input type="hidden" name="tutorId" value={tutor.id} />
                  <label>
                    <span>Type <strong>{tutor.name}</strong> to confirm</span>
                    <input name="confirmName" required autoComplete="off" />
                  </label>
                  <button className="admin-danger-button" type="submit">Permanently delete tutor</button>
                </form>
              </>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
