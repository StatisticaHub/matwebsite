import Link from "next/link";
import {
  loadBusinessIntelligence,
  type AttributionGroup,
  type AttributionRange,
  type CurrencyTotals,
} from "@/lib/business-intelligence";

export const metadata = { title: "Business Intelligence" };
export const dynamic = "force-dynamic";

function percent(numerator: number, denominator: number) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function hours(minutes: number) {
  return `${(minutes / 60).toFixed(minutes >= 600 ? 0 : 1)}h`;
}

function moneyTotals(totals: CurrencyTotals) {
  const entries = Object.entries(totals).filter(([, value]) => Math.abs(value) >= 0.005);
  if (!entries.length) return "—";
  return entries
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, value]) => {
      try {
        return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
      } catch {
        return `${currency} ${value.toFixed(0)}`;
      }
    })
    .join(" · ");
}

function AttributionTable({ title, eyebrow, rows }: { title: string; eyebrow: string; rows: AttributionGroup[] }) {
  return (
    <section className="admin-panel bi-card bi-wide">
      <div className="bi-card-head">
        <div><span>{eyebrow}</span><h2>{title}</h2></div>
        <small>Lead cohort outcomes</small>
      </div>
      {!rows.length ? (
        <div className="admin-empty">No attributed records in this period.</div>
      ) : (
        <div className="bi-table-wrap">
          <table className="bi-table">
            <thead>
              <tr>
                <th>Dimension</th><th>Leads</th><th>Trials</th><th>Students</th><th>Lead → student</th><th>Active</th><th>Sessions</th><th>Teaching</th><th>Recorded value</th><th>Gross contribution</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td><strong title={row.label}>{row.label}</strong></td>
                  <td>{row.leads}</td>
                  <td>{row.trials}</td>
                  <td>{row.students}</td>
                  <td>{percent(row.students, row.leads)}</td>
                  <td>{row.activeEngagements}</td>
                  <td>{row.completedSessions}</td>
                  <td>{hours(row.teachingMinutes)}</td>
                  <td>{moneyTotals(row.studentValue)}</td>
                  <td>{moneyTotals(row.grossContribution)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Funnel({ leads, trials, students, active }: { leads: number; trials: number; students: number; active: number }) {
  const points = [
    { label: "Leads", value: leads },
    { label: "Trial scheduled", value: trials },
    { label: "Converted student", value: students },
    { label: "Active engagement", value: active },
  ];
  const max = Math.max(leads, 1);
  return (
    <div className="bi-funnel">
      {points.map((point) => (
        <div key={point.label}>
          <div><span>{point.label}</span><strong>{point.value}</strong></div>
          <div className="bi-funnel-track"><i style={{ width: `${point.value ? Math.max(4, (point.value / max) * 100) : 0}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default async function BusinessIntelligencePage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const params = await searchParams;
  const requested = params.range;
  const range: AttributionRange = requested === "30" || requested === "all" ? requested : "90";
  const data = await loadBusinessIntelligence(range);
  const total = data.totals;
  const educationalTrials = data.trialCompleted;
  const convertedAfterTrial = data.facts.filter((fact) => fact.trialCompleted && fact.studentConverted).length;
  const bestSource = data.bySource.find((row) => row.leads >= 2 && row.students > 0) || data.bySource.find((row) => row.students > 0) || null;
  const bestLanding = data.byLandingPage.find((row) => row.students > 0) || null;
  const unattributed = total.leads - data.knownAcquisitionSources;

  return (
    <div className="admin-page bi-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Conversion attribution</span>
          <h1>Business intelligence</h1>
          <p>Follow each lead cohort from acquisition source and landing page through trial, student conversion, active tutoring and completed delivery.</p>
        </div>
        <div className="bi-head-actions">
          <a className="admin-secondary-button" href={`/api/admin/business-intelligence/export?range=${range}`}>Export CSV</a>
          <Link className="admin-primary-button" href="/admin/analytics">Lead analytics</Link>
        </div>
      </header>

      <nav className="bi-range-tabs" aria-label="Attribution period">
        {(["30", "90", "all"] as AttributionRange[]).map((value) => (
          <Link key={value} className={range === value ? "active" : ""} href={`/admin/business-intelligence?range=${value}`}>{value === "all" ? "All time" : `${value} days`}</Link>
        ))}
      </nav>

      <section className="bi-metrics">
        <article><span>Lead cohort</span><strong>{total.leads}</strong><small>{data.rangeLabel}</small></article>
        <article><span>Trials scheduled</span><strong>{total.trials}</strong><small>{percent(total.trials, total.leads)} of leads</small></article>
        <article><span>Lead → student</span><strong>{percent(total.students, total.leads)}</strong><small>{total.students} converted students</small></article>
        <article><span>Trial → student</span><strong>{percent(convertedAfterTrial, educationalTrials)}</strong><small>{convertedAfterTrial} of {educationalTrials} completed trials</small></article>
        <article><span>Active engagements</span><strong>{total.activeEngagements}</strong><small>{data.activeStudents} active student records</small></article>
        <article><span>Completed sessions</span><strong>{total.completedSessions}</strong><small>{hours(total.teachingMinutes)} teaching delivered</small></article>
        <article><span>Recorded teaching value</span><strong className="bi-money">{moneyTotals(total.studentValue)}</strong><small>Rates × completed-session duration</small></article>
        <article><span>Gross contribution</span><strong className="bi-money">{moneyTotals(total.grossContribution)}</strong><small>Recorded student rate − tutor rate</small></article>
      </section>

      <section className="bi-layout">
        <article className="admin-panel bi-card">
          <div className="bi-card-head"><div><span>Funnel</span><h2>Lead cohort progression</h2></div></div>
          <Funnel leads={total.leads} trials={total.trials} students={total.students} active={total.activeEngagements} />
        </article>

        <article className="admin-panel bi-card">
          <div className="bi-card-head"><div><span>Decision signals</span><h2>What deserves attention</h2></div></div>
          <div className="bi-insights">
            <p><strong>{percent(data.knownAcquisitionSources, total.leads)}</strong> of leads have a recognisable external acquisition source; {unattributed} are direct/website or otherwise unattributed.</p>
            <p><strong>{data.medianDaysToStudent === null ? "—" : `${data.medianDaysToStudent.toFixed(1)} days`}</strong> median time from enquiry to student record.</p>
            <p><strong>{data.lostLeads}</strong> leads in this cohort are currently marked lost.</p>
            {bestSource && <p><strong>{bestSource.label}</strong> is the strongest currently visible source by converted students ({bestSource.students}/{bestSource.leads}).</p>}
            {bestLanding && <p><strong>{bestLanding.label}</strong> is the strongest currently visible landing page by converted students ({bestLanding.students}/{bestLanding.leads}).</p>}
          </div>
        </article>
      </section>

      <AttributionTable eyebrow="Acquisition" title="Source → downstream outcomes" rows={data.bySource} />
      <AttributionTable eyebrow="Landing pages" title="Where converted students first submitted" rows={data.byLandingPage} />
      <AttributionTable eyebrow="Academic demand" title="Subjects → tutoring outcomes" rows={data.bySubject} />
      <AttributionTable eyebrow="Campaigns" title="UTM campaigns → tutoring outcomes" rows={data.byCampaign} />

      <section className="admin-panel bi-note bi-wide">
        <h2>How to read the money figures</h2>
        <p>These are operational estimates, not payment records. “Recorded teaching value” multiplies each completed session&apos;s stored student hourly rate by its duration. “Gross contribution” subtracts the recorded tutor hourly rate. Currencies are kept separate and are never converted or summed together.</p>
        <p>The attribution source is the source/referrer/UTM data stored when the tutoring request was submitted. It is therefore submission attribution, not a cross-device or multi-touch advertising model.</p>
      </section>
    </div>
  );
}
