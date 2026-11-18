import { createAdminClient } from "@/lib/supabase/admin";
import type { Tutor } from "@/lib/admin-data";
import { createTutor, toggleTutorStatus } from "@/app/admin/actions";

export const metadata = { title: "Tutor records" };
export const dynamic = "force-dynamic";

export default async function TutorsAdminPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("tutors").select("*").order("name");
  if (error) throw new Error(error.message);
  const tutors = (data || []) as Tutor[];

  return (
    <div className="admin-page">
      <header className="admin-page-head"><div><span className="admin-eyebrow">Matching supply</span><h1>Tutor records</h1><p>Keep a lightweight internal record of tutors available for manual matching.</p></div></header>
      <div className="admin-tutor-layout">
        <section className="admin-panel admin-detail-card">
          <div className="admin-card-head"><h2>Tutor network</h2><span>{tutors.length} records</span></div>
          <div className="admin-tutor-list">
            {tutors.map((tutor) => (
              <article key={tutor.id}>
                <div className="admin-tutor-main"><div><strong>{tutor.name}</strong>{tutor.verified && <span className="verified-badge">Verified</span>}</div><span>{tutor.headline || tutor.email}</span><small>{tutor.subjects.join(" · ") || "Subjects not set"}</small></div>
                <div className="admin-tutor-meta"><span>{tutor.hourly_rate ? `${tutor.currency} ${tutor.hourly_rate}/hr` : "Rate not set"}</span><span>{tutor.timezone || "Timezone not set"}</span><span className={`admin-status tutor-${tutor.status}`}>{tutor.status}</span></div>
                <form action={toggleTutorStatus}><input type="hidden" name="tutorId" value={tutor.id} /><input type="hidden" name="nextStatus" value={tutor.status === "active" ? "inactive" : "active"} /><button type="submit" className="admin-link-button">{tutor.status === "active" ? "Pause" : "Activate"}</button></form>
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
            <label><span>Timezone</span><input name="timezone" placeholder="Europe/London" /></label>
            <label><span>Availability notes</span><textarea name="availability" placeholder="Tue/Thu evenings; weekends" /></label>
            <label><span>Internal hourly rate</span><div className="admin-rate-row"><select name="currency" defaultValue="GBP"><option>GBP</option><option>USD</option><option>EUR</option><option>INR</option></select><input name="hourlyRate" type="number" min="0" step="0.01" /></div></label>
            <label className="admin-check"><input type="checkbox" name="verified" value="yes" /><span>Qualifications / identity verified</span></label>
            <button className="admin-primary-button" type="submit">Add tutor</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
