import Link from "next/link";
import { loadRetentionDashboard } from "@/lib/retention-dashboard";
import { formatRetentionDateTime, retentionCaseStatusLabels, retentionRiskLabels } from "@/lib/retention";
import { logRetentionOutreach, runRetentionScan, updateRetentionCase, updateRetentionSettings } from "@/app/admin/retention-actions";

export const metadata = { title: "Retention & Rebooking" };
export const dynamic = "force-dynamic";

function pct(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function hours(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}h`;
}

function CapacityCell({ hours7, capacity, activeStudents, maxStudents }: { hours7: number; capacity: number | null; activeStudents: number; maxStudents: number | null }) {
  const hourPct = capacity && capacity > 0 ? Math.round((hours7 / capacity) * 100) : null;
  const studentPct = maxStudents && maxStudents > 0 ? Math.round((activeStudents / maxStudents) * 100) : null;
  return <div className="retention-capacity-cell">
    <span>{capacity ? `${hours7}h / ${capacity}h` : `${hours7}h / capacity not set`}{hourPct !== null ? ` · ${hourPct}%` : ""}</span>
    <small>{maxStudents ? `${activeStudents} / ${maxStudents} active students${studentPct !== null ? ` · ${studentPct}%` : ""}` : `${activeStudents} active students · limit not set`}</small>
  </div>;
}

export default async function RetentionPage({ searchParams }: { searchParams: Promise<{ scan?: string; scanned?: string; high?: string; saved?: string }> }) {
  const params = await searchParams;
  const data = await loadRetentionDashboard();
  const actionable = data.cases.filter(({ retentionCase }) => retentionCase.status === "open" || retentionCase.status === "snoozed");
  const monitoring = data.cases.filter(({ retentionCase }) => retentionCase.status === "monitoring");
  const high = actionable.filter(({ retentionCase }) => retentionCase.risk_level === "high");

  return <div className="admin-page retention-page">
    <header className="admin-page-head">
      <div>
        <span className="admin-eyebrow">Student continuity</span>
        <h1>Retention & rebooking</h1>
        <p>Identify active tutoring engagements that need scheduling attention, have slowing cadence, repeated session disruption or are approaching the end of their current learning plan.</p>
      </div>
      <form action={runRetentionScan}><button className="admin-primary-button" type="submit">Run retention scan</button></form>
    </header>

    {params.scan === "1" && <div className="admin-notice success">Retention scan complete: {params.scanned || "0"} active engagements reviewed · {params.high || "0"} high-attention cases.</div>}
    {params.saved === "1" && <div className="admin-notice success">Retention settings saved.</div>}

    <section className="admin-stat-grid retention-stat-grid">
      <article><span>Active engagements</span><strong>{data.metrics.activeEngagements}</strong><small>Current tutoring relationships</small></article>
      <article><span>High attention</span><strong>{data.metrics.highAttention}</strong><small>Operational signals, not a churn probability</small></article>
      <article><span>No future session</span><strong>{data.metrics.noFutureSession}</strong><small>Active engagements without a planned lesson</small></article>
      <article><span>Open cases</span><strong>{data.metrics.openCases}</strong><small>Needs review or follow-up</small></article>
      <article><span>Teaching last 30d</span><strong>{hours(data.metrics.completedHours30)}</strong><small>Completed session time</small></article>
      <article><span>Booked next 7d</span><strong>{hours(data.metrics.plannedHours7)}</strong><small>{hours(data.metrics.plannedHours30)} across next 30 days</small></article>
    </section>

    <section className="admin-panel retention-principle">
      <div><span className="admin-eyebrow">Interpretation</span><h2>Attention score, not churn prediction</h2></div>
      <p>The score is built only from recorded operational signals: future bookings, recency of completed lessons, recent cancellation/no-show records, recent cadence, tutor assignment and learning-plan completion. It does not infer student motivation or assign blame for cancellations.</p>
    </section>

    <section className="admin-panel retention-settings-card">
      <div className="admin-card-header"><div><h2>Retention thresholds</h2><p>Used by the scheduled scan. The existing reminder cron checks this layer at the interval below.</p></div><small>Last scan: {formatRetentionDateTime(data.settings.last_scan_at)}</small></div>
      <form action={updateRetentionSettings} className="retention-settings-form">
        <label className="retention-toggle"><input type="checkbox" name="automationEnabled" defaultChecked={data.settings.automation_enabled} /><span>Scheduled scanning enabled</span></label>
        <label><span>Scan interval (hours)</span><input name="scanIntervalHours" type="number" min="1" max="168" defaultValue={data.settings.scan_interval_hours} /></label>
        <label><span>Inactivity attention (days)</span><input name="inactivityDays" type="number" min="7" max="180" defaultValue={data.settings.inactivity_days} /></label>
        <label><span>High-attention recency (days)</span><input name="highAttentionDays" type="number" min="14" max="365" defaultValue={data.settings.high_attention_days} /></label>
        <label><span>Disruption threshold</span><input name="disruptionThreshold" type="number" min="1" max="10" defaultValue={data.settings.disruption_threshold} /></label>
        <label><span>Plan-completion opportunity (%)</span><input name="planCompletionThreshold" type="number" min="50" max="100" defaultValue={data.settings.plan_completion_threshold} /></label>
        <label><span>End-date review window (days)</span><input name="endDateWindowDays" type="number" min="1" max="90" defaultValue={data.settings.end_date_window_days} /></label>
        <button className="admin-secondary-button" type="submit">Save thresholds</button>
      </form>
    </section>

    <section className="admin-card retention-cases-card">
      <div className="admin-card-header"><div><h2>Needs attention</h2><p>{high.length} high-attention · {actionable.length} open or snoozed cases</p></div></div>
      <div className="retention-case-list">
        {actionable.map(({ retentionCase: item, engagement, student, tutor, lead, studentLifetimeHours }) => <article className={`retention-case retention-${item.risk_level}`} key={item.id}>
          <div className="retention-case-head">
            <div><span className="admin-eyebrow">{engagement?.subject || "Tutoring"}</span><h3>{student?.name || "Student"}</h3><p>{engagement?.title || "Active engagement"}{tutor?.name ? ` · ${tutor.name}` : " · Tutor unassigned"}</p></div>
            <div className="retention-case-score"><strong>{item.attention_score}</strong><span>{retentionRiskLabels[item.risk_level]}</span></div>
          </div>
          <div className="retention-signal-grid">
            <div><span>Last completed</span><strong>{formatRetentionDateTime(item.last_session_at)}</strong><small>{item.days_since_last_session === null ? "No completed lesson" : `${item.days_since_last_session} days ago`}</small></div>
            <div><span>Next session</span><strong>{formatRetentionDateTime(item.next_session_at)}</strong><small>{item.next_session_at ? "Booked" : "No future lesson"}</small></div>
            <div><span>Plan mastery</span><strong>{item.plan_completion_percent === null ? "—" : `${item.plan_completion_percent}%`}</strong><small>{item.completed_sessions} completed sessions</small></div>
            <div><span>Student lifetime</span><strong>{studentLifetimeHours}h</strong><small>{item.engagement_hours}h in this engagement</small></div>
          </div>
          <ul className="retention-signals">{item.signals.map((signal) => <li key={signal}>{signal}</li>)}</ul>
          {item.tutor_capacity_flag && <p className="retention-capacity-warning">Tutor capacity: {item.tutor_capacity_flag}</p>}
          <div className="retention-next-step"><strong>Suggested next step</strong><p>{item.suggested_action || "Review the engagement."}</p></div>
          <div className="retention-case-meta"><span>Status: {retentionCaseStatusLabels[item.status]}</span><span>Source: {lead?.utm_source || lead?.source || "Direct / unknown"}</span>{item.last_outreach_at && <span>Last outreach: {formatRetentionDateTime(item.last_outreach_at)} · {item.last_outcome || "contacted"}</span>}</div>
          <div className="retention-actions-grid">
            <form action={updateRetentionCase} className="retention-case-form">
              <input type="hidden" name="caseId" value={item.id} />
              <label><span>Case status</span><select name="status" defaultValue={item.status}><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="snoozed">Snoozed</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label>
              <label><span>Snooze until</span><input name="snoozedUntil" type="date" defaultValue={item.snoozed_until || ""} /></label>
              <label className="retention-wide"><span>Admin note</span><textarea name="adminNote" defaultValue={item.admin_note || ""} placeholder="Scheduling context, reason to monitor, agreed next step…" /></label>
              <button className="admin-secondary-button" type="submit">Save case</button>
            </form>
            <form action={logRetentionOutreach} className="retention-outreach-form">
              <input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="engagementId" value={item.engagement_id} /><input type="hidden" name="studentId" value={item.student_id} /><input type="hidden" name="tutorId" value={item.tutor_id || ""} />
              <div><label><span>Outreach channel</span><select name="channel" defaultValue="email"><option value="email">Email</option><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="portal">Portal</option><option value="other">Other</option></select></label><label><span>Outcome</span><select name="outcome" defaultValue="contacted"><option value="contacted">Contacted</option><option value="rebooked">Rebooked</option><option value="no_response">No response</option><option value="paused">Paused</option><option value="completed">Completed current plan</option><option value="declined">Does not want to continue</option><option value="other">Other</option></select></label></div>
              <label><span>Outreach note</span><textarea name="note" placeholder="What was agreed? Do not paste unnecessary sensitive information." /></label>
              <button className="admin-primary-button" type="submit">Log outreach</button>
            </form>
          </div>
          <div className="retention-links"><Link href={`/admin/students/${item.student_id}`}>Student record →</Link><Link href="/admin/sessions">Session calendar →</Link>{item.engagement_id && <Link href={`/admin/progress/${item.engagement_id}`}>Progress →</Link>}</div>
        </article>)}
        {!actionable.length && <div className="admin-empty">No open retention cases. Run a scan after sessions or engagement statuses change.</div>}
      </div>
    </section>

    <section className="admin-card">
      <div className="admin-card-header"><div><h2>Tutor workload & continuity</h2><p>Forward bookings compared with recorded tutor capacity.</p></div></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tutor</th><th>Active students</th><th>High attention</th><th>No future session</th><th>Next 7d / capacity</th><th>Next 30d</th></tr></thead><tbody>{data.tutorWorkloads.map((row) => <tr key={row.tutorId}><td><strong>{row.tutorName}</strong></td><td>{row.activeStudents}</td><td>{row.highAttention}</td><td>{row.noFutureSession}</td><td><CapacityCell hours7={row.plannedHours7} capacity={row.weeklyCapacityHours} activeStudents={row.activeStudents} maxStudents={row.maxActiveStudents} /></td><td>{row.plannedHours30}h</td></tr>)}</tbody></table>{!data.tutorWorkloads.length && <div className="admin-empty">No active tutors.</div>}</div>
    </section>

    <div className="retention-breakdown-grid">
      {[{ title: "Retention by subject", rows: data.bySubject }, { title: "Retention by tutor", rows: data.byTutor }, { title: "Retention by acquisition source", rows: data.bySource }].map((section) => <section className="admin-card" key={section.title}>
        <div className="admin-card-header"><div><h2>{section.title}</h2><p>Retained means a completed lesson exists at or after the cohort milestone.</p></div></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Group</th><th>Engagements</th><th>30d retained</th><th>60d retained</th></tr></thead><tbody>{section.rows.slice(0, 12).map((row) => <tr key={row.key}><td><strong>{row.key}</strong></td><td>{row.engagements}</td><td>{pct(row.rate30)} <small>({row.retained30}/{row.eligible30})</small></td><td>{pct(row.rate60)} <small>({row.retained60}/{row.eligible60})</small></td></tr>)}</tbody></table></div>
      </section>)}
    </div>

    <section className="admin-card">
      <div className="admin-card-header"><div><h2>Active student lifetime tutoring</h2><p>Completed teaching hours across all recorded engagements for each active student.</p></div></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Student</th><th>Subjects</th><th>Lifetime hours</th><th>Highest attention</th><th>Future session</th><th></th></tr></thead><tbody>{data.activeStudents.slice(0, 50).map((row) => <tr key={row.studentId}><td><strong>{row.name}</strong><small>{row.academicLevel || ""}</small></td><td>{[...new Set(row.activeSubjects)].join(", ")}</td><td>{row.lifetimeHours}h</td><td>{row.highestAttention}</td><td>{row.hasFutureSession ? "Booked" : "None"}</td><td><Link className="admin-link-button" href={`/admin/students/${row.studentId}`}>Open →</Link></td></tr>)}</tbody></table></div>
    </section>

    <section className="admin-card retention-outreach-history">
      <div className="admin-card-header"><div><h2>Recent retention outreach</h2><p>Manual outreach logged by admin or tutors. The platform does not auto-send rebooking marketing.</p></div></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>When</th><th>Actor</th><th>Channel</th><th>Outcome</th><th>Note</th></tr></thead><tbody>{data.outreach.slice(0, 40).map((row) => <tr key={row.id}><td>{formatRetentionDateTime(row.created_at)}</td><td>{row.actor_kind}{row.actor_email ? <small>{row.actor_email}</small> : null}</td><td>{row.channel}</td><td>{row.outcome.replaceAll("_", " ")}</td><td>{row.note || "—"}</td></tr>)}</tbody></table>{!data.outreach.length && <div className="admin-empty">No retention outreach has been logged yet.</div>}</div>
    </section>

    {monitoring.length > 0 && <section className="admin-panel retention-monitoring-note"><strong>{monitoring.length} engagements are monitoring normally.</strong><span>They remain in the system for continuity metrics but are kept out of the attention queue.</span></section>}
  </div>;
}
