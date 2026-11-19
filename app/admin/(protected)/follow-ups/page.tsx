import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadStatusLabels, type LeadStatus } from "@/lib/admin-data";

export const metadata = { title: "Follow-ups" };
export const dynamic = "force-dynamic";

type QueueLead = {
  id: string;
  reference: string;
  name: string;
  email: string;
  subject: string;
  level: string;
  status: LeadStatus;
  assigned_tutor_id: string | null;
  next_follow_up_at: string | null;
  follow_up_note: string | null;
  trial_status: string | null;
  trial_scheduled_for: string | null;
  trial_duration_minutes: number | null;
  trial_outcome: string | null;
};

function ukDateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function formatUk(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

function QueueSection({ title, description, leads, tutorMap, tone = "default" }: {
  title: string;
  description: string;
  leads: QueueLead[];
  tutorMap: Map<string, string>;
  tone?: "default" | "danger" | "trial";
}) {
  return (
    <section className={`admin-panel admin-queue-section queue-${tone}`}>
      <div className="admin-card-head">
        <div><span className="admin-eyebrow">Action queue</span><h2>{title}</h2><p>{description}</p></div>
        <strong>{leads.length}</strong>
      </div>
      <div className="admin-queue-list">
        {leads.map((lead) => {
          const date = lead.trial_status === "scheduled" && lead.trial_scheduled_for ? lead.trial_scheduled_for : lead.next_follow_up_at;
          return (
            <article key={`${title}-${lead.id}`}>
              <div className="admin-queue-person">
                <strong>{lead.name}</strong>
                <span>{lead.subject} · {lead.level}</span>
                <small>{lead.reference} · {leadStatusLabels[lead.status]}</small>
              </div>
              <div className="admin-queue-when">
                {date && <strong>{formatUk(date)}</strong>}
                {lead.follow_up_note && lead.trial_status !== "scheduled" && <span>{lead.follow_up_note}</span>}
                {lead.trial_status === "scheduled" && <span>{lead.trial_duration_minutes || 30} min trial{lead.assigned_tutor_id && tutorMap.get(lead.assigned_tutor_id) ? ` · ${tutorMap.get(lead.assigned_tutor_id)}` : ""}</span>}
              </div>
              <Link className="admin-row-link" href={`/admin/leads/${lead.id}`}>Open →</Link>
            </article>
          );
        })}
        {!leads.length && <div className="admin-empty">Nothing in this queue.</div>}
      </div>
    </section>
  );
}

export default async function FollowUpsPage() {
  const supabase = createAdminClient();
  const [{ data, error }, { data: tutorsData }] = await Promise.all([
    supabase
      .from("tutoring_leads")
      .select("id,reference,name,email,subject,level,status,assigned_tutor_id,next_follow_up_at,follow_up_note,trial_status,trial_scheduled_for,trial_duration_minutes,trial_outcome")
      .not("status", "in", "(closed,lost)")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("tutors").select("id,name"),
  ]);
  if (error) throw new Error(error.message);

  const leads = (data || []) as QueueLead[];
  const tutorMap = new Map((tutorsData || []).map((tutor) => [tutor.id as string, tutor.name as string]));
  const now = new Date();
  const today = ukDateKey(now);

  const followUps = leads.filter((lead) => Boolean(lead.next_follow_up_at));
  const overdue = followUps
    .filter((lead) => new Date(lead.next_follow_up_at!) < now && ukDateKey(new Date(lead.next_follow_up_at!)) !== today)
    .sort((a, b) => new Date(a.next_follow_up_at!).getTime() - new Date(b.next_follow_up_at!).getTime());
  const dueToday = followUps
    .filter((lead) => ukDateKey(new Date(lead.next_follow_up_at!)) === today)
    .sort((a, b) => new Date(a.next_follow_up_at!).getTime() - new Date(b.next_follow_up_at!).getTime());
  const upcoming = followUps
    .filter((lead) => new Date(lead.next_follow_up_at!) > now && ukDateKey(new Date(lead.next_follow_up_at!)) !== today)
    .sort((a, b) => new Date(a.next_follow_up_at!).getTime() - new Date(b.next_follow_up_at!).getTime())
    .slice(0, 30);
  const trials = leads
    .filter((lead) => lead.trial_status === "scheduled" && lead.trial_scheduled_for && new Date(lead.trial_scheduled_for) >= now)
    .sort((a, b) => new Date(a.trial_scheduled_for!).getTime() - new Date(b.trial_scheduled_for!).getTime())
    .slice(0, 30);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Daily operations</span>
          <h1>Follow-ups & trials</h1>
          <p>Work through student follow-ups and upcoming trial sessions without losing track of an enquiry.</p>
        </div>
        <Link className="admin-primary-button" href="/admin">Lead inbox</Link>
      </header>

      <section className="admin-queue-metrics">
        <article className={overdue.length ? "urgent" : ""}><span>Overdue</span><strong>{overdue.length}</strong><small>Follow-ups needing attention</small></article>
        <article><span>Due today</span><strong>{dueToday.length}</strong><small>Student follow-ups today</small></article>
        <article><span>Upcoming</span><strong>{upcoming.length}</strong><small>Future follow-up reminders</small></article>
        <article><span>Trials scheduled</span><strong>{trials.length}</strong><small>Upcoming trial sessions</small></article>
      </section>

      <div className="admin-queue-grid">
        <QueueSection title="Overdue follow-ups" description="Contact these students first." leads={overdue} tutorMap={tutorMap} tone="danger" />
        <QueueSection title="Due today" description="Follow-ups scheduled for today in UK time." leads={dueToday} tutorMap={tutorMap} />
        <QueueSection title="Upcoming trial sessions" description="Trials currently scheduled from now onwards." leads={trials} tutorMap={tutorMap} tone="trial" />
        <QueueSection title="Upcoming follow-ups" description="The next scheduled follow-ups after today." leads={upcoming} tutorMap={tutorMap} />
      </div>
    </div>
  );
}
