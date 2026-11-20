export type RetentionSettings = {
  id: number;
  updated_at: string;
  last_scan_at: string | null;
  automation_enabled: boolean;
  scan_interval_hours: number;
  inactivity_days: number;
  high_attention_days: number;
  disruption_threshold: number;
  plan_completion_threshold: number;
  end_date_window_days: number;
};

export type RetentionCaseStatus = "open" | "monitoring" | "snoozed" | "resolved" | "dismissed";
export type RetentionRiskLevel = "low" | "watch" | "high";

export type RetentionCase = {
  id: string;
  created_at: string;
  updated_at: string;
  engagement_id: string;
  student_id: string;
  tutor_id: string | null;
  status: RetentionCaseStatus;
  risk_level: RetentionRiskLevel;
  attention_score: number;
  primary_signal: string | null;
  signals: string[];
  suggested_action: string | null;
  last_session_at: string | null;
  next_session_at: string | null;
  days_since_last_session: number | null;
  recent_disruptions: number;
  completed_sessions: number;
  engagement_hours: number;
  plan_completion_percent: number | null;
  cadence_days: number | null;
  tutor_capacity_flag: string | null;
  snoozed_until: string | null;
  admin_note: string | null;
  tutor_note: string | null;
  tutor_reviewed_at: string | null;
  last_outreach_at: string | null;
  last_outcome: string | null;
  resolved_at: string | null;
  last_evaluated_at: string;
};

export type RetentionOutreach = {
  id: string;
  created_at: string;
  engagement_id: string;
  student_id: string;
  tutor_id: string | null;
  channel: "email" | "phone" | "whatsapp" | "portal" | "other";
  outcome: "contacted" | "rebooked" | "paused" | "completed" | "no_response" | "declined" | "other";
  note: string | null;
  actor_kind: "admin" | "tutor";
  actor_email: string | null;
};

export const retentionCaseStatusLabels: Record<RetentionCaseStatus, string> = {
  open: "Open",
  monitoring: "Monitoring",
  snoozed: "Snoozed",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const retentionRiskLabels: Record<RetentionRiskLevel, string> = {
  low: "Low attention",
  watch: "Watch",
  high: "High attention",
};

export function formatRetentionDateTime(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/London",
  }).format(new Date(value));
}

export function formatRetentionDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "Europe/London",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function hoursFromMinutes(minutes: number) {
  return Math.round((minutes / 60) * 10) / 10;
}

export function percentage(numerator: number, denominator: number) {
  return denominator ? Math.round((numerator / denominator) * 1000) / 10 : null;
}
