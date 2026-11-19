import { createAdminClient } from "@/lib/supabase/admin";
import { runNurtureNow, toggleLeadNurture, updateNurtureSettings } from "@/app/admin/nurture-actions";

export const dynamic = "force-dynamic";

function dateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

const labels: Record<string, string> = {
  service_checkin_day1: "Service check-in · day 1",
  education_day3: "Educational resource · day 3",
  education_day7: "Study preparation · day 7",
  final_checkin_day14: "Final check-in · day 14",
};

export default async function NurturePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const [{ data: settings, error: settingsError }, { data: logs, error: logsError }, { data: leads, error: leadsError }] = await Promise.all([
    supabase.from("lead_nurture_settings").select("*").eq("id", 1).single(),
    supabase.from("lead_nurture_log").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("tutoring_leads").select("id,reference,name,email,subject,status,nurture_started_at,nurture_paused,marketing_email_consent,marketing_email_unsubscribed_at").not("nurture_started_at", "is", null).order("created_at", { ascending: false }).limit(100),
  ]);

  if (settingsError) {
    return <div className="admin-page"><h1>Lead nurture</h1><div className="admin-alert error">Nurture tables are not ready: {settingsError.message}</div></div>;
  }

  const now = Date.now();
  const sent7 = (logs || []).filter((x) => x.status === "sent" && new Date(x.created_at).getTime() >= now - 7 * 86400000).length;
  const failed7 = (logs || []).filter((x) => x.status === "failed" && new Date(x.created_at).getTime() >= now - 7 * 86400000).length;
  const optedIn = (leads || []).filter((x) => x.marketing_email_consent && !x.marketing_email_unsubscribed_at).length;
  const active = (leads || []).filter((x) => !x.nurture_paused && !["closed", "lost", "booked", "ongoing"].includes(x.status)).length;

  return (
    <div className="admin-page nurture-admin-page">
      <div className="admin-page-head">
        <div><span className="admin-eyebrow">Lead conversion</span><h1>Lead nurture</h1><p>Follow up on real tutoring enquiries while keeping educational marketing opt-in separate and auditable.</p></div>
        <form action={runNurtureNow}><button className="admin-primary-button" type="submit">Run due nurture now</button></form>
      </div>

      {params.saved ? <div className="admin-alert success">Nurture settings saved.</div> : null}
      {params.lead_saved ? <div className="admin-alert success">Lead nurture preference updated.</div> : null}
      {params.run ? <div className="admin-alert success">Manual run finished — sent {String(params.sent || 0)}, failed {String(params.failed || 0)}, skipped {String(params.skipped || 0)} across {String(params.checked || 0)} eligible records checked.</div> : null}
      {params.error ? <div className="admin-alert error">{String(params.error)}</div> : null}
      {logsError ? <div className="admin-alert error">Could not load nurture history: {logsError.message}</div> : null}
      {leadsError ? <div className="admin-alert error">Could not load nurture leads: {leadsError.message}</div> : null}

      <section className="notification-summary-grid">
        <article className="notification-stat"><span>Automation</span><strong>{settings.automation_enabled ? "On" : "Off"}</strong><small>Runs with the existing reminder cron</small></article>
        <article className="notification-stat"><span>Active nurture</span><strong>{active}</strong><small>Future website enquiries only</small></article>
        <article className="notification-stat"><span>Educational opt-in</span><strong>{optedIn}</strong><small>Explicit marketing-email consent</small></article>
        <article className="notification-stat"><span>Sent · 7 days</span><strong>{sent7}</strong><small>{failed7 ? `${failed7} failed` : "No recent failures"}</small></article>
      </section>

      <section className="admin-panel admin-detail-card notification-settings-card">
        <div><span className="admin-eyebrow">Sequence controls</span><h2>Follow-up rules</h2><p className="admin-muted">Day 1 is a direct service check-in on the tutoring request. Day 3/7/14 emails require the separate educational-email opt-in.</p></div>
        <form action={updateNurtureSettings} className="notification-settings-form">
          <label className="notification-toggle"><input type="checkbox" name="automation_enabled" defaultChecked={settings.automation_enabled} /><span><strong>Enable scheduled nurture</strong><small>Master switch. Manual runs still work when disabled.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="service_checkin_enabled" defaultChecked={settings.service_checkin_enabled} /><span><strong>Day 1 service check-in</strong><small>One practical follow-up about the tutoring request itself.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="educational_day3_enabled" defaultChecked={settings.educational_day3_enabled} /><span><strong>Day 3 educational resource</strong><small>Opt-in only; links to the relevant Learning Hub topic.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="educational_day7_enabled" defaultChecked={settings.educational_day7_enabled} /><span><strong>Day 7 preparation email</strong><small>Opt-in only; explains how to prepare for useful tutoring.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="final_day14_enabled" defaultChecked={settings.final_day14_enabled} /><span><strong>Day 14 final check-in</strong><small>Opt-in only; closes the automated sequence rather than nagging indefinitely.</small></span></label>
          <button className="admin-primary-button" type="submit">Save nurture settings</button>
        </form>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Current audience</span><h2>Nurture leads</h2></div><span className="admin-status">Latest 100</span></div>
        <div className="admin-table-wrap"><table className="admin-table nurture-table"><thead><tr><th>Lead</th><th>Subject</th><th>Status</th><th>Educational email</th><th>Started</th><th>Automation</th></tr></thead><tbody>
          {(leads || []).length ? (leads || []).map((lead) => (
            <tr key={lead.id}>
              <td><strong>{lead.name}</strong><br/><span className="admin-muted">{lead.reference} · {lead.email}</span></td>
              <td>{lead.subject}</td>
              <td>{lead.status}</td>
              <td>{lead.marketing_email_consent && !lead.marketing_email_unsubscribed_at ? <span className="notification-status sent">opted in</span> : lead.marketing_email_unsubscribed_at ? <span className="notification-status skipped">unsubscribed</span> : <span className="admin-muted">not opted in</span>}</td>
              <td>{dateTime(lead.nurture_started_at)}</td>
              <td><form action={toggleLeadNurture}><input type="hidden" name="lead_id" value={lead.id}/><input type="hidden" name="paused" value={lead.nurture_paused ? "false" : "true"}/><button className="admin-link-button" type="submit">{lead.nurture_paused ? "Resume" : "Pause"}</button></form></td>
            </tr>
          )) : <tr><td colSpan={6}>No leads have entered the new nurture workflow yet. Existing leads are intentionally not auto-enrolled.</td></tr>}
        </tbody></table></div>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Audit trail</span><h2>Nurture history</h2></div><span className="admin-status">Latest 100</span></div>
        <div className="admin-table-wrap"><table className="admin-table nurture-table"><thead><tr><th>When</th><th>Sequence</th><th>Recipient</th><th>Status</th><th>Subject</th><th>Trigger</th></tr></thead><tbody>
          {(logs || []).length ? (logs || []).map((log) => (
            <tr key={log.id}><td>{dateTime(log.created_at)}</td><td>{labels[log.sequence_key] || log.sequence_key}</td><td>{log.recipient_email}</td><td><span className={`notification-status ${log.status}`}>{log.status}</span>{log.error ? <small className="notification-error">{log.error}</small> : null}</td><td>{log.subject}</td><td>{log.trigger_source}</td></tr>
          )) : <tr><td colSpan={6}>No nurture emails have been recorded yet.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  );
}
