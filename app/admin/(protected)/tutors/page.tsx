import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/admin-data";
import { createTutor, toggleTutorStatus } from "@/app/admin/actions";

export const metadata = { title: "Tutor records" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ deleted?: string }>;

export default async function TutorsAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tutors").select("*").order("name");
  if (error) throw new Error(error.message);
  const tutors = (data || []) as Tutor[];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Matching supply</span>
          <h1>Tutor records</h1>
          <p>Create, edit, activate, pause and safely remove tutor profiles.</p>
        </div>
      </header>

      {params.deleted === "1" && (
        <div className="admin-inline-message success">Tutor profile deleted.</div>
      )}

      <div className="admin-tutor-layout">
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head"><h2>Tutor network</h2><span>{tutors.length} records</span></div>
          <div className="admin-tutor-list">
            {tutors.map((tutor) => (
              <article key={tutor.id}>
                <div className="admin-tutor-main">
                  <div>
                    <strong>{tutor.name}</strong>
                    {tutor.verified && <span className="verified-badge">Verified</span>}
                  </div>
                  <span>{tutor.headline || tutor.email}</span>
                  <small>{tutor.subjects.join(" · ") || "Subjects not set"}</small>
                  {(tutor.specialisms || []).length > 0 && (
                    <small>
                      Specialist: {tutor.specialisms.slice(0, 4).join(" · ")}
                    </small>
                  )}
                </div>

                <div className="admin-tutor-meta">
                  <span>{tutor.hourly_rate ? `${tutor.currency} ${tutor.hourly_rate}/hr` : "Rate not set"}</span>
                  <span>{tutor.timezone || "Timezone not set"}</span>
                  <span className={`admin-status tutor-${tutor.status}`}>{tutor.status}</span>
                  {tutor.status === "pending" && (
                    <span>
                      Onboarding: {tutor.onboarding_status.replaceAll("_", " ")}
                    </span>
                  )}
                </div>

                <div className="admin-tutor-actions">
                  <Link className="admin-secondary-button" href={`/admin/tutors/${tutor.id}`}>Edit</Link>
                  {tutor.status !== "pending" && (
                    <form action={toggleTutorStatus}>
                      <input type="hidden" name="tutorId" value={tutor.id} />
                      <input
                        type="hidden"
                        name="nextStatus"
                        value={tutor.status === "active" ? "inactive" : "active"}
                      />
                      <button type="submit" className="admin-link-button">
                        {tutor.status === "active" ? "Pause" : "Activate"}
                      </button>
                    </form>
                  )}
                </div>
              </article>
            ))}
            {!tutors.length && <div className="admin-empty">No tutor records yet. Add your first tutor using the form.</div>}
          </div>
        </section>

        <aside className="admin-panel admin-action-card admin-add-tutor">
          <h2>Add tutor</h2>
          <form action={createTutor}>
            <label><span>Name</span><input name="name" required /></label>
            <label><span>Email</span><input name="email" type="email" required /></label>
            <label><span>Professional headline</span><input name="headline" placeholder="Medical Statistician · MSc Statistics" /></label>
            <label><span>Subjects</span><input name="subjects" placeholder="Statistics, Data Science" /><small>Comma-separated</small></label>
            <label><span>Levels</span><input name="levels" placeholder="Undergraduate, Master's" /><small>Comma-separated</small></label>

            <label>
              <span>Specialist topics / methods</span>
              <input
                name="specialisms"
                placeholder="Regression, Econometrics, R, Survival Analysis"
              />
              <small>Comma-separated — used by smart matching</small>
            </label>

            <label>
              <span>Qualifications</span>
              <textarea
                name="qualifications"
                placeholder="MSc Statistics, PhD candidate, professional qualifications…"
              />
            </label>

            <label>
              <span>Teaching / tutoring experience</span>
              <textarea
                name="teachingExperience"
                placeholder="University tutoring, classroom teaching, research supervision, industry experience…"
              />
            </label>

            <label>
              <span>Teaching languages</span>
              <input
                name="languages"
                placeholder="English, Hindi"
              />
              <small>Comma-separated</small>
            </label>

            <label><span>Timezone</span><input name="timezone" placeholder="Europe/London" /></label>
            <label><span>Availability notes</span><textarea name="availability" placeholder="Tue/Thu evenings; weekends" /></label>
            <fieldset className="admin-match-fieldset"><legend>Available days</legend><div className="admin-check-grid">{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((day) => <label className="admin-check" key={day}><input type="checkbox" name="availabilityDays" value={day.toLowerCase()} /><span>{day}</span></label>)}</div></fieldset>
            <fieldset className="admin-match-fieldset"><legend>Teaching periods</legend><div className="admin-check-grid compact">{["Morning","Afternoon","Evening"].map((period) => <label className="admin-check" key={period}><input type="checkbox" name="availabilityPeriods" value={period.toLowerCase()} /><span>{period}</span></label>)}</div></fieldset>
            <div className="admin-form-grid-2"><label><span>Weekly capacity (hours)</span><input name="weeklyCapacityHours" type="number" min="0" max="80" step="0.5" placeholder="10" /></label><label><span>Max active students</span><input name="maxActiveStudents" type="number" min="0" max="100" placeholder="8" /></label></div>
            <label className="admin-check"><input type="checkbox" name="acceptsTrials" value="yes" defaultChecked /><span>Accepting trial sessions</span></label>
            <label><span>Internal hourly rate</span><div className="admin-rate-row"><select name="currency" defaultValue="GBP"><option>GBP</option><option>USD</option><option>CAD</option><option>EUR</option><option>INR</option></select><input name="hourlyRate" type="number" min="0" step="0.01" /></div></label>
            <p className="admin-help">
              New tutor records start as <strong>Pending</strong>. Review the tutor profile,
              record verification and activate them from their tutor record.
            </p>
            <button className="admin-primary-button" type="submit">Add tutor</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
