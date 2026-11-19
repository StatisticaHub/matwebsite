import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
export const metadata = { title: "My students" };
export const dynamic = "force-dynamic";
export default async function TutorStudentsPage() {
  const auth = await getTutorSession(); if (!auth) return null;
  const { data, error } = await createAdminClient().from("tutoring_engagements")
    .select("id,status,subject,title,module,goal,target,current_focus,frequency,session_duration_minutes,upcoming_deadline,students(id,name,email,academic_level,institution,programme)")
    .eq("tutor_id", auth.tutor.id).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data || []) as any[];
  return <div className="tutor-page"><header className="tutor-page-head"><div><span className="tutor-eyebrow">Learners</span><h1>My students</h1><p>Your assigned tutoring engagements and current learning focus.</p></div></header>
    <div className="tutor-card-grid">{rows.map(row => <article className="tutor-student-card" key={row.id}><div className="tutor-student-card-head"><div><span className="tutor-eyebrow">{row.subject}</span><h2>{row.students?.name || "Student"}</h2><p>{row.students?.academic_level || "Level not recorded"}{row.students?.institution ? ` · ${row.students.institution}` : ""}</p></div><span className={`tutor-status ${row.status}`}>{row.status}</span></div><dl className="tutor-details"><div><dt>Current focus</dt><dd>{row.current_focus || row.module || "Not set"}</dd></div><div><dt>Goal</dt><dd>{row.goal || "Not set"}</dd></div><div><dt>Frequency</dt><dd>{row.frequency || "Not set"}</dd></div><div><dt>Typical session</dt><dd>{row.session_duration_minutes} min</dd></div><div><dt>Upcoming deadline</dt><dd>{row.upcoming_deadline || "—"}</dd></div></dl><p className="tutor-contact-line">{row.students?.email || ""}</p></article>)}{!rows.length && <div className="tutor-panel tutor-empty">No students are currently assigned to you.</div>}</div>
  </div>;
}
