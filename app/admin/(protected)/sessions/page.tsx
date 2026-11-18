import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionStatusLabels, type SessionStatus } from "@/lib/delivery-data";

export const metadata = { title: "Sessions" };
export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  scheduled_for: string | null;
  duration_minutes: number;
  status: SessionStatus;
  topic: string;
  understanding_rating: number | null;
  engagement_id: string;
  tutoring_engagements: {
    student_id: string;
    subject: string;
    title: string;
    students: { name: string } | null;
    tutors: { name: string } | null;
  } | null;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

export default async function SessionsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tutoring_sessions")
    .select("id,scheduled_for,duration_minutes,status,topic,understanding_rating,engagement_id,tutoring_engagements(student_id,subject,title,students(name),tutors(name))")
    .order("scheduled_for", { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const sessions = (data || []) as unknown as SessionRow[];
  const planned = sessions.filter((item) => item.status === "planned").length;
  const completed = sessions.filter((item) => item.status === "completed").length;
  const totalMinutes = sessions.filter((item) => item.status === "completed").reduce((sum, item) => sum + item.duration_minutes, 0);

  return (
    <div className="admin-page">
      <header className="admin-page-head"><div><span className="admin-eyebrow">Tutoring delivery</span><h1>Sessions</h1><p>A central record of planned and completed teaching across active students.</p></div></header>
      <section className="admin-metrics admin-metrics-3"><div><span>Planned</span><strong>{planned}</strong></div><div><span>Completed</span><strong>{completed}</strong></div><div><span>Teaching hours</span><strong>{Math.round(totalMinutes / 6) / 10}</strong></div></section>
      <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Student</th><th>Session</th><th>When</th><th>Tutor</th><th>Status</th><th></th></tr></thead><tbody>
        {sessions.map((item) => <tr key={item.id}><td><strong>{item.tutoring_engagements?.students?.name || "Student"}</strong><span>{item.tutoring_engagements?.subject || ""}</span></td><td><strong>{item.topic}</strong><span>{item.duration_minutes} minutes</span>{item.understanding_rating && <small>Understanding {item.understanding_rating}/5</small>}</td><td><span>{formatDateTime(item.scheduled_for)}</span></td><td><span>{item.tutoring_engagements?.tutors?.name || "Not assigned"}</span></td><td><span className={`admin-status session-${item.status}`}>{sessionStatusLabels[item.status]}</span></td><td>{item.tutoring_engagements?.student_id && <Link className="admin-row-link" href={`/admin/students/${item.tutoring_engagements.student_id}`}>Student →</Link>}</td></tr>)}
        {!sessions.length && <tr><td colSpan={6}><div className="admin-empty">No tutoring sessions recorded yet.</div></td></tr>}
      </tbody></table></div></section>
    </div>
  );
}
