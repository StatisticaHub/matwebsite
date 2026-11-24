import {
  DEFAULT_TIME_ZONE,
  dateKeyInTimeZone,
  normalizeTimeZone,
  zonedLocalDateTimeToUtc,
} from "@/lib/time-zone";

export type ProgressReport = {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  engagement_id: string;
  tutor_id: string | null;
  period_start: string;
  period_end: string;
  title: string;
  overall_score: number | null;
  attendance_rate: number | null;
  homework_completion_rate: number | null;
  average_understanding: number | null;
  topic_mastery_average: number | null;
  sessions_completed: number;
  sessions_missed: number;
  homework_completed: number;
  homework_total: number;
  summary: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  next_focus: string | null;
  tutor_comment: string | null;
  student_visible: boolean;
  published_at: string | null;
  student_notified_at: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  created_by: "admin" | "tutor";
};

export type ProgressPlanItem = {
  id: string;
  engagement_id: string;
  topic: string;
  objective: string | null;
  priority: "high" | "medium" | "low";
  progress_status: "needs_work" | "developing" | "comfortable" | "mastered";
  mastery_percent: number | null;
  last_assessed_at: string | null;
  strength_note: string | null;
  next_step: string | null;
};

export type ProgressMetrics = {
  overallScore: number | null;
  attendanceRate: number | null;
  homeworkCompletionRate: number | null;
  averageUnderstanding: number | null;
  topicMasteryAverage: number | null;
  sessionsCompleted: number;
  sessionsMissed: number;
  homeworkCompleted: number;
  homeworkTotal: number;
  risk: boolean;
  riskReasons: string[];
};

export const masteryFromStatus: Record<ProgressPlanItem["progress_status"], number> = {
  needs_work: 25,
  developing: 50,
  comfortable: 75,
  mastered: 100,
};

export function topicMastery(item: Pick<ProgressPlanItem, "mastery_percent" | "progress_status">) {
  return item.mastery_percent ?? masteryFromStatus[item.progress_status];
}

export function masteryLabel(value: number) {
  if (value >= 85) return "Strong";
  if (value >= 70) return "Comfortable";
  if (value >= 50) return "Improving";
  return "Needs practice";
}

export function riskLabel(report: Pick<ProgressReport, "overall_score" | "attendance_rate" | "homework_completion_rate">) {
  if (report.overall_score === null && report.attendance_rate === null && report.homework_completion_rate === null) return "Insufficient data";
  if ((report.attendance_rate ?? 100) < 70 || (report.homework_completion_rate ?? 100) < 50 || (report.overall_score ?? 100) < 55) return "Needs attention";
  if ((report.overall_score ?? 100) < 70) return "Developing";
  return "On track";
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function addCalendarDays(
  value: string,
  days: number,
) {
  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day + days,
    ),
  )
    .toISOString()
    .slice(0, 10);
}

function progressReportWindow(
  periodStart: string,
  periodEnd: string,
  requestedTimeZone: string | null | undefined,
) {
  const timeZone =
    normalizeTimeZone(
      requestedTimeZone,
      DEFAULT_TIME_ZONE,
    );

  const start =
    zonedLocalDateTimeToUtc(
      periodStart,
      "00:00",
      timeZone,
    );

  const nextDate =
    addCalendarDays(
      periodEnd,
      1,
    );

  const endExclusive =
    zonedLocalDateTimeToUtc(
      nextDate,
      "00:00",
      timeZone,
    );

  if (!start.ok || !endExclusive.ok) {
    throw new Error(
      "Could not resolve the progress report period.",
    );
  }

  return {
    timeZone,
    startIso: start.iso,
    endExclusiveIso:
      endExclusive.iso,
  };
}

export async function calculateProgressMetrics(
  supabase: any,
  engagementId: string,
  periodStart: string,
  periodEnd: string,
  requestedTimeZone: string | null | undefined = DEFAULT_TIME_ZONE,
): Promise<ProgressMetrics> {
  const {
    timeZone,
    startIso,
    endExclusiveIso,
  } = progressReportWindow(
    periodStart,
    periodEnd,
    requestedTimeZone,
  );

  const [sessionsResult, homeworkResult, planResult] = await Promise.all([
    supabase.from("tutoring_sessions")
      .select("id,status,scheduled_for,completed_at,understanding_rating")
      .eq("engagement_id", engagementId)
      .gte("scheduled_for", startIso)
      .lt("scheduled_for", endExclusiveIso),
    supabase.from("homework")
      .select("id,status,due_date,created_at")
      .eq("engagement_id", engagementId),
    supabase.from("learning_plan_items")
      .select("id,progress_status,mastery_percent")
      .eq("engagement_id", engagementId),
  ]);

  if (sessionsResult.error) throw new Error(sessionsResult.error.message);
  if (homeworkResult.error) throw new Error(homeworkResult.error.message);
  if (planResult.error) throw new Error(planResult.error.message);

  const sessions = (sessionsResult.data || []) as any[];
  const attendanceSessions = sessions.filter((item) => item.status === "completed" || item.status === "no_show");
  const completedSessions = attendanceSessions.filter((item) => item.status === "completed");
  const missedSessions = attendanceSessions.filter((item) => item.status === "no_show");
  const attendanceRate = attendanceSessions.length ? round((completedSessions.length / attendanceSessions.length) * 100, 1) : null;

  const ratings = completedSessions.map((item) => Number(item.understanding_rating)).filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);
  const averageUnderstanding = ratings.length ? round(ratings.reduce((a, b) => a + b, 0) / ratings.length, 2) : null;

  const homework =
    ((homeworkResult.data || []) as any[])
      .filter((item) => {
        const key =
          item.due_date
            ? String(item.due_date).slice(0, 10)
            : dateKeyInTimeZone(
                item.created_at,
                timeZone,
              );

        return (
          key >= periodStart &&
          key <= periodEnd &&
          item.status !== "skipped"
        );
      });
  const homeworkCompleted = homework.filter(
    (item) =>
      item.status === "completed",
  ).length;
  const homeworkCompletionRate = homework.length ? round((homeworkCompleted / homework.length) * 100, 1) : null;

  const plan = (planResult.data || []) as Array<{ progress_status: ProgressPlanItem["progress_status"]; mastery_percent: number | null }>;
  const masteryValues = plan.map((item) => item.mastery_percent ?? masteryFromStatus[item.progress_status]);
  const topicMasteryAverage = masteryValues.length ? round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length, 1) : null;

  const weighted: Array<[number | null, number]> = [
    [attendanceRate, 0.35],
    [homeworkCompletionRate, 0.25],
    [averageUnderstanding === null ? null : ((averageUnderstanding - 1) / 4) * 100, 0.25],
    [topicMasteryAverage, 0.15],
  ];
  const available = weighted.filter(([value]) => value !== null) as Array<[number, number]>;
  const weightTotal = available.reduce((sum, [, weight]) => sum + weight, 0);
  const overallScore = weightTotal ? Math.round(available.reduce((sum, [value, weight]) => sum + value * weight, 0) / weightTotal) : null;

  const riskReasons: string[] = [];
  if (attendanceRate !== null && attendanceRate < 70) riskReasons.push("Attendance below 70%");
  if (homeworkCompletionRate !== null && homeworkCompletionRate < 50) riskReasons.push("Homework completion below 50%");
  if (overallScore !== null && overallScore < 55) riskReasons.push("Overall progress indicator below 55");

  return {
    overallScore,
    attendanceRate,
    homeworkCompletionRate,
    averageUnderstanding,
    topicMasteryAverage,
    sessionsCompleted: completedSessions.length,
    sessionsMissed: missedSessions.length,
    homeworkCompleted,
    homeworkTotal: homework.length,
    risk: riskReasons.length > 0,
    riskReasons,
  };
}


export function progressDeliveryLabel(
  report: Pick<
    ProgressReport,
    | "student_visible"
    | "student_notified_at"
    | "first_viewed_at"
  >,
) {
  if (!report.student_visible) {
    return "Draft";
  }

  if (report.first_viewed_at) {
    return "Viewed";
  }

  if (report.student_notified_at) {
    return "Email sent";
  }

  return "Published";
}


function deliveryDate(
  value: string | null,
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/London",
    },
  ).format(date);
}


export function progressDeliverySummary(
  report: Pick<
    ProgressReport,
    | "student_visible"
    | "published_at"
    | "student_notified_at"
    | "first_viewed_at"
  >,
) {
  if (!report.student_visible) {
    return "Draft · not visible to student";
  }

  const parts: string[] = [];

  const published =
    deliveryDate(report.published_at);

  const notified =
    deliveryDate(
      report.student_notified_at,
    );

  const viewed =
    deliveryDate(
      report.first_viewed_at,
    );

  parts.push(
    published
      ? `Published ${published}`
      : "Published",
  );

  if (notified) {
    parts.push(
      `Email sent ${notified}`,
    );
  }

  if (viewed) {
    parts.push(
      `Viewed ${viewed}`,
    );
  }

  return parts.join(" · ");
}


export function isNewProgressReport(
  report: Pick<
    ProgressReport,
    | "student_visible"
    | "published_at"
    | "first_viewed_at"
  >,
) {
  return Boolean(
    report.student_visible &&
      report.published_at &&
      !report.first_viewed_at,
  );
}


export function currentMonthRange(now = new Date()) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  return { start, end };
}

export function reportPeriodLabel(start: string, end: string) {
  const format = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `${format.format(new Date(`${start}T12:00:00Z`))} – ${format.format(new Date(`${end}T12:00:00Z`))}`;
}
