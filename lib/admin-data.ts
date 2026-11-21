export const leadStatuses = [
  "new",
  "contacted",
  "matching",
  "tutor_assigned",
  "booked",
  "ongoing",
  "closed",
  "lost",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  matching: "Matching",
  tutor_assigned: "Tutor assigned",
  booked: "Booked",
  ongoing: "Ongoing",
  closed: "Closed",
  lost: "Lost",
};

export type TutoringLead = {
  id: string;
  reference: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone: string | null;
  country: string;
  level: string;
  subject: string;
  support_type: string;
  curriculum: string | null;
  topic: string | null;
  requirements: string;
  availability: string | null;
  urgency: string | null;
  status: LeadStatus;
  source: string | null;
  landing_page: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  assigned_tutor_id: string | null;
  quoted_rate: number | null;
  currency: string;
  internal_notes: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  follow_up_note: string | null;
  trial_status: "not_scheduled" | "scheduled" | "completed" | "cancelled" | "no_show";
  trial_scheduled_for: string | null;
  trial_duration_minutes: number | null;
  trial_meeting_url: string | null;
  trial_outcome: string | null;
  trial_notes: string | null;
  trial_completed_at: string | null;
};

export type Tutor = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  status: "active" | "inactive" | "pending";
  headline: string | null;
  subjects: string[];
  levels: string[];
  specialisms: string[];
  qualifications: string | null;
  teaching_experience: string | null;
  languages: string[];
  verification_notes: string | null;
  timezone: string | null;
  hourly_rate: number | null;
  currency: string;
  availability_notes: string | null;
  availability_days: string[];
  availability_periods: string[];
  weekly_capacity_hours: number | null;
  max_active_students: number | null;
  accepts_trials: boolean;
  auth_user_id: string | null;
  portal_enabled: boolean;
  portal_invited_at: string | null;
  verified: boolean;
};

export type LeadActivity = {
  id: string;
  created_at: string;
  event_type: string;
  note: string | null;
  created_by_email: string | null;
};
