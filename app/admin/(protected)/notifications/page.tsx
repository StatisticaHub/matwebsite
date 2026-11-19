import { createAdminClient } from "@/lib/supabase/admin";
import { runNotificationsNow, updateNotificationSettings } from "@/app/admin/notification-actions";

export const dynamic = "force-dynamic";

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

const labels: Record<string, string> = {
  session_24h: "Session · 24h",
  session_same_day: "Session · starting soon",
  trial_24h_student: "Trial · student",
  trial_24h_tutor: "Trial · tutor",
  homework_overdue: "Homework overdue",
  tutor_missing_notes: "Tutor notes missing",
  admin_overdue_followups: "Overdue follow-ups",
  monthly_progress_due: "Monthly progress due",
};

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = createAdminClient();
  const [{ data: settings, error: settingsError }, { data: logs, error: logsError }] = await Promise.all([
    supabase.from("notification_settings").select("*").eq("id", 1).single(),
    supabase.from("notification_log").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  if (settingsError) {
    return <div className="admin-page"><h1>Notifications</h1><div className="admin-alert error">Notification tables are not ready: {settingsError.message}</div></div>;
  }

  const sent7 = (logs || []).filter((x) => x.status === "sent" && new Date(x.created_at).getTime() >= Date.now() - 7 * 86400000).length;
  const failed7 = (logs || []).filter((x) => x.status === "failed" && new Date(x.created_at).getTime() >= Date.now() - 7 * 86400000).length;
  const lastSent = (logs || []).find((x) => x.status === "sent");

  return (
    <div className="admin-page notification-admin-page">
      <div className="admin-page-head">
        <div><span className="admin-eyebrow">Operations automation</span><h1>Notifications & reminders</h1><p>Control automated service emails and review exactly what the system has sent.</p></div>
        <form action={runNotificationsNow}><button className="admin-primary-button" type="submit">Run reminders now</button></form>
      </div>

      {params.saved ? <div className="admin-alert success">Notification settings saved.</div> : null}
      {params.run ? <div className="admin-alert success">Manual run finished — sent {String(params.sent || 0)}, failed {String(params.failed || 0)}, skipped {String(params.skipped || 0)}.</div> : null}
      {params.error ? <div className="admin-alert error">{String(params.error)}</div> : null}
      {logsError ? <div className="admin-alert error">Could not load notification history: {logsError.message}</div> : null}

      <section className="notification-summary-grid">
        <article className="notification-stat"><span>Automation</span><strong>{settings.automation_enabled ? "On" : "Off"}</strong><small>Hourly production check</small></article>
        <article className="notification-stat"><span>Sent · 7 days</span><strong>{sent7}</strong><small>Successful automated emails</small></article>
        <article className="notification-stat"><span>Failed · 7 days</span><strong>{failed7}</strong><small>Review any failures below</small></article>
        <article className="notification-stat"><span>Last sent</span><strong>{lastSent ? dateTime(lastSent.created_at) : "—"}</strong><small>{lastSent ? labels[lastSent.notification_type] || lastSent.notification_type : "No notifications yet"}</small></article>
      </section>

      <section className="admin-panel admin-detail-card notification-settings-card">
        <div><span className="admin-eyebrow">Controls</span><h2>Reminder rules</h2><p className="admin-muted">The engine is intentionally conservative. Every reminder has a unique deduplication key, so repeated cron runs do not repeatedly email the same event.</p></div>
        <form action={updateNotificationSettings} className="notification-settings-form">
          <label className="notification-toggle"><input type="checkbox" name="automation_enabled" defaultChecked={settings.automation_enabled} /><span><strong>Enable scheduled automation</strong><small>Master switch for Vercel Cron. Manual runs still work when this is off.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="session_24h_enabled" defaultChecked={settings.session_24h_enabled} /><span><strong>Session reminder ~24 hours before</strong><small>Sent once to active students.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="session_same_day_enabled" defaultChecked={settings.session_same_day_enabled} /><span><strong>Session starting-soon reminder</strong><small>Sent roughly 1–3 hours before the session.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="trial_24h_enabled" defaultChecked={settings.trial_24h_enabled} /><span><strong>Trial reminder ~24 hours before</strong><small>Sent to the student and assigned tutor.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="overdue_homework_enabled" defaultChecked={settings.overdue_homework_enabled} /><span><strong>Overdue homework reminder</strong><small>One reminder per overdue homework item — no daily nagging.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="tutor_missing_notes_enabled" defaultChecked={settings.tutor_missing_notes_enabled} /><span><strong>Missing tutor notes</strong><small>Reminds the tutor once when a completed session has no lesson notes after 3 hours.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="overdue_followups_enabled" defaultChecked={settings.overdue_followups_enabled} /><span><strong>Admin overdue-follow-up digest</strong><small>One daily digest to the MAT lead email when follow-ups are overdue.</small></span></label>
          <label className="notification-toggle"><input type="checkbox" name="monthly_progress_enabled" defaultChecked={settings.monthly_progress_enabled} /><span><strong>Monthly progress-report reminder</strong><small>From the 2nd of each month, reminds the assigned tutor once if last month’s report is missing.</small></span></label>
          <button className="admin-primary-button" type="submit">Save notification settings</button>
        </form>
      </section>

      <section className="admin-panel admin-detail-card">
        <div className="admin-card-head"><div><span className="admin-eyebrow">Audit trail</span><h2>Notification history</h2></div><span className="admin-status">Latest 100</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table notification-table">
            <thead><tr><th>When</th><th>Type</th><th>Recipient</th><th>Status</th><th>Subject</th><th>Trigger</th></tr></thead>
            <tbody>
              {(logs || []).length ? (logs || []).map((log) => (
                <tr key={log.id}>
                  <td>{dateTime(log.created_at)}</td>
                  <td>{labels[log.notification_type] || log.notification_type}</td>
                  <td><strong>{log.recipient_kind}</strong><br/><span className="admin-muted">{log.recipient_email}</span></td>
                  <td><span className={`notification-status ${log.status}`}>{log.status}</span>{log.error ? <small className="notification-error">{log.error}</small> : null}</td>
                  <td>{log.subject}</td>
                  <td>{log.trigger_source}</td>
                </tr>
              )) : <tr><td colSpan={6}>No automated notifications have been recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
