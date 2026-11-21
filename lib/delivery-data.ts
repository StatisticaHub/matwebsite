export const engagementStatuses = ["active", "paused", "completed"] as const;
export type EngagementStatus = (typeof engagementStatuses)[number];

export const engagementStatusLabels: Record<EngagementStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Completed",
};

export const progressStatuses = ["needs_work", "developing", "comfortable", "mastered"] as const;
export type ProgressStatus = (typeof progressStatuses)[number];

export const progressStatusLabels: Record<ProgressStatus, string> = {
  needs_work: "Needs work",
  developing: "Developing",
  comfortable: "Comfortable",
  mastered: "Mastered",
};

export const sessionStatuses = ["planned", "completed", "cancelled", "no_show"] as const;
export type SessionStatus = (typeof sessionStatuses)[number];

export const sessionStatusLabels: Record<SessionStatus, string> = {
  planned: "Planned",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export const homeworkStatuses = ["assigned", "submitted", "reviewed", "completed", "skipped"] as const;
export type HomeworkStatus = (typeof homeworkStatuses)[number];

export const homeworkStatusLabels: Record<HomeworkStatus, string> = {
  assigned: "Assigned",
  submitted: "Submitted",
  reviewed: "Reviewed",
  completed: "Completed",
  skipped: "Skipped",
};

export type Student = {
  id: string;
  created_at: string;
  updated_at: string;
  source_lead_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  academic_level: string | null;
  institution: string | null;
  programme: string | null;
  curriculum: string | null;
  status: "active" | "inactive" | "prospect";
  notes: string | null;
};

export type TutoringEngagement = {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  source_lead_id: string | null;
  tutor_id: string | null;
  subject: string;
  title: string;
  module: string | null;
  goal: string | null;
  target: string | null;
  start_date: string | null;
  end_date: string | null;
  status: EngagementStatus;
  frequency: string | null;
  session_duration_minutes: number;
  student_rate: number | null;
  tutor_rate: number | null;
  currency: string;
  current_focus: string | null;
  confidence: number | null;
  upcoming_deadline: string | null;
  preferred_learning_style: string | null;
  weak_topics: string[];
  assessment_summary: string | null;
  notes: string | null;
};

export type LearningPlanItem = {
  id: string;
  created_at: string;
  updated_at: string;
  engagement_id: string;
  topic: string;
  objective: string | null;
  priority: "high" | "medium" | "low";
  progress_status: ProgressStatus;
  mastery_percent: number | null;
  last_assessed_at: string | null;
  strength_note: string | null;
  next_step: string | null;
  sort_order: number;
  notes: string | null;
};

export type TutoringSession = {
  id: string;
  created_at: string;
  updated_at: string;
  engagement_id: string;
  tutor_id: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
  duration_minutes: number;
  status: SessionStatus;
  topic: string;
  lesson_notes: string | null;
  understanding_rating: number | null;
  next_topic: string | null;
  homework_summary: string | null;
  meeting_url: string | null;
  student_rate: number | null;
  tutor_rate: number | null;
  currency: string;
};

export type Homework = {
  id: string;
  created_at: string;
  updated_at: string;
  engagement_id: string;
  week_id: string | null;
  session_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  status: HomeworkStatus;
  tutor_feedback: string | null;
};

export type LearningResource = {
  id: string;
  created_at: string;
  engagement_id: string;
  session_id: string | null;
  title: string;
  resource_type: "link" | "note" | "worksheet" | "syllabus" | "other";
  url: string | null;
  note: string | null;
};
