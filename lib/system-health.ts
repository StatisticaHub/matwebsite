import { createAdminClient } from "@/lib/supabase/admin";

export type HealthStatus = "healthy" | "attention" | "failed";
export type HealthGroup = "Infrastructure" | "Automation" | "CRM & delivery" | "Growth & analytics";

export type SystemHealthCheck = {
  id: string;
  group: HealthGroup;
  title: string;
  status: HealthStatus;
  summary: string;
  detail?: string;
  count?: number;
  href?: string;
  hrefLabel?: string;
};

export type SystemHealthReport = {
  checkedAt: string;
  checks: SystemHealthCheck[];
  totals: { healthy: number; attention: number; failed: number };
  overall: HealthStatus;
};

type SupabaseResult<T> = { data: T | null; error: { message: string } | null; count?: number | null };

const DAY = 86_400_000;
const HOUR = 3_600_000;

function isoAgo(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

function failedCheck(id: string, group: HealthGroup, title: string, message: string, href?: string): SystemHealthCheck {
  return {
    id,
    group,
    title,
    status: "failed",
    summary: "Health check could not complete.",
    detail: message,
    href,
    hrefLabel: href ? "Open workspace" : undefined,
  };
}

function countCheck(args: {
  id: string;
  group: HealthGroup;
  title: string;
  count: number;
  healthySummary: string;
  issueSummary: string;
  detail?: string;
  href?: string;
  failure?: boolean;
}): SystemHealthCheck {
  return {
    id: args.id,
    group: args.group,
    title: args.title,
    status: args.count === 0 ? "healthy" : args.failure ? "failed" : "attention",
    count: args.count,
    summary: args.count === 0 ? args.healthySummary : args.issueSummary,
    detail: args.detail,
    href: args.href,
    hrefLabel: args.href ? "Review" : undefined,
  };
}

export async function loadSystemHealthReport(): Promise<SystemHealthReport> {
  const checks: SystemHealthCheck[] = [];
  let supabase;

  try {
    supabase = createAdminClient();
    const connectivity = await supabase.from("tutoring_leads").select("id", { count: "exact", head: true });
    if (connectivity.error) throw connectivity.error;
    checks.push({
      id: "database",
      group: "Infrastructure",
      title: "Supabase database",
      status: "healthy",
      summary: "Server-side database connection is working.",
      detail: `${connectivity.count ?? 0} tutoring lead records are currently stored.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Supabase connection error";
    checks.push(failedCheck("database", "Infrastructure", "Supabase database", message));
    return finalize(checks);
  }

  const envChecks: Array<[string, string, string | undefined]> = [
    ["supabase-secret", "Supabase server secret", process.env.SUPABASE_SECRET_KEY],
    ["resend-secret", "Resend email API", process.env.RESEND_API_KEY],
    ["cron-secret", "Vercel cron authentication", process.env.CRON_SECRET],
    ["ga4-stream", "GA4 measurement ID", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID],
    ["ga4-secret", "GA4 Measurement Protocol", process.env.GA4_MEASUREMENT_PROTOCOL_SECRET],
  ];

  for (const [id, title, value] of envChecks) {
    checks.push({
      id,
      group: "Infrastructure",
      title,
      status: value ? "healthy" : "failed",
      summary: value ? "Configured in the server environment." : "Required environment configuration is missing.",
      detail: value ? "Secret/value is present; the value itself is never displayed here." : "Add this variable in Vercel Production before relying on the related workflow.",
    });
  }

  const [
    notificationSettings,
    notificationFailures,
    nurtureSettings,
    nurtureFailures,
    ga4Failures,
    recentLeads,
    retentionSettings,
    overdueFollowups,
    staleLeads,
    activeStudents,
    activeEngagements,
    missingNotes,
    pastPlannedSessions,
    portalLinks,
    oldSupportRequests,
    expiredTestimonials,
    contentItems,
    latestPerformance,
    previousMonthReports,
  ] = await Promise.all([
    supabase.from("notification_settings").select("automation_enabled").eq("id", 1).maybeSingle(),
    supabase.from("notification_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", isoAgo(7 * DAY)),
    supabase.from("lead_nurture_settings").select("automation_enabled").eq("id", 1).maybeSingle(),
    supabase.from("lead_nurture_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("created_at", isoAgo(7 * DAY)),
    supabase.from("ga4_lifecycle_event_log").select("id", { count: "exact", head: true }).eq("status", "failed").gte("attempted_at", isoAgo(7 * DAY)),
    supabase.from("tutoring_leads").select("id,ga_client_id,created_at").gte("created_at", isoAgo(7 * DAY)),
    supabase.from("retention_settings").select("automation_enabled,last_scan_at,scan_interval_hours").eq("id", 1).maybeSingle(),
    supabase.from("tutoring_leads").select("id", { count: "exact", head: true }).not("status", "in", "(closed,lost)").lt("next_follow_up_at", new Date().toISOString()),
    supabase.from("tutoring_leads").select("id", { count: "exact", head: true }).in("status", ["new", "contacted", "matching", "tutor_assigned"]).lt("updated_at", isoAgo(3 * DAY)),
    supabase.from("students").select("id").eq("status", "active"),
    supabase.from("tutoring_engagements").select("id,student_id,tutor_id,status").eq("status", "active"),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }).eq("status", "completed").is("lesson_notes", null).lt("completed_at", isoAgo(3 * HOUR)),
    supabase.from("tutoring_sessions").select("id", { count: "exact", head: true }).eq("status", "planned").lt("scheduled_for", isoAgo(2 * HOUR)),
    supabase.from("student_portal_links").select("student_id,expires_at,revoked_at"),
    supabase.from("student_support_requests").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"]).lt("created_at", isoAgo(2 * DAY)),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("status", "requested").lt("request_expires_at", new Date().toISOString()),
    supabase.from("content_growth_items").select("id,stage,indexing_status,next_review_at"),
    supabase.from("content_performance_snapshots").select("period_end").order("period_end", { ascending: false }).limit(1).maybeSingle(),
    loadPreviousMonthReports(supabase),
  ]);

  pushQueryCheck(checks, notificationSettings as SupabaseResult<{ automation_enabled: boolean }>, "notification-settings", "Automation", "Reminder automation", (row) => ({
    status: row?.automation_enabled ? "healthy" : "attention",
    summary: row?.automation_enabled ? "Scheduled reminder automation is enabled." : "Scheduled reminder automation is switched off.",
    detail: row?.automation_enabled ? "The hourly cron can run service reminders when records are due." : "Manual runs still work, but scheduled service reminders will not run.",
    href: "/admin/notifications",
  }));

  pushCountResult(checks, notificationFailures, {
    id: "notification-failures",
    group: "Automation",
    title: "Reminder email failures",
    healthySummary: "No failed reminder emails in the last 7 days.",
    issueSummary: `${notificationFailures.count ?? 0} reminder email failure(s) need review.`,
    href: "/admin/notifications",
    failure: true,
  });

  pushQueryCheck(checks, nurtureSettings as SupabaseResult<{ automation_enabled: boolean }>, "nurture-settings", "Automation", "Lead nurture automation", (row) => ({
    status: row?.automation_enabled ? "healthy" : "attention",
    summary: row?.automation_enabled ? "Lead nurture automation is enabled." : "Lead nurture automation is switched off.",
    detail: row?.automation_enabled ? "Consent-aware nurture can run when eligible leads become due." : "No scheduled nurture messages will be sent while this remains off.",
    href: "/admin/nurture",
  }));

  pushCountResult(checks, nurtureFailures, {
    id: "nurture-failures",
    group: "Automation",
    title: "Nurture email failures",
    healthySummary: "No failed nurture emails in the last 7 days.",
    issueSummary: `${nurtureFailures.count ?? 0} nurture email failure(s) need review.`,
    href: "/admin/nurture",
    failure: true,
  });

  pushCountResult(checks, ga4Failures, {
    id: "ga4-failures",
    group: "Automation",
    title: "GA4 lifecycle delivery",
    healthySummary: "No failed GA4 lifecycle events in the last 7 days.",
    issueSummary: `${ga4Failures.count ?? 0} GA4 lifecycle event(s) failed in the last 7 days.`,
    href: "/admin/ga4-lifecycle",
    failure: true,
  });

  if (recentLeads.error) {
    checks.push(failedCheck("ga4-coverage", "Growth & analytics", "GA4 identity capture", recentLeads.error.message, "/admin/ga4-lifecycle"));
  } else {
    const rows = recentLeads.data ?? [];
    const captured = rows.filter((row) => Boolean(row.ga_client_id)).length;
    const coverage = rows.length ? Math.round((captured / rows.length) * 100) : 100;
    checks.push({
      id: "ga4-coverage",
      group: "Growth & analytics",
      title: "GA4 identity capture",
      status: rows.length > 0 && coverage < 80 ? "attention" : "healthy",
      count: rows.length - captured,
      summary: rows.length === 0 ? "No new leads in the last 7 days to assess." : `${captured} of ${rows.length} recent lead(s) captured a GA identity (${coverage}%).`,
      detail: rows.length > 0 && coverage < 80 ? "Leads without a GA client ID cannot be tied reliably to later CRM lifecycle events." : "Recent lead attribution capture looks healthy.",
      href: "/admin/ga4-lifecycle",
      hrefLabel: "Review",
    });
  }

  if (retentionSettings.error) {
    checks.push(failedCheck("cron-pulse", "Automation", "Scheduled cron pulse", retentionSettings.error.message, "/admin/retention"));
  } else {
    const row = retentionSettings.data;
    if (!row) {
      checks.push(failedCheck("cron-pulse", "Automation", "Scheduled cron pulse", "Retention settings row is missing.", "/admin/retention"));
    } else if (!row.automation_enabled) {
      checks.push({ id: "cron-pulse", group: "Automation", title: "Scheduled cron pulse", status: "attention", summary: "Retention scanning is disabled, so it cannot be used as a cron heartbeat.", href: "/admin/retention", hrefLabel: "Review" });
    } else if (!row.last_scan_at) {
      checks.push({ id: "cron-pulse", group: "Automation", title: "Scheduled cron pulse", status: "attention", summary: "No retention scan has been recorded yet.", detail: "Run a manual retention scan once, then the existing production cron should keep this heartbeat current.", href: "/admin/retention", hrefLabel: "Run scan" });
    } else {
      const ageHours = (Date.now() - new Date(row.last_scan_at).getTime()) / HOUR;
      const allowed = Math.max(Number(row.scan_interval_hours || 6) * 2.5, 12);
      checks.push({
        id: "cron-pulse",
        group: "Automation",
        title: "Scheduled cron pulse",
        status: ageHours > allowed ? "failed" : "healthy",
        summary: ageHours > allowed ? `The last retention scan was ${Math.round(ageHours)} hours ago.` : `Cron heartbeat seen ${Math.max(0, Math.round(ageHours))} hour(s) ago.`,
        detail: ageHours > allowed ? `Expected a scan within roughly ${Math.round(allowed)} hours. Check the Vercel cron and CRON_SECRET.` : "The shared reminder/nurture/retention cron appears to be running.",
        href: "/admin/retention",
        hrefLabel: "Review",
      });
    }
  }

  pushCountResult(checks, overdueFollowups, {
    id: "overdue-followups", group: "CRM & delivery", title: "Overdue lead follow-ups",
    healthySummary: "No lead follow-ups are overdue.", issueSummary: `${overdueFollowups.count ?? 0} lead follow-up(s) are overdue.`, href: "/admin/follow-ups",
  });
  pushCountResult(checks, staleLeads, {
    id: "stale-leads", group: "CRM & delivery", title: "Stale open leads",
    healthySummary: "No open leads have been untouched for more than 3 days.", issueSummary: `${staleLeads.count ?? 0} open lead(s) have not been updated for more than 3 days.`, href: "/admin",
  });

  if (activeStudents.error || activeEngagements.error) {
    checks.push(failedCheck("student-integrity", "CRM & delivery", "Student / engagement integrity", activeStudents.error?.message || activeEngagements.error?.message || "Unknown query error", "/admin/students"));
  } else {
    const studentIdsWithActiveEngagement = new Set((activeEngagements.data ?? []).map((row) => row.student_id));
    const orphanStudents = (activeStudents.data ?? []).filter((row) => !studentIdsWithActiveEngagement.has(row.id)).length;
    checks.push(countCheck({ id: "student-integrity", group: "CRM & delivery", title: "Active students without active engagement", count: orphanStudents, healthySummary: "Every active student has an active tutoring engagement.", issueSummary: `${orphanStudents} active student(s) have no active engagement.`, detail: "Confirm whether these students should be inactive, prospect, or attached to an engagement.", href: "/admin/students" }));

    const noTutor = (activeEngagements.data ?? []).filter((row) => !row.tutor_id).length;
    checks.push(countCheck({ id: "engagement-tutor", group: "CRM & delivery", title: "Active engagements without tutor", count: noTutor, healthySummary: "Every active engagement has a tutor assigned.", issueSummary: `${noTutor} active engagement(s) have no tutor assigned.`, href: "/admin/matching" }));

    if (portalLinks.error) {
      checks.push(failedCheck("portal-coverage", "CRM & delivery", "Student portal coverage", portalLinks.error.message, "/admin/portals"));
    } else {
      const now = Date.now();
      const validPortalStudents = new Set((portalLinks.data ?? []).filter((row) => !row.revoked_at && (!row.expires_at || new Date(row.expires_at).getTime() > now)).map((row) => row.student_id));
      const activeEngagementStudents = new Set((activeEngagements.data ?? []).map((row) => row.student_id));
      const missingPortals = [...activeEngagementStudents].filter((id) => !validPortalStudents.has(id)).length;
      checks.push(countCheck({ id: "portal-coverage", group: "CRM & delivery", title: "Active students without valid portal link", count: missingPortals, healthySummary: "Every active tutoring student has a valid portal link.", issueSummary: `${missingPortals} active student(s) do not have a valid portal link.`, detail: "This may be intentional for very new students; review before treating it as an error.", href: "/admin/portals" }));
    }
  }

  pushCountResult(checks, missingNotes, {
    id: "missing-notes", group: "CRM & delivery", title: "Completed sessions missing notes",
    healthySummary: "No completed sessions older than 3 hours are missing lesson notes.", issueSummary: `${missingNotes.count ?? 0} completed session(s) are missing lesson notes.`, href: "/admin/sessions",
  });
  pushCountResult(checks, pastPlannedSessions, {
    id: "past-planned", group: "CRM & delivery", title: "Past sessions still marked planned",
    healthySummary: "No past sessions are still marked planned.", issueSummary: `${pastPlannedSessions.count ?? 0} past session(s) are still marked planned.`, detail: "Mark them completed, cancelled or no-show so retention, progress and reporting remain accurate.", href: "/admin/sessions",
  });
  pushCountResult(checks, oldSupportRequests, {
    id: "support-requests", group: "CRM & delivery", title: "Aged student support requests",
    healthySummary: "No unresolved support request is older than 48 hours.", issueSummary: `${oldSupportRequests.count ?? 0} unresolved support request(s) are older than 48 hours.`, href: "/admin/portals",
  });
  pushCountResult(checks, expiredTestimonials, {
    id: "expired-testimonials", group: "CRM & delivery", title: "Expired testimonial requests",
    healthySummary: "No outstanding testimonial request has expired.", issueSummary: `${expiredTestimonials.count ?? 0} testimonial request(s) expired without submission.`, href: "/admin/testimonials",
  });

  if (previousMonthReports.error) {
    checks.push(failedCheck("progress-reporting", "CRM & delivery", "Monthly progress-report coverage", previousMonthReports.error, "/admin/progress"));
  } else {
    checks.push(countCheck({ id: "progress-reporting", group: "CRM & delivery", title: "Previous-month progress reports", count: previousMonthReports.missing, healthySummary: "Every eligible active engagement has a previous-month progress report.", issueSummary: `${previousMonthReports.missing} active engagement(s) are missing the previous-month report.`, detail: previousMonthReports.eligible === 0 ? "No engagement was eligible for a previous-month report." : `${previousMonthReports.eligible} engagement(s) were eligible.`, href: "/admin/progress" }));
  }

  if (contentItems.error) {
    checks.push(failedCheck("content-ops", "Growth & analytics", "Content growth operations", contentItems.error.message, "/admin/content-growth"));
  } else {
    const rows = contentItems.data ?? [];
    const today = new Date().toISOString().slice(0, 10);
    const indexingBacklog = rows.filter((row) => row.stage === "published" && ["unknown", "not_indexed"].includes(row.indexing_status)).length;
    const reviewBacklog = rows.filter((row) => row.next_review_at && row.next_review_at < today).length;
    const totalBacklog = indexingBacklog + reviewBacklog;
    checks.push(countCheck({ id: "content-ops", group: "Growth & analytics", title: "Content indexing / refresh backlog", count: totalBacklog, healthySummary: "No content indexing or refresh backlog is currently flagged.", issueSummary: `${totalBacklog} content item flag(s): ${indexingBacklog} indexing · ${reviewBacklog} refresh.`, href: "/admin/content-growth" }));
  }

  if (latestPerformance.error) {
    checks.push(failedCheck("gsc-freshness", "Growth & analytics", "Search Console snapshot freshness", latestPerformance.error.message, "/admin/content-growth"));
  } else if (!latestPerformance.data?.period_end) {
    checks.push({ id: "gsc-freshness", group: "Growth & analytics", title: "Search Console snapshot freshness", status: "attention", summary: "No Search Console performance snapshot has been imported yet.", detail: "Import a 28-day Pages export when you have enough Search Console data.", href: "/admin/content-growth", hrefLabel: "Import data" });
  } else {
    const daysOld = Math.floor((Date.now() - new Date(`${latestPerformance.data.period_end}T12:00:00Z`).getTime()) / DAY);
    checks.push({ id: "gsc-freshness", group: "Growth & analytics", title: "Search Console snapshot freshness", status: daysOld > 45 ? "attention" : "healthy", summary: daysOld > 45 ? `Latest imported Search Console period ended ${daysOld} days ago.` : `Latest Search Console snapshot is ${daysOld} day(s) old.`, detail: daysOld > 45 ? "Import a fresh page-performance export so opportunity flags are based on current data." : "Search-performance data is reasonably current.", href: "/admin/content-growth", hrefLabel: "Review" });
  }

  return finalize(checks);
}

function pushCountResult(
  checks: SystemHealthCheck[],
  result: { count: number | null; error: { message: string } | null },
  args: Omit<Parameters<typeof countCheck>[0], "count">,
) {
  if (result.error) {
    checks.push(failedCheck(args.id, args.group, args.title, result.error.message, args.href));
    return;
  }
  checks.push(countCheck({ ...args, count: result.count ?? 0 }));
}

function pushQueryCheck<T>(
  checks: SystemHealthCheck[],
  result: SupabaseResult<T>,
  id: string,
  group: HealthGroup,
  title: string,
  mapper: (row: T | null) => Pick<SystemHealthCheck, "status" | "summary" | "detail" | "href">,
) {
  if (result.error) {
    checks.push(failedCheck(id, group, title, result.error.message));
    return;
  }
  const mapped = mapper(result.data);
  checks.push({ id, group, title, ...mapped, hrefLabel: mapped.href ? "Review" : undefined });
}

async function loadPreviousMonthReports(supabase: ReturnType<typeof createAdminClient>): Promise<{ eligible: number; missing: number; error: string | null }> {
  try {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const previousMonthEnd = new Date(currentMonthStart.getTime() - DAY);
    const startDate = previousMonthStart.toISOString().slice(0, 10);
    const endDate = previousMonthEnd.toISOString().slice(0, 10);

    const [{ data: engagements, error: engagementError }, { data: reports, error: reportError }] = await Promise.all([
      supabase.from("tutoring_engagements").select("id,start_date,status").eq("status", "active").lte("start_date", endDate),
      supabase.from("progress_reports").select("engagement_id").gte("period_start", startDate).lte("period_end", endDate),
    ]);
    if (engagementError) return { eligible: 0, missing: 0, error: engagementError.message };
    if (reportError) return { eligible: 0, missing: 0, error: reportError.message };
    const reported = new Set((reports ?? []).map((row) => row.engagement_id));
    const eligible = engagements ?? [];
    return { eligible: eligible.length, missing: eligible.filter((row) => !reported.has(row.id)).length, error: null };
  } catch (error) {
    return { eligible: 0, missing: 0, error: error instanceof Error ? error.message : "Unknown progress-report query error" };
  }
}

function finalize(checks: SystemHealthCheck[]): SystemHealthReport {
  const totals = checks.reduce((acc, check) => {
    acc[check.status] += 1;
    return acc;
  }, { healthy: 0, attention: 0, failed: 0 });
  return {
    checkedAt: new Date().toISOString(),
    checks,
    totals,
    overall: totals.failed > 0 ? "failed" : totals.attention > 0 ? "attention" : "healthy",
  };
}
