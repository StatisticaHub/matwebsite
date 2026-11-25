import { createAdminClient } from "@/lib/supabase/admin";
import { ga4LifecycleConfigStatus } from "@/lib/analytics/ga4-lifecycle";
import {
  ga4ReportingConfigStatus,
  getGa4TutoringFunnel,
} from "@/lib/analytics/ga4-reporting";

export const metadata = { title: "GA4 lifecycle sync" };
export const dynamic = "force-dynamic";

type LogRow = {
  id: string;
  attempted_at: string;
  event_name: string;
  status: "sent" | "failed" | "skipped";
  source_action: string;
  response_status: number | null;
  error: string | null;
  client_id_present: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function Ga4LifecyclePage() {
  const supabase = createAdminClient();
  const config = ga4LifecycleConfigStatus();
  const reportingConfig = ga4ReportingConfigStatus();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalLeads,
    capturedLeads,
    recentLogsResult,
    logs30Result,
    tutoringFunnel,
  ] = await Promise.all([
    supabase.from("tutoring_leads").select("id", { count: "exact", head: true }),
    supabase.from("tutoring_leads").select("id", { count: "exact", head: true }).not("ga_client_id", "is", null),
    supabase.from("ga4_lifecycle_event_log").select("id,attempted_at,event_name,status,source_action,response_status,error,client_id_present").order("attempted_at", { ascending: false }).limit(100),
    supabase.from("ga4_lifecycle_event_log").select("status,event_name").gte("attempted_at", since),
    getGa4TutoringFunnel(30),
  ]);

  const logs = (recentLogsResult.data || []) as LogRow[];
  const logs30 = logs30Result.data || [];
  const sent = logs30.filter((row) => row.status === "sent").length;
  const failed = logs30.filter((row) => row.status === "failed").length;
  const skipped = logs30.filter((row) => row.status === "skipped").length;
  const total = totalLeads.count || 0;
  const captured = capturedLeads.count || 0;
  const captureRate = total ? Math.round((captured / total) * 100) : 0;

  const funnelStages = tutoringFunnel.stages;
  const funnelViews = funnelStages[0]?.users || 0;
  const successfulLeads =
    funnelStages.find(
      (stage) =>
        stage.eventName === "generate_lead"
    )?.users || 0;

  const overallFormConversion =
    funnelViews
      ? Math.round(
          (successfulLeads / funnelViews) *
            100,
        )
      : 0;

  return (
    <div className="admin-page ga4-sync-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Acquisition → CRM lifecycle</span>
          <h1>GA4 lifecycle sync</h1>
          <p>Monitor server-side lead-funnel events sent from the CRM to the same GA4 user identity captured when the enquiry was submitted.</p>
        </div>
      </header>

      <section className="ga4-sync-grid">
        <article className="admin-panel ga4-sync-card">
          <span>Measurement ID</span>
          <strong>{config.measurementId || "Not configured"}</strong>
          <small>Uses the existing public GA4 stream ID.</small>
        </article>
        <article className="admin-panel ga4-sync-card">
          <span>Measurement Protocol secret</span>
          <strong>{config.secretConfigured ? "Configured" : "Missing"}</strong>
          <small>The secret is never displayed in admin.</small>
        </article>
        <article className="admin-panel ga4-sync-card">
          <span>Leads with GA identity</span>
          <strong>{captured} / {total}</strong>
          <small>{captureRate}% capture coverage across stored leads.</small>
        </article>
        <article className="admin-panel ga4-sync-card">
          <span>Last 30 days</span>
          <strong>{sent} sent</strong>
          <small>{failed} failed · {skipped} skipped</small>
        </article>
      </section>

      <section className="admin-panel ga4-funnel-panel">
        <div className="admin-card-head ga4-funnel-head">
          <div>
            <span className="admin-eyebrow">
              Website conversion
            </span>

            <h2>
              Tutoring enquiry funnel
            </h2>

            <p>
              Unique GA4 users progressing through the tutoring
              request form during the last 30 days.
            </p>
          </div>

          {tutoringFunnel.configured &&
            !tutoringFunnel.error && (
              <div className="ga4-funnel-overall">
                <strong>
                  {overallFormConversion}%
                </strong>

                <span>
                  view → lead
                </span>
              </div>
            )}
        </div>

        {!tutoringFunnel.configured ? (
          <div className="ga4-reporting-state">
            <strong>
              GA4 reporting is not configured yet
            </strong>

            <p>
              Browser funnel events are being sent to GA4, but MAT
              needs read-only GA4 Data API credentials before it can
              display those counts here.
            </p>

            <div className="ga4-reporting-config">
              <span>
                <b>GA4_PROPERTY_ID</b>
                {reportingConfig.propertyConfigured
                  ? "Configured"
                  : "Missing"}
              </span>

              <span>
                <b>GA4_SERVICE_ACCOUNT_EMAIL</b>
                {reportingConfig.serviceAccountConfigured
                  ? "Configured"
                  : "Missing"}
              </span>

              <span>
                <b>GA4_SERVICE_ACCOUNT_PRIVATE_KEY</b>
                {reportingConfig.serviceAccountConfigured
                  ? "Configured"
                  : "Missing"}
              </span>
            </div>
          </div>
        ) : tutoringFunnel.error ? (
          <div className="ga4-reporting-state ga4-reporting-error">
            <strong>
              GA4 reporting could not be loaded
            </strong>

            <p>
              {tutoringFunnel.error}
            </p>
          </div>
        ) : (
          <>
            <div className="ga4-funnel-list">
              {funnelStages.map(
                (stage, index) => {
                  const previous =
                    index > 0
                      ? funnelStages[
                          index - 1
                        ]?.users || 0
                      : stage.users;

                  const stageRate =
                    index === 0
                      ? null
                      : previous
                        ? Math.round(
                            (stage.users /
                              previous) *
                              100,
                          )
                        : 0;

                  const width =
                    funnelViews
                      ? Math.min(
                          100,
                          Math.round(
                            (stage.users /
                              funnelViews) *
                              100,
                          ),
                        )
                      : 0;

                  return (
                    <article
                      key={
                        stage.eventName
                      }
                      className="ga4-funnel-stage"
                    >
                      <div className="ga4-funnel-stage-copy">
                        <div>
                          <strong>
                            {stage.label}
                          </strong>

                          <code>
                            {
                              stage.eventName
                            }
                          </code>
                        </div>

                        <div className="ga4-funnel-stage-number">
                          <strong>
                            {stage.users}
                          </strong>

                          <span>
                            {index === 0
                              ? "users"
                              : `${stageRate}% from previous`}
                          </span>
                        </div>
                      </div>

                      <div className="ga4-funnel-track">
                        <i
                          style={{
                            width:
                              `${width}%`,
                          }}
                        />
                      </div>

                      <small>
                        {stage.events} event
                        {stage.events === 1
                          ? ""
                          : "s"}
                      </small>
                    </article>
                  );
                },
              )}
            </div>

            <div className="ga4-funnel-error-summary">
              <div>
                <span>
                  Submit errors
                </span>

                <strong>
                  {
                    tutoringFunnel
                      .submitErrors.users
                  }
                </strong>

                <small>
                  {
                    tutoringFunnel
                      .submitErrors.events
                  }{" "}
                  error event
                  {tutoringFunnel
                    .submitErrors.events ===
                  1
                    ? ""
                    : "s"}
                </small>
              </div>

              <p>
                Submit errors are shown separately because they
                represent technical friction rather than a normal
                funnel stage.
              </p>
            </div>
          </>
        )}
      </section>

      <section className="admin-panel ga4-sync-explainer">
        <div>
          <span className="admin-eyebrow">Event mapping</span>
          <h2>What gets synchronised</h2>
        </div>
        <div className="ga4-sync-map">
          <div><strong>working_lead</strong><span>Real contact is logged or a lead is explicitly marked Contacted.</span></div>
          <div><strong>qualify_lead</strong><span>Matching begins, a tutor is assigned, or a trial is scheduled.</span></div>
          <div><strong>disqualify_lead</strong><span>An early lead is marked Lost before reaching the qualified funnel.</span></div>
          <div><strong>close_unconvert_lead</strong><span>A qualified/trial lead later does not proceed.</span></div>
          <div><strong>close_convert_lead</strong><span>The lead is converted into an actual student record and active engagement.</span></div>
        </div>
      </section>

      <section className="admin-panel ga4-sync-log">
        <div className="admin-card-head">
          <div><span className="admin-eyebrow">Audit</span><h2>Recent lifecycle events</h2></div>
          <small>Latest 100 attempts</small>
        </div>
        {!logs.length ? (
          <div className="admin-empty">No lifecycle events have been attempted yet. New enquiries will begin capturing GA identity after this upgrade is deployed.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table ga4-sync-table">
              <thead><tr><th>When</th><th>Event</th><th>Trigger</th><th>GA identity</th><th>Status</th><th>Detail</th></tr></thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.attempted_at)}</td>
                    <td><code>{row.event_name}</code></td>
                    <td>{row.source_action.replaceAll("_", " ")}</td>
                    <td>{row.client_id_present ? "Captured" : "Missing"}</td>
                    <td><span className={`ga4-sync-status ga4-${row.status}`}>{row.status}</span></td>
                    <td>{row.error || (row.response_status ? `HTTP ${row.response_status}` : "—")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
