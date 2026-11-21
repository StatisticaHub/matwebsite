import Link from "next/link";
import ViewerLocalDateTime from "@/components/ViewerLocalDateTime";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionStatusLabels, type SessionStatus } from "@/lib/delivery-data";
export const metadata = { title: "My sessions" };
export const dynamic = "force-dynamic";
function fmt(v: string | null) { return v ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(v)) : "Not scheduled"; }
export default async function TutorSessionsPage() {
  const auth = await getTutorSession(); if (!auth) return null;
  const { data, error } = await createAdminClient().from("tutoring_sessions")
    .select("id,scheduled_for,duration_minutes,status,topic,meeting_url,understanding_rating,tutoring_engagements(subject,students(name))")
    .eq("tutor_id", auth.tutor.id).order("scheduled_for", { ascending: false, nullsFirst: false }).limit(500);
  if (error) throw new Error(error.message);
  const rows = (data || []) as any[];
  return <div className="tutor-page"><header className="tutor-page-head"><div><span className="tutor-eyebrow">Teaching</span><h1>My sessions</h1><p>Open a session to record delivery notes, outcomes, homework and the next teaching focus.</p></div></header>
    <section className="tutor-panel"><div className="tutor-table-wrap"><table className="tutor-table"><thead><tr><th>Date</th><th>Student</th><th>Topic</th><th>Status</th><th>Duration</th><th></th></tr></thead><tbody>
      {rows.map(row => <tr key={row.id}><td><ViewerLocalDateTime value={row.scheduled_for} /></td><td>{row.tutoring_engagements?.students?.name || "Student"}<small>{row.tutoring_engagements?.subject || ""}</small></td><td>{row.topic}</td><td><span className={`tutor-status ${row.status}`}>{sessionStatusLabels[row.status as SessionStatus] || row.status}</span></td><td>{row.duration_minutes} min</td><td><Link href={`/tutor/sessions/${row.id}`}>Open →</Link></td></tr>)}
      {!rows.length && <tr><td colSpan={6}><div className="tutor-empty">No sessions assigned yet.</div></td></tr>}
    </tbody></table></div></section></div>;
}
