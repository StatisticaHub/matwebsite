import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  leadStatusLabels,
  leadStatuses,
  type LeadStatus,
} from "@/lib/admin-data";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

type AnalyticsLead = {
  id: string;
  created_at: string;
  status: LeadStatus;
  subject: string;
  level: string;
  support_type: string;
  source: string | null;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

type AnalyticsStudent = {
  id: string;
  created_at: string;
  status: "active" | "inactive" | "prospect";
  source_lead_id: string | null;
};

type AnalyticsSession = {
  id: string;
  status: "planned" | "completed" | "cancelled" | "no_show";
  scheduled_for: string | null;
  completed_at: string | null;
};

type RankedItem = {
  label: string;
  count: number;
};

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function daysAgo(days: number) {
  const date = startOfDay(new Date());
  date.setDate(date.getDate() - days);
  return date;
}

function formatPercent(numerator: number, denominator: number) {
  if (!denominator) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function compactPath(value: string | null) {
  if (!value) return "Direct / unknown";

  try {
    const parsed = new URL(value);
    return parsed.pathname || "/";
  } catch {
    const path = value.split("?")[0]?.trim();
    return path || "Direct / unknown";
  }
}

function sourceLabel(lead: AnalyticsLead) {
  const utmSource = lead.utm_source?.trim();
  if (utmSource) {
    const medium = lead.utm_medium?.trim();
    return medium ? `${utmSource} / ${medium}` : utmSource;
  }

  if (lead.referrer) {
    try {
      const host = new URL(lead.referrer).hostname.replace(/^www\./, "");
      if (host && !host.includes("myacademictutor.com")) return host;
    } catch {
      // Ignore malformed referrer values and fall through.
    }
  }

  const source = lead.source?.trim();
  if (source && source.toLowerCase() !== "website") return source;

  return "Direct / website";
}

function rankBy(
  leads: AnalyticsLead[],
  getter: (lead: AnalyticsLead) => string | null | undefined,
  limit = 8
): RankedItem[] {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const raw = getter(lead)?.trim();
    const label = raw || "Not provided";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function BarList({
  items,
  total,
  emptyText = "No data yet.",
}: {
  items: RankedItem[];
  total: number;
  emptyText?: string;
}) {
  if (!items.length) {
    return <div className="admin-analytics-empty">{emptyText}</div>;
  }

  const max = Math.max(...items.map((item) => item.count), 1);

  return (
    <div className="admin-bar-list">
      {items.map((item) => (
        <div className="admin-bar-row" key={item.label}>
          <div className="admin-bar-meta">
            <span title={item.label}>{item.label}</span>
            <strong>{item.count}</strong>
          </div>
          <div className="admin-bar-track" aria-hidden="true">
            <i style={{ width: `${Math.max(3, (item.count / max) * 100)}%` }} />
          </div>
          <small>{formatPercent(item.count, total)}</small>
        </div>
      ))}
    </div>
  );
}

function TrendBars({ leads }: { leads: AnalyticsLead[] }) {
  const today = startOfDay(new Date());
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (13 - index));
    return date;
  });

  const points = days.map((date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);

    const count = leads.filter((lead) => {
      const created = new Date(lead.created_at);
      return created >= date && created < next;
    }).length;

    return { date, count };
  });

  const max = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="admin-trend-chart" aria-label="Lead volume over the last 14 days">
      {points.map((point) => (
        <div className="admin-trend-column" key={point.date.toISOString()}>
          <div className="admin-trend-value">{point.count || ""}</div>
          <div className="admin-trend-track">
            <i
              style={{
                height: point.count ? `${Math.max(7, (point.count / max) * 100)}%` : "2px",
              }}
            />
          </div>
          <span>
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
            }).format(point.date)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AnalyticsPage() {
  const supabase = createAdminClient();
  const now = new Date();

  const [leadResult, studentResult, sessionResult] = await Promise.all([
    supabase
      .from("tutoring_leads")
      .select(
        "id,created_at,status,subject,level,support_type,source,landing_page,referrer,utm_source,utm_medium,utm_campaign"
      )
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("students")
      .select("id,created_at,status,source_lead_id")
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("tutoring_sessions")
      .select("id,status,scheduled_for,completed_at")
      .order("scheduled_for", { ascending: false })
      .limit(5000),
  ]);

  if (leadResult.error) throw new Error(leadResult.error.message);
  if (studentResult.error) throw new Error(studentResult.error.message);
  if (sessionResult.error) throw new Error(sessionResult.error.message);

  const leads = (leadResult.data || []) as AnalyticsLead[];
  const students = (studentResult.data || []) as AnalyticsStudent[];
  const sessions = (sessionResult.data || []) as AnalyticsSession[];

  const sevenDayStart = daysAgo(6);
  const thirtyDayStart = daysAgo(29);

  const leads7d = leads.filter((lead) => new Date(lead.created_at) >= sevenDayStart);
  const leads30d = leads.filter((lead) => new Date(lead.created_at) >= thirtyDayStart);

  const statusCounts = Object.fromEntries(
    leadStatuses.map((status) => [status, 0])
  ) as Record<LeadStatus, number>;

  for (const lead of leads) {
    if (lead.status in statusCounts) statusCounts[lead.status] += 1;
  }

  const studentLeadIds = new Set(
    students
      .map((student) => student.source_lead_id)
      .filter((id): id is string => Boolean(id))
  );

  const convertedLeads = leads.filter((lead) => studentLeadIds.has(lead.id)).length;
  const bookedOrOngoing = statusCounts.booked + statusCounts.ongoing;
  const assignedOrBeyond =
    statusCounts.tutor_assigned + statusCounts.booked + statusCounts.ongoing;

  const activeStudents = students.filter((student) => student.status === "active").length;
  const completedSessions = sessions.filter((session) => session.status === "completed").length;
  const upcomingSessions = sessions.filter(
    (session) =>
      session.status === "planned" &&
      session.scheduled_for &&
      new Date(session.scheduled_for) >= now
  ).length;

  const subjectRanking = rankBy(leads, (lead) => lead.subject);
  const levelRanking = rankBy(leads, (lead) => lead.level);
  const supportRanking = rankBy(leads, (lead) => lead.support_type);
  const sourceRanking = rankBy(leads, sourceLabel);
  const landingRanking = rankBy(leads, (lead) => compactPath(lead.landing_page), 10);
  const campaignRanking = rankBy(
    leads.filter((lead) => Boolean(lead.utm_campaign?.trim())),
    (lead) => lead.utm_campaign,
    6
  );

  const funnelMax = Math.max(
    ...leadStatuses.map((status) => statusCounts[status]),
    1
  );

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <span className="admin-eyebrow">Business intelligence</span>
          <h1>Analytics</h1>
          <p>
            Track tutoring demand, acquisition sources and movement from enquiry to active student using your CRM data.
          </p>
        </div>
        <Link className="admin-primary-button" href="/admin">
          Open lead inbox
        </Link>
      </header>

      <section className="admin-analytics-metrics">
        <article>
          <span>Total leads</span>
          <strong>{leads.length}</strong>
          <small>{leads30d.length} in the last 30 days</small>
        </article>
        <article>
          <span>Last 7 days</span>
          <strong>{leads7d.length}</strong>
          <small>New tutoring enquiries</small>
        </article>
        <article>
          <span>Tutor assigned+</span>
          <strong>{assignedOrBeyond}</strong>
          <small>{formatPercent(assignedOrBeyond, leads.length)} of all leads</small>
        </article>
        <article>
          <span>Booked / ongoing</span>
          <strong>{bookedOrOngoing}</strong>
          <small>{formatPercent(bookedOrOngoing, leads.length)} booking rate</small>
        </article>
        <article>
          <span>Lead → student</span>
          <strong>{formatPercent(convertedLeads, leads.length)}</strong>
          <small>{convertedLeads} leads have student records</small>
        </article>
        <article>
          <span>Active students</span>
          <strong>{activeStudents}</strong>
          <small>{students.length} student records total</small>
        </article>
        <article>
          <span>Upcoming sessions</span>
          <strong>{upcomingSessions}</strong>
          <small>Currently planned</small>
        </article>
        <article>
          <span>Completed sessions</span>
          <strong>{completedSessions}</strong>
          <small>Recorded in delivery</small>
        </article>
      </section>

      <section className="admin-analytics-layout">
        <article className="admin-panel admin-analytics-card admin-analytics-wide">
          <div className="admin-analytics-card-head">
            <div>
              <span>Lead trend</span>
              <h2>Last 14 days</h2>
            </div>
            <strong>{leads7d.length} leads in 7 days</strong>
          </div>
          <TrendBars leads={leads} />
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Pipeline</span>
              <h2>Current lead status</h2>
            </div>
          </div>
          <div className="admin-funnel-list">
            {leadStatuses.map((status) => (
              <div key={status}>
                <div>
                  <span>{leadStatusLabels[status]}</span>
                  <strong>{statusCounts[status]}</strong>
                </div>
                <div className="admin-funnel-track">
                  <i
                    className={`funnel-${status}`}
                    style={{
                      width: `${
                        statusCounts[status]
                          ? Math.max(4, (statusCounts[status] / funnelMax) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Demand</span>
              <h2>Top subjects</h2>
            </div>
          </div>
          <BarList items={subjectRanking} total={leads.length} />
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Audience</span>
              <h2>Academic levels</h2>
            </div>
          </div>
          <BarList items={levelRanking} total={leads.length} />
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Intent</span>
              <h2>Support types</h2>
            </div>
          </div>
          <BarList items={supportRanking} total={leads.length} />
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Acquisition</span>
              <h2>Lead sources</h2>
            </div>
          </div>
          <BarList items={sourceRanking} total={leads.length} />
        </article>

        <article className="admin-panel admin-analytics-card admin-analytics-wide">
          <div className="admin-analytics-card-head">
            <div>
              <span>Conversion entry points</span>
              <h2>Landing pages generating leads</h2>
            </div>
          </div>
          <BarList
            items={landingRanking}
            total={leads.length}
            emptyText="Landing-page attribution will appear as new leads arrive."
          />
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Campaigns</span>
              <h2>UTM campaigns</h2>
            </div>
          </div>
          <BarList
            items={campaignRanking}
            total={Math.max(
              1,
              leads.filter((lead) => Boolean(lead.utm_campaign?.trim())).length
            )}
            emptyText="No UTM campaign leads yet."
          />
        </article>

        <article className="admin-panel admin-analytics-card">
          <div className="admin-analytics-card-head">
            <div>
              <span>Next measurement layer</span>
              <h2>What this dashboard does not guess</h2>
            </div>
          </div>
          <div className="admin-analytics-note">
            <p>
              Revenue and margin are deliberately excluded from this first version. We should calculate them from completed sessions and actual charged/payout amounts, not from quoted rates.
            </p>
            <p>
              GA4 handles visitor → enquiry. This dashboard handles enquiry → student → tutoring delivery.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
