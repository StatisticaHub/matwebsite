import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateTutorTrialRecord } from "@/app/tutor/actions";
import {
  DEFAULT_TIME_ZONE,
  dateKeyInTimeZone,
  formatDateTimeInTimeZone,
  normalizeTimeZone,
} from "@/lib/time-zone";
export const metadata = { title: "My trials" };
export const dynamic = "force-dynamic";
type SearchParams = Promise<{ saved?: string }>;
function safeUrl(value: string | null) { if (!value) return null; try { const u = new URL(value); return ["https:", "http:"].includes(u.protocol) ? u.toString() : null; } catch { return null; } }
export default async function TutorTrialsPage({ searchParams }: { searchParams: SearchParams }) {
  const auth = await getTutorSession(); if (!auth) return null;

  const tutorTimeZone =
    normalizeTimeZone(
      auth.tutor.timezone,
      DEFAULT_TIME_ZONE,
    );

  const fmt = (
    value: string | null,
  ) =>
    formatDateTimeInTimeZone(
      value,
      tutorTimeZone,
    );
 const query = await searchParams;
  const { data, error } = await createAdminClient().from("tutoring_leads")
    .select("id,reference,name,email,country,level,subject,support_type,topic,requirements,trial_status,trial_scheduled_for,trial_duration_minutes,trial_meeting_url,trial_tutor_feedback")
    .eq("assigned_tutor_id", auth.tutor.id).neq("trial_status", "not_scheduled").order("trial_scheduled_for", { ascending: false, nullsFirst: false }).limit(100);
  if (error) throw new Error(error.message); const rows = (data || []) as any[];
  return <div className="tutor-page"><header className="tutor-page-head"><div><span className="tutor-eyebrow">Trial teaching</span><h1>My trials</h1><p>Review upcoming trial requirements and record teaching feedback afterwards. Final conversion decisions remain with the MAT admin team.</p></div></header>
    {query.saved === "1" && <div className="tutor-alert success" role="status" aria-live="polite">Trial record updated.</div>}
    <div className="tutor-card-grid">{rows.map(row => { const meeting = safeUrl(row.trial_meeting_url); return <article className="tutor-student-card" key={row.id}><div className="tutor-student-card-head"><div><span className="tutor-eyebrow">{row.reference}</span><h2>{row.name}</h2><p>{row.subject} · {row.level}</p></div><span className={`tutor-status ${row.trial_status}`}>{String(row.trial_status).replaceAll("_", " ")}</span></div><dl className="tutor-details"><div><dt>When</dt><dd>{fmt(row.trial_scheduled_for)}</dd></div><div><dt>Duration</dt><dd>{row.trial_duration_minutes || 30} min</dd></div><div><dt>Topic</dt><dd>{row.topic || "Not specified"}</dd></div><div><dt>Support</dt><dd>{row.support_type}</dd></div></dl><div className="tutor-requirement"><strong>Student requirement</strong><p>{row.requirements}</p></div>{meeting && <a className="tutor-primary-link" href={meeting} target="_blank" rel="noreferrer">Join trial ↗</a>}<form action={updateTutorTrialRecord} className="tutor-form compact"><input type="hidden" name="leadId" value={row.id} /><label><span>Trial status</span><select name="trialStatus" defaultValue={row.trial_status}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="no_show">No show</option><option value="cancelled">Cancelled</option></select></label><label><span>Tutor feedback</span><textarea name="trialTutorFeedback" defaultValue={row.trial_tutor_feedback || ""} placeholder="Level, engagement, areas to work on, recommended approach…" /></label><button className="tutor-secondary-button" type="submit">Save trial feedback</button></form></article>; })}{!rows.length && <div className="tutor-panel tutor-empty">No trials assigned yet.</div>}</div>
  </div>;
}
