import Link from "next/link";
import { loadSystemHealthReport, type HealthGroup, type HealthStatus } from "@/lib/system-health";

export const metadata = { title: "System Health" };
export const dynamic = "force-dynamic";

const groupOrder: HealthGroup[] = ["Infrastructure", "Automation", "CRM & delivery", "Finance integrity", "Growth & analytics"];
const statusLabels: Record<HealthStatus, string> = {
  healthy: "Healthy",
  attention: "Needs attention",
  failed: "Failed",
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export default async function SystemHealthPage() {
  const report = await loadSystemHealthReport();

  const actionChecks = report.checks
    .filter((check) => check.status !== "healthy")
    .sort((a, b) => {
      const weight: Record<HealthStatus, number> = {
        failed: 0,
        attention: 1,
        healthy: 2,
      };

      return weight[a.status] - weight[b.status];
    })
    .slice(0, 8);

  return (
    <div className="admin-page system-health-page">
      <header className="admin-page-head system-health-head">
        <div>
          <span className="admin-eyebrow">Operational QA</span>
          <h1>System health</h1>
          <p>One place to spot configuration failures, automation problems, stale operational records and data-quality issues across the tutoring platform.</p>
        </div>
        <Link className="admin-primary-button" href="/admin/system-health">Run health check</Link>
      </header>

      <section className={`system-health-overall ${report.overall}`}>
        <div>
          <span className="system-health-dot" aria-hidden="true" />
          <div>
            <span>Overall status</span>
            <strong>{statusLabels[report.overall]}</strong>
          </div>
        </div>
        <p>{report.totals.healthy} healthy · {report.totals.attention} need attention · {report.totals.failed} failed</p>
        <small>Checked {dateTime(report.checkedAt)}</small>
      </section>

      <section className="system-health-summary-grid">
        <article className="healthy"><span>Healthy</span><strong>{report.totals.healthy}</strong><small>Checks currently clear</small></article>
        <article className="attention"><span>Needs attention</span><strong>{report.totals.attention}</strong><small>Operational review recommended</small></article>
        <article className="failed"><span>Failed</span><strong>{report.totals.failed}</strong><small>Configuration or delivery failure</small></article>
      </section>

      {actionChecks.length > 0 ? (
        <section className="admin-panel system-health-group">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Action required now</span>
              <h2>What needs attention</h2>
            </div>
            <span className="admin-status">
              {actionChecks.length} priority item{actionChecks.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="system-health-check-list">
            {actionChecks.map((check) => (
              <article
                className={`system-health-check ${check.status}`}
                key={`priority-${check.id}`}
              >
                <div className="system-health-check-status">
                  <span className="system-health-dot" aria-hidden="true" />
                  <strong>{statusLabels[check.status]}</strong>
                </div>

                <div className="system-health-check-copy">
                  <div className="system-health-check-title">
                    <h3>{check.title}</h3>
                    {typeof check.count === "number" ? (
                      <span className="system-health-count">
                        {check.count}
                      </span>
                    ) : null}
                  </div>

                  <p>{check.summary}</p>

                  {check.detail ? (
                    <small>{check.detail}</small>
                  ) : null}
                </div>

                {check.href ? (
                  <Link
                    className="admin-secondary-button system-health-link"
                    href={check.href}
                  >
                    {check.hrefLabel || "Review"}
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="admin-panel system-health-principle">
          <div>
            <span className="admin-eyebrow">Operations</span>
            <h2>No action required</h2>
          </div>
          <p>
            All monitored operational checks are currently healthy.
          </p>
        </section>
      )}

      <section className="admin-panel system-health-principle">
        <div><span className="admin-eyebrow">How to read this</span><h2>Failures are different from queues</h2></div>
        <p><strong>Failed</strong> means a technical dependency, query or outbound delivery has failed. <strong>Needs attention</strong> means the system is working but an operational record needs human review. Normal queues are not treated as outages.</p>
      </section>

      {groupOrder.map((group) => {
        const checks = report.checks.filter((check) => check.group === group);
        if (!checks.length) return null;
        return (
          <section className="admin-panel system-health-group" key={group}>
            <div className="admin-card-header">
              <div><span className="admin-eyebrow">{group}</span><h2>{group}</h2></div>
              <span className="admin-status">{checks.length} checks</span>
            </div>
            <div className="system-health-check-list">
              {checks.map((check) => (
                <article className={`system-health-check ${check.status}`} key={check.id}>
                  <div className="system-health-check-status">
                    <span className="system-health-dot" aria-hidden="true" />
                    <strong>{statusLabels[check.status]}</strong>
                  </div>
                  <div className="system-health-check-copy">
                    <div className="system-health-check-title">
                      <h3>{check.title}</h3>
                      {typeof check.count === "number" ? <span className="system-health-count">{check.count}</span> : null}
                    </div>
                    <p>{check.summary}</p>
                    {check.detail ? <small>{check.detail}</small> : null}
                  </div>
                  {check.href ? <Link className="admin-secondary-button system-health-link" href={check.href}>{check.hrefLabel || "Review"}</Link> : null}
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="admin-panel system-health-runbook">
        <div><span className="admin-eyebrow">Runbook</span><h2>Suggested response order</h2></div>
        <ol>
          <li><strong>Fix Failed checks first.</strong> They indicate broken configuration, delivery or database access.</li>
          <li><strong>Then clear time-sensitive queues.</strong> Overdue follow-ups, aged support requests and past sessions affect the student experience.</li>
          <li><strong>Then repair data quality.</strong> Missing tutor assignments, notes and portal links make reporting and automation less reliable.</li>
          <li><strong>Review growth data last.</strong> Indexing and Search Console freshness matter, but they should not take priority over active students.</li>
        </ol>
      </section>
    </div>
  );
}
