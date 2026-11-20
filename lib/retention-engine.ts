import { createAdminClient } from "@/lib/supabase/admin";
import type { RetentionCaseStatus, RetentionRiskLevel, RetentionSettings } from "@/lib/retention";

export type RetentionRunSummary = {
  trigger: "cron" | "manual";
  scanned: number;
  opened: number;
  monitoring: number;
  resolved: number;
  highAttention: number;
  skipped: boolean;
  reason?: string;
};

type EngagementRow = {
  id: string;
  created_at: string;
  student_id: string;
  source_lead_id: string | null;
  tutor_id: string | null;
  subject: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  frequency: string | null;
  session_duration_minutes: number;
};

type SessionRow = {
  id: string;
  engagement_id: string;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  status: "planned" | "completed" | "cancelled" | "no_show";
};

type PlanRow = {
  engagement_id: string;
  progress_status: "needs_work" | "developing" | "comfortable" | "mastered";
  mastery_percent: number | null;
};

type TutorRow = {
  id: string;
  weekly_capacity_hours: number | null;
  max_active_students: number | null;
};

const DAY_MS = 86_400_000;

function diffDays(later: Date, earlier: Date) {
  return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
}

function dateOnly(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function masteryFor(item: PlanRow) {
  if (item.mastery_percent !== null) return item.mastery_percent;
  if (item.progress_status === "mastered") return 100;
  if (item.progress_status === "comfortable") return 75;
  if (item.progress_status === "developing") return 50;
  return 25;
}

function groupBy<T, K extends string>(rows: T[], key: (row: T) => K) {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const value = key(row);
    const list = map.get(value) || [];
    list.push(row);
    map.set(value, list);
  }
  return map;
}

async function getSettings(): Promise<RetentionSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("retention_settings").select("*").eq("id", 1).single();
  if (error || !data) throw new Error(error?.message || "Retention settings are missing. Run the retention SQL layer first.");
  return data as RetentionSettings;
}

function capacityFlag(tutor: TutorRow | undefined, activeStudents: number, plannedMinutesNext7: number) {
  if (!tutor) return null;
  const flags: string[] = [];
  const plannedHours = plannedMinutesNext7 / 60;
  if (tutor.weekly_capacity_hours !== null && tutor.weekly_capacity_hours > 0 && plannedHours > tutor.weekly_capacity_hours) {
    flags.push(`Next 7 days exceed recorded weekly capacity (${plannedHours.toFixed(1)}h / ${tutor.weekly_capacity_hours}h)`);
  }
  if (tutor.max_active_students !== null && tutor.max_active_students > 0 && activeStudents > tutor.max_active_students) {
    flags.push(`Active student load exceeds recorded maximum (${activeStudents} / ${tutor.max_active_students})`);
  }
  return flags.length ? flags.join(" · ") : null;
}

export async function runRetentionEngine(trigger: "cron" | "manual" = "manual"): Promise<RetentionRunSummary> {
  const supabase = createAdminClient();
  const settings = await getSettings();
  const now = new Date();

  if (trigger === "cron" && !settings.automation_enabled) {
    return { trigger, scanned: 0, opened: 0, monitoring: 0, resolved: 0, highAttention: 0, skipped: true, reason: "automation disabled" };
  }

  if (trigger === "cron" && settings.last_scan_at) {
    const elapsedHours = (now.getTime() - new Date(settings.last_scan_at).getTime()) / 3_600_000;
    if (elapsedHours < settings.scan_interval_hours) {
      return { trigger, scanned: 0, opened: 0, monitoring: 0, resolved: 0, highAttention: 0, skipped: true, reason: "scan interval not reached" };
    }
  }

  const { data: engagementData, error: engagementError } = await supabase
    .from("tutoring_engagements")
    .select("id,created_at,student_id,source_lead_id,tutor_id,subject,title,start_date,end_date,status,frequency,session_duration_minutes")
    .eq("status", "active")
    .limit(2000);
  if (engagementError) throw new Error(engagementError.message);
  const engagements = (engagementData || []) as EngagementRow[];

  if (!engagements.length) {
    await supabase.from("retention_settings").update({ last_scan_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", 1);
    return { trigger, scanned: 0, opened: 0, monitoring: 0, resolved: 0, highAttention: 0, skipped: false };
  }

  const engagementIds = engagements.map((row) => row.id);
  const tutorIds = [...new Set(engagements.map((row) => row.tutor_id).filter(Boolean) as string[])];

  const [sessionsResult, planResult, tutorsResult, casesResult] = await Promise.all([
    supabase.from("tutoring_sessions")
      .select("id,engagement_id,scheduled_for,completed_at,duration_minutes,status")
      .in("engagement_id", engagementIds)
      .limit(5000),
    supabase.from("learning_plan_items")
      .select("engagement_id,progress_status,mastery_percent")
      .in("engagement_id", engagementIds)
      .limit(5000),
    tutorIds.length
      ? supabase.from("tutors").select("id,weekly_capacity_hours,max_active_students").in("id", tutorIds)
      : Promise.resolve({ data: [] as TutorRow[], error: null }),
    supabase.from("retention_cases").select("id,engagement_id,status,snoozed_until,resolved_at").in("engagement_id", engagementIds).limit(2000),
  ]);

  if (sessionsResult.error) throw new Error(sessionsResult.error.message);
  if (planResult.error) throw new Error(planResult.error.message);
  if (tutorsResult.error) throw new Error(tutorsResult.error.message);
  if (casesResult.error) throw new Error(casesResult.error.message);

  const sessions = (sessionsResult.data || []) as SessionRow[];
  const planItems = (planResult.data || []) as PlanRow[];
  const tutors = (tutorsResult.data || []) as TutorRow[];
  const existingCases = (casesResult.data || []) as Array<{ id: string; engagement_id: string; status: RetentionCaseStatus; snoozed_until: string | null; resolved_at: string | null }>;

  const sessionsByEngagement = groupBy(sessions, (row) => row.engagement_id);
  const planByEngagement = groupBy(planItems, (row) => row.engagement_id);
  const tutorMap = new Map(tutors.map((row) => [row.id, row]));
  const existingMap = new Map(existingCases.map((row) => [row.engagement_id, row]));
  const activeStudentsByTutor = new Map<string, number>();
  const plannedMinutesByTutor = new Map<string, number>();
  const sevenDaysAhead = now.getTime() + 7 * DAY_MS;

  for (const engagement of engagements) {
    if (engagement.tutor_id) activeStudentsByTutor.set(engagement.tutor_id, (activeStudentsByTutor.get(engagement.tutor_id) || 0) + 1);
  }
  for (const session of sessions) {
    if (session.status !== "planned" || !session.scheduled_for) continue;
    const engagement = engagements.find((item) => item.id === session.engagement_id);
    if (!engagement?.tutor_id) continue;
    const when = new Date(session.scheduled_for).getTime();
    if (when >= now.getTime() && when <= sevenDaysAhead) {
      plannedMinutesByTutor.set(engagement.tutor_id, (plannedMinutesByTutor.get(engagement.tutor_id) || 0) + session.duration_minutes);
    }
  }

  let opened = 0;
  let monitoring = 0;
  let resolved = 0;
  let highAttention = 0;

  for (const engagement of engagements) {
    const rows = sessionsByEngagement.get(engagement.id) || [];
    const completed = rows
      .filter((row) => row.status === "completed" && (row.completed_at || row.scheduled_for))
      .sort((a, b) => new Date(b.completed_at || b.scheduled_for || 0).getTime() - new Date(a.completed_at || a.scheduled_for || 0).getTime());
    const future = rows
      .filter((row) => row.status === "planned" && row.scheduled_for && new Date(row.scheduled_for).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.scheduled_for || 0).getTime() - new Date(b.scheduled_for || 0).getTime());
    const history = rows
      .filter((row) => row.status !== "planned" && (row.completed_at || row.scheduled_for))
      .sort((a, b) => new Date(b.completed_at || b.scheduled_for || 0).getTime() - new Date(a.completed_at || a.scheduled_for || 0).getTime());

    const lastSessionAt = completed[0]?.completed_at || completed[0]?.scheduled_for || null;
    const nextSessionAt = future[0]?.scheduled_for || null;
    const daysSinceLast = lastSessionAt ? Math.max(0, diffDays(now, new Date(lastSessionAt))) : null;
    const recentDisruptions = history.slice(0, 6).filter((row) => row.status === "cancelled" || row.status === "no_show").length;
    const engagementHours = Math.round((completed.reduce((sum, row) => sum + row.duration_minutes, 0) / 60) * 100) / 100;

    const recentCompletedAsc = completed
      .slice(0, 6)
      .map((row) => new Date(row.completed_at || row.scheduled_for || 0).getTime())
      .sort((a, b) => a - b);
    const gaps = recentCompletedAsc.slice(1).map((value, index) => (value - recentCompletedAsc[index]) / DAY_MS).filter((value) => value > 0);
    const cadenceDays = median(gaps);
    const cadenceDrop = !nextSessionAt && daysSinceLast !== null && cadenceDays !== null && completed.length >= 3 && daysSinceLast > Math.max(10, cadenceDays * 1.75);

    const plan = planByEngagement.get(engagement.id) || [];
    const planCompletion = plan.length
      ? Math.round((plan.reduce((sum, item) => sum + masteryFor(item), 0) / plan.length) * 10) / 10
      : null;

    const startDate = new Date(`${engagement.start_date || engagement.created_at.slice(0, 10)}T12:00:00Z`);
    const engagementAgeDays = Math.max(0, diffDays(now, startDate));
    const endDateDays = engagement.end_date ? diffDays(new Date(`${engagement.end_date}T12:00:00Z`), now) : null;
    const endDateSoon = endDateDays !== null && endDateDays >= 0 && endDateDays <= settings.end_date_window_days;
    const planNearCompletion = planCompletion !== null && planCompletion >= settings.plan_completion_threshold;

    let score = 0;
    const signals: string[] = [];
    if (!engagement.tutor_id) {
      score += 35;
      signals.push("No tutor is assigned to this active engagement");
    }
    if (!nextSessionAt) {
      score += 15;
      signals.push("No future session is currently booked");
    }
    if (daysSinceLast !== null) {
      if (daysSinceLast >= settings.high_attention_days) score += 40;
      else if (daysSinceLast >= settings.inactivity_days) score += 30;
      else if (daysSinceLast >= 14) score += 22;
      else if (daysSinceLast >= 7) score += 12;
      if (daysSinceLast >= 7) signals.push(`Last completed lesson was ${daysSinceLast} days ago`);
    } else if (engagementAgeDays >= 7) {
      score += 25;
      signals.push(`No completed lesson is recorded after ${engagementAgeDays} days`);
    }
    if (cadenceDrop && cadenceDays !== null) {
      score += 20;
      signals.push(`Recent lesson cadence has slowed (previous median gap ${cadenceDays.toFixed(1)} days)`);
    }
    if (recentDisruptions >= settings.disruption_threshold) {
      score += recentDisruptions >= settings.disruption_threshold + 1 ? 25 : 15;
      signals.push(`${recentDisruptions} of the last 6 session records were cancelled or no-show`);
    }
    if (planNearCompletion) signals.push(`Learning plan is ${planCompletion}% complete by recorded mastery`);
    if (endDateSoon) signals.push(`Current engagement end date is in ${endDateDays} days`);
    score = Math.max(0, Math.min(100, score));

    let riskLevel: RetentionRiskLevel = "low";
    if (score >= 50) riskLevel = "high";
    else if (score >= 25) riskLevel = "watch";
    if (riskLevel === "high") highAttention += 1;

    let suggestedAction = "Continue monitoring the current tutoring cadence.";
    if (!engagement.tutor_id) suggestedAction = "Assign a tutor and confirm the next teaching step.";
    else if (!nextSessionAt && daysSinceLast !== null && daysSinceLast >= settings.inactivity_days) suggestedAction = "Contact the student to clarify whether to schedule the next lesson, pause, or complete the engagement.";
    else if (cadenceDrop) suggestedAction = "Review the preferred lesson frequency and agree the next session.";
    else if (recentDisruptions >= settings.disruption_threshold) suggestedAction = "Check for scheduling barriers and agree a more workable lesson cadence.";
    else if (planNearCompletion || endDateSoon) suggestedAction = "Review the current learning plan and decide whether to extend, change focus, or complete the engagement.";
    else if (!nextSessionAt) suggestedAction = "Confirm the next session while the current learning plan is active.";

    const tutor = engagement.tutor_id ? tutorMap.get(engagement.tutor_id) : undefined;
    const tutorCapacityFlag = engagement.tutor_id
      ? capacityFlag(tutor, activeStudentsByTutor.get(engagement.tutor_id) || 0, plannedMinutesByTutor.get(engagement.tutor_id) || 0)
      : null;

    const current = existingMap.get(engagement.id);
    const snoozeExpired = current?.status === "snoozed" && current.snoozed_until && current.snoozed_until < dateOnly(now);
    let nextStatus: RetentionCaseStatus;
    if (current?.status === "dismissed") nextStatus = "dismissed";
    else if (current?.status === "snoozed" && !snoozeExpired) nextStatus = "snoozed";
    else if (current?.status === "resolved" && (score >= 25 || planNearCompletion || endDateSoon)) nextStatus = "resolved";
    else if (score >= 25 || planNearCompletion || endDateSoon) nextStatus = "open";
    else nextStatus = "monitoring";

    if (nextStatus === "open") opened += 1;
    if (nextStatus === "monitoring") monitoring += 1;

    const payload = {
      engagement_id: engagement.id,
      student_id: engagement.student_id,
      tutor_id: engagement.tutor_id,
      status: nextStatus,
      risk_level: riskLevel,
      attention_score: score,
      primary_signal: signals[0] || null,
      signals,
      suggested_action: suggestedAction,
      last_session_at: lastSessionAt,
      next_session_at: nextSessionAt,
      days_since_last_session: daysSinceLast,
      recent_disruptions: recentDisruptions,
      completed_sessions: completed.length,
      engagement_hours: engagementHours,
      plan_completion_percent: planCompletion,
      cadence_days: cadenceDays === null ? null : Math.round(cadenceDays * 10) / 10,
      tutor_capacity_flag: tutorCapacityFlag,
      resolved_at: nextStatus === "resolved" ? (current?.resolved_at || now.toISOString()) : null,
      last_evaluated_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const { error } = await supabase.from("retention_cases").upsert(payload, { onConflict: "engagement_id" });
    if (error) throw new Error(error.message);
  }

  const { data: unresolvedCases } = await supabase
    .from("retention_cases")
    .select("id,engagement_id,status")
    .in("status", ["open", "monitoring", "snoozed"])
    .limit(2000);
  const activeSet = new Set(engagementIds);
  const staleIds = ((unresolvedCases || []) as Array<{ id: string; engagement_id: string; status: RetentionCaseStatus }>).filter((row) => !activeSet.has(row.engagement_id)).map((row) => row.id);
  if (staleIds.length) {
    const { error } = await supabase.from("retention_cases").update({
      status: "resolved",
      resolved_at: now.toISOString(),
      updated_at: now.toISOString(),
      last_evaluated_at: now.toISOString(),
    }).in("id", staleIds);
    if (error) throw new Error(error.message);
    resolved += staleIds.length;
  }

  await supabase.from("retention_settings").update({ last_scan_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", 1);
  return { trigger, scanned: engagements.length, opened, monitoring, resolved, highAttention, skipped: false };
}
