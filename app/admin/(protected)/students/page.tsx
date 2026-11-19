import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Student, TutoringEngagement } from "@/lib/delivery-data";
import type { Tutor } from "@/lib/admin-data";
import { createStudentEngagement } from "@/app/admin/delivery-actions";

export const metadata = { title: "Students" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const search = (params.q || "").trim();
  const supabase = createAdminClient();

  let studentQuery = supabase.from("students").select("*").order("updated_at", { ascending: false }).limit(150);
  if (search) {
    const escaped = search.replaceAll(",", " ");
    studentQuery = studentQuery.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,institution.ilike.%${escaped}%,programme.ilike.%${escaped}%`);
  }

  const [{ data: studentData, error }, { data: engagementData }, { data: tutorData }] = await Promise.all([
    studentQuery,
    supabase.from("tutoring_engagements").select("*").order("created_at", { ascending: false }),
    supabase.from("tutors").select("*").eq("status", "active").order("name"),
  ]);
  if (error) throw new Error(error.message);

  const students = (studentData || []) as Student[];
  const engagements = (engagementData || []) as TutoringEngagement[];
  const tutors = (tutorData || []) as Tutor[];
  const engagementByStudent = new Map<string, TutoringEngagement>();
  for (const engagement of engagements) {
    if (!engagementByStudent.has(engagement.student_id) || engagement.status === "active") {
      engagementByStudent.set(engagement.student_id, engagement);
    }
  }
  const tutorMap = new Map(tutors.map((tutor) => [tutor.id, tutor]));
  const activeCount = students.filter((student) => student.status === "active").length;
  const activeEngagements = engagements.filter((engagement) => engagement.status === "active").length;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Tutoring delivery</span>
          <h1>Students</h1>
          <p>Manage active learners, academic goals and the tutoring engagements that continue after a lead is booked.</p>
        </div>
      </header>

      <section className="admin-metrics admin-metrics-3">
        <div><span>Student records</span><strong>{students.length}</strong></div>
        <div><span>Active students</span><strong>{activeCount}</strong></div>
        <div><span>Active engagements</span><strong>{activeEngagements}</strong></div>
      </section>

      <div className="admin-delivery-layout">
        <section className="admin-panel">
          <div className="admin-toolbar">
            <form className="admin-search" action="/admin/students">
              <input name="q" defaultValue={search} placeholder="Search student, email, institution or programme" />
              <button type="submit">Search</button>
            </form>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Student</th><th>Academic context</th><th>Tutoring</th><th>Current focus</th><th></th></tr></thead>
              <tbody>
                {students.map((student) => {
                  const engagement = engagementByStudent.get(student.id);
                  const tutor = engagement?.tutor_id ? tutorMap.get(engagement.tutor_id) : null;
                  return (
                    <tr key={student.id}>
                      <td><strong>{student.name}</strong><span>{student.email}</span><small>{student.status}</small></td>
                      <td><strong>{student.academic_level || "Level not set"}</strong><span>{student.programme || student.institution || "Academic context not set"}</span><small>{student.institution || ""}</small></td>
                      <td><strong>{engagement?.subject || "No engagement"}</strong><span>{tutor?.name || "Tutor not assigned"}</span><small>{engagement?.frequency || "Frequency not set"}</small></td>
                      <td><span>{engagement?.current_focus || engagement?.module || "Not set"}</span><small>{engagement?.status || ""}</small></td>
                      <td><div className="admin-row-actions"><Link className="admin-row-link" href={`/admin/students/${student.id}`}>Open →</Link><Link className="admin-row-link muted" href={`/admin/students/${student.id}/edit`}>Edit</Link></div></td>
                    </tr>
                  );
                })}
                {!students.length && <tr><td colSpan={5}><div className="admin-empty">No student records yet. Convert a booked lead or add an existing student.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="admin-panel admin-action-card admin-add-student">
          <span className="admin-eyebrow">Existing client</span>
          <h2>Add student manually</h2>
          <p className="admin-help">Use this for students who did not enter through the website lead form.</p>
          <form action={createStudentEngagement}>
            <label><span>Name</span><input name="name" required /></label>
            <label><span>Email</span><input name="email" type="email" required /></label>
            <label><span>Phone</span><input name="phone" /></label>
            <label><span>Country</span><input name="country" /></label>
            <label><span>Academic level</span><input name="academicLevel" placeholder="Master's" /></label>
            <label><span>Institution</span><input name="institution" placeholder="University of Sussex" /></label>
            <label><span>Programme</span><input name="programme" placeholder="MSc Data Science" /></label>
            <label><span>Subject</span><input name="subject" required placeholder="Statistics" /></label>
            <label><span>Module / course</span><input name="module" placeholder="Linear Statistical Models" /></label>
            <label><span>Goal</span><textarea name="goal" placeholder="What is the student trying to achieve?" /></label>
            <label><span>Weak topics</span><input name="weakTopics" placeholder="Probability, regression, hypothesis testing" /></label>
            <div className="admin-form-grid-2"><label><span>Confidence (1–5)</span><input name="confidence" type="number" min="1" max="5" /></label><label><span>Next deadline</span><input name="upcomingDeadline" type="date" /></label></div>
            <label><span>Learning preference</span><input name="learningStyle" placeholder="Worked examples, theory first, exam practice…" /></label>
            <label><span>Initial assessment</span><textarea name="assessmentSummary" placeholder="Gaps, strengths and recommended teaching approach" /></label>
            <label><span>Tutor</span><select name="tutorId" defaultValue=""><option value="">Not assigned</option>{tutors.map((tutor) => <option key={tutor.id} value={tutor.id}>{tutor.name}</option>)}</select></label>
            <div className="admin-form-grid-2">
              <label><span>Frequency</span><input name="frequency" placeholder="Weekly" /></label>
              <label><span>Session minutes</span><input name="sessionDuration" type="number" min="15" max="480" defaultValue="60" /></label>
            </div>
            <button className="admin-primary-button" type="submit">Create student</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
