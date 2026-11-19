import Link from "next/link";
import { getTutorSession } from "@/lib/tutor-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Tutor portal" };
export const dynamic = "force-dynamic";

function fmt(value: string | null) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}
function dayKey(value: Date) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const m = Object.fromEntries(p.filter(x => x.type !== "literal").map(x => [x.type, x.value]));
  return `${m.year}-${m.month}-${m.day}`;
}

export default async function TutorHomePage() {
  const auth = await getTutorSession();
  if (!auth) return null;
  const supabase = createAdminClient();
  const now = new Date();
  const [{ data: sessionData }, { data: engagementData }, { data: trialData }] = await Promise.all([
    supabase.from("tutoring_sessions").select("id,scheduled_for,duration_minutes,status,topic,meeting_url,tutoring_engagements(subject,students(name))").eq("tutor_id", auth.tutor.id).order("scheduled_for", { ascending: true, nullsFirst: false }).limit(250),
    supabase.from("tutoring_engagements").select("id,status,student_id,students(name)").eq("tutor_id", auth.tutor.id),
    supabase.from("tutoring_leads").select("id,name,subject,trial_status,trial_scheduled_for,trial_duration_minutes,trial_meeting_url").eq("assigned_tutor_id", auth.tutor.id).eq("trial_status", "scheduled").order("trial_scheduled_for", { ascending: true }),
  ]);
  const sessions = (sessionData || []) as any[];
  const activeStudents = new Set((engagementData || []).filter((x: any) => x.status === "active").map((x: any) => x.student_id)).size;
  const planned = sessions.filter(x => x.status === "planned" && x.scheduled_for && new Date(x.scheduled_for) >= now);
  const todayKey = dayKey(now);
  const today = planned.filter(x => dayKey(new Date(x.scheduled_for)) === todayKey);
  const completedMinutes = sessions.filter(x => x.status === "completed").reduce((sum, x) => sum + Number(x.duration_minutes || 0), 0);
  const upcoming = planned.slice(0, 6);
  const trials = (trialData || []) as any[];

  return <div className="tutor-page">
    <header className="tutor-page-head"><div><span className="tutor-eyebrow">Tutor workspace</span><h1>Welcome, {auth.tutor.name.split(/\s+/)[0]}</h1><p>Your students, upcoming teaching, trials and delivery record in one place.</p></div></header>
    <section className="tutor-metrics">
      <div><span>Today</span><strong>{today.length}</strong><small>planned sessions</small></div>
      <div><span>Active students</span><strong>{activeStudents}</strong><small>current engagements</small></div>
      <div><span>Upcoming trials</span><strong>{trials.length}</strong><small>scheduled</small></div>
      <div><span>Teaching delivered</span><strong>{(completedMinutes / 60).toFixed(1)}h</strong><small>completed sessions</small></div>
    </section>
    <div className="tutor-grid-2">
      <section className="tutor-panel"><div className="tutor-panel-head"><h2>Next sessions</h2><Link href="/tutor/sessions">View all →</Link></div><div className="tutor-list">
        {upcoming.map(x => <Link href={`/tutor/sessions/${x.id}`} key={x.id}><div><strong>{x.topic}</strong><span>{x.tutoring_engagements?.students?.name || "Student"} · {x.tutoring_engagements?.subject || "Tutoring"}</span></div><div><strong>{fmt(x.scheduled_for)}</strong><span>{x.duration_minutes} min</span></div></Link>)}
        {!upcoming.length && <div className="tutor-empty">No upcoming sessions.</div>}
      </div></section>
      <section className="tutor-panel"><div className="tutor-panel-head"><h2>Upcoming trials</h2><Link href="/tutor/trials">View trials →</Link></div><div className="tutor-list">
        {trials.slice(0, 6).map(x => <Link href="/tutor/trials" key={x.id}><div><strong>{x.name}</strong><span>{x.subject}</span></div><div><strong>{fmt(x.trial_scheduled_for)}</strong><span>{x.trial_duration_minutes || 30} min</span></div></Link>)}
        {!trials.length && <div className="tutor-empty">No upcoming trials.</div>}
      </div></section>
    </div>
  </div>;
}
