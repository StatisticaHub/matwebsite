import Link from "next/link";
import ViewerLocalDateTime from "@/components/ViewerLocalDateTime";
import { notFound } from "next/navigation";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sessionStatuses, sessionStatusLabels, type SessionStatus } from "@/lib/delivery-data";
import { updateTutorSessionRecord } from "@/app/tutor/actions";

import TutorSessionRecordings from "@/components/TutorSessionRecordings";
export const dynamic = "force-dynamic";
type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ saved?: string }>;
function fmt(v: string | null) { return v ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(v)) : "Not scheduled"; }
function safeUrl(value: string | null) { if (!value) return null; try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.toString() : null; } catch { return null; } }

export default async function TutorSessionDetailPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const auth = await getTutorSession(); if (!auth) return null;
  const { id } = await params; const query = await searchParams;
  const { data, error } = await createAdminClient().from("tutoring_sessions")
    .select("id,scheduled_for,completed_at,duration_minutes,status,topic,lesson_notes,understanding_rating,next_topic,homework_summary,meeting_url,tutor_id,tutoring_engagements(tutor_id,subject,title,students(name,email,academic_level))")
    .eq("id", id).single();
  if (error || !data) notFound();
  const row = data as any;
  if (row.tutor_id !== auth.tutor.id && row.tutoring_engagements?.tutor_id !== auth.tutor.id) notFound();
  const meeting = safeUrl(row.meeting_url);
  return <div className="tutor-page">
    <div className="tutor-breadcrumb"><Link href="/tutor/sessions">← Sessions</Link><span>{row.topic}</span></div>
    <header className="tutor-page-head"><div><span className="tutor-eyebrow">{row.tutoring_engagements?.subject || "Tutoring"}</span><h1>{row.topic}</h1><p>{row.tutoring_engagements?.students?.name || "Student"} · <ViewerLocalDateTime value={row.scheduled_for} /></p></div><span className={`tutor-status ${row.status}`}>{sessionStatusLabels[row.status as SessionStatus]}</span></header>
    {query.saved === "1" && <div className="tutor-alert success">Session record saved.</div>}
    <TutorSessionRecordings sessionId={row.id} />
    <div className="tutor-grid-2 align-start">
      <section className="tutor-panel"><div className="tutor-panel-head"><h2>Update session record</h2><span>{row.duration_minutes} min</span></div>
        <form action={updateTutorSessionRecord} className="tutor-form"><input type="hidden" name="sessionId" value={row.id} />
          <label><span>Status</span><select name="status" defaultValue={row.status}>{sessionStatuses.map(s => <option value={s} key={s}>{sessionStatusLabels[s]}</option>)}</select></label>
          <label><span>Meeting link</span><input name="meetingUrl" type="url" defaultValue={row.meeting_url || ""} placeholder="https://meet.google.com/…" /></label>
          <label><span>Lesson notes</span><textarea name="lessonNotes" defaultValue={row.lesson_notes || ""} placeholder="Concepts covered, misconceptions, progress, teaching notes…" /></label>
          <div className="tutor-form-grid"><label><span>Understanding (1–5)</span><input name="understandingRating" type="number" min="1" max="5" defaultValue={row.understanding_rating ?? ""} /></label><label><span>Next topic</span><input name="nextTopic" defaultValue={row.next_topic || ""} /></label></div>
          <label><span>Homework / practice summary</span><textarea name="homeworkSummary" defaultValue={row.homework_summary || ""} /></label>
          <button className="tutor-primary-button" type="submit">Save session record</button>
        </form>
      </section>
      <aside className="tutor-stack">
        <section className="tutor-panel"><h2>Session details</h2><dl className="tutor-details"><div><dt>Student</dt><dd>{row.tutoring_engagements?.students?.name || "—"}</dd></div><div><dt>Level</dt><dd>{row.tutoring_engagements?.students?.academic_level || "—"}</dd></div><div><dt>Scheduled</dt><dd><ViewerLocalDateTime value={row.scheduled_for} /></dd></div><div><dt>Duration</dt><dd>{row.duration_minutes} minutes</dd></div><div><dt>Completed</dt><dd>{row.completed_at ? fmt(row.completed_at) : "—"}</dd></div></dl>{meeting && <a className="tutor-primary-link" href={meeting} target="_blank" rel="noreferrer">Join session ↗</a>}</section>
        <section className="tutor-panel"><h2>Student contact</h2><p className="tutor-help">Use contact details only for tutoring-related communication and keep student information private.</p><p><strong>{row.tutoring_engagements?.students?.email || "No email available"}</strong></p></section>
      </aside>
    </div>
  </div>;
}
