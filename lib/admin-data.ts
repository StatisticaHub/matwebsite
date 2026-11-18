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
  timezone: string | null;
  hourly_rate: number | null;
  currency: string;
  availability_notes: string | null;
  verified: boolean;
};

export type LeadActivity = {
  id: string;
  created_at: string;
  event_type: string;
  note: string | null;
  created_by_email: string | null;
};
