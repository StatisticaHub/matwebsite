import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateLeadAssignment } from "@/app/admin/actions";
import type { Tutor, TutoringLead } from "@/lib/admin-data";
import { rankTutorsForLead, type TutorWorkload } from "@/lib/tutor-matching";

export const metadata = { title: "Tutor matching" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ lead?: string }>;

function short(value: string | null | undefined, fallback = "Not provided") {
  return value?.trim() || fallback;
}

export default async function MatchingPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const supabase = createAdminClient();
  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [leadsResult, tutorsResult, engagementsResult, sessionsResult] = await Promise.all([
    supabase.from("tutoring_leads").select("*").in("status", ["new", "contacted", "matching", "tutor_assigned", "booked"]).order("created_at", { ascending: false }),
    supabase.from("tutors").select("*").eq("status", "active").order("name"),
    supabase.from("tutoring_engagements").select("id,tutor_id,status").eq("status", "active"),
    supabase.from("tutoring_sessions").select("id,tutor_id,scheduled_for,duration_minutes,status").eq("status", "planned").gte("scheduled_for", now.toISOString()).lte("scheduled_for", weekEnd.toISOString()),
  ]);

  if (leadsResult.error) throw new Error(leadsResult.error.message);
  if (tutorsResult.error) throw new Error(tutorsResult.error.message);
  if (engagementsResult.error) throw new Error(engagementsResult.error.message);
  if (sessionsResult.error) throw new Error(sessionsResult.error.message);

  const leads = (leadsResult.data || []) as TutoringLead[];
  const tutors = (tutorsResult.data || []) as Tutor[];
  const selectedLead = leads.find((lead) => lead.id === query.lead) || leads[0] || null;

  const workloads: Record<string, TutorWorkload> = {};
  for (const tutor of tutors) workloads[tutor.id] = { activeStudents: 0, upcomingSessionHours: 0 };
  for (const row of engagementsResult.data || []) {
    if (!row.tutor_id) continue;
    workloads[row.tutor_id] ||= { activeStudents: 0, upcomingSessionHours: 0 };
    workloads[row.tutor_id].activeStudents += 1;
  }
  for (const row of sessionsResult.data || []) {
    if (!row.tutor_id) continue;
    workloads[row.tutor_id] ||= { activeStudents: 0, upcomingSessionHours: 0 };
    workloads[row.tutor_id].upcomingSessionHours += Number(row.duration_minutes || 0) / 60;
  }

  const matches = selectedLead ? rankTutorsForLead(selectedLead, tutors, workloads) : [];

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div><span className="admin-eyebrow">Matching engine</span><h1>Tutor matching</h1><p>Rank active tutors using subject, academic level, availability, verification and current workload.</p></div>
      </header>

      <div className="admin-matching-layout">
        <aside className="admin-panel admin-matching-leads">
          <div className="admin-card-head"><h2>Leads to match</h2><span>{leads.length}</span></div>
          <div className="admin-matching-lead-list">
            {leads.map((lead) => (
              <Link key={lead.id} href={`/admin/matching?lead=${lead.id}`} className={selectedLead?.id === lead.id ? "active" : ""}>
                <strong>{lead.name}</strong><span>{lead.subject} · {lead.level}</span><small>{lead.reference}</small>
              </Link>
            ))}
            {!leads.length && <div className="admin-empty">No open leads currently need matching.</div>}
          </div>
        </aside>

        <main className="admin-matching-main">
          {!selectedLead ? (
            <section className="admin-panel admin-detail-card"><div className="admin-empty">Create or reopen a lead to begin matching.</div></section>
          ) : (
            <>
              <section className="admin-panel admin-matching-brief">
                <div><span className="admin-eyebrow">{selectedLead.reference}</span><h2>{selectedLead.name}</h2><p>{selectedLead.subject} · {selectedLead.level} · {selectedLead.support_type}</p></div>
                <div className="admin-matching-brief-meta"><span><strong>Country</strong>{selectedLead.country}</span><span><strong>Availability</strong>{short(selectedLead.availability, "No preference recorded")}</span><span><strong>Requirement</strong>{short(selectedLead.requirements)}</span></div>
                <Link href={`/admin/leads/${selectedLead.id}`} className="admin-secondary-button">Open full lead</Link>
              </section>

              <section className="admin-match-results">
                {matches.map((match, index) => (
                  <article key={match.tutor.id} className="admin-panel admin-match-card">
                    <div className="admin-match-rank">#{index + 1}</div>
                    <div className="admin-match-score"><strong>{match.score}</strong><span>/100</span><small className={`match-${match.label.toLowerCase()}`}>{match.label}</small></div>
                    <div className="admin-match-body">
                      <div className="admin-match-head"><div><h3>{match.tutor.name}</h3><p>{match.tutor.headline || match.tutor.email}</p></div>{match.tutor.verified && <span className="verified-badge">Verified</span>}</div>
                      <div className="admin-match-facts"><span><strong>{match.workload.activeStudents}</strong> active students</span><span><strong>{match.workload.upcomingSessionHours.toFixed(1)}h</strong> next 7 days</span><span><strong>{match.tutor.weekly_capacity_hours ?? "—"}</strong> weekly capacity</span><span><strong>{match.tutor.max_active_students ?? "—"}</strong> max students</span></div>
                      <div className="admin-match-tags">{match.reasons.slice(0, 5).map((reason) => <span key={reason}>{reason}</span>)}</div>
                      {match.warnings.length > 0 && <p className="admin-match-warning">Check: {match.warnings.join(" · ")}</p>}
                      <div className="admin-match-availability"><strong>Availability:</strong> {[...(match.tutor.availability_days || []), ...(match.tutor.availability_periods || [])].join(" · ") || match.tutor.availability_notes || "Not configured"}</div>
                    </div>
                    <div className="admin-match-actions">
                      <form action={updateLeadAssignment}>
                        <input type="hidden" name="leadId" value={selectedLead.id} />
                        <input type="hidden" name="tutorId" value={match.tutor.id} />
                        <input type="hidden" name="currency" value={selectedLead.currency || "GBP"} />
                        <input type="hidden" name="quotedRate" value={selectedLead.quoted_rate ?? ""} />
                        <button type="submit" className="admin-primary-button">Assign tutor</button>
                      </form>
                      <Link href={`/admin/tutors/${match.tutor.id}`} className="admin-text-button">View tutor →</Link>
                    </div>
                  </article>
                ))}
                {!matches.length && <section className="admin-panel admin-detail-card"><div className="admin-empty">No active tutors are available for ranking.</div></section>}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
