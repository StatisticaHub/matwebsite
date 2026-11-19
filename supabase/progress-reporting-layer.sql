-- My Academic Tutor — progress tracking + monthly reports
-- Internal-only. Run after the delivery/student portal layers.

alter table public.learning_plan_items
  add column if not exists mastery_percent smallint,
  add column if not exists last_assessed_at timestamptz,
  add column if not exists strength_note text,
  add column if not exists next_step text;

alter table public.learning_plan_items
  drop constraint if exists learning_plan_items_mastery_percent_check;

alter table public.learning_plan_items
  add constraint learning_plan_items_mastery_percent_check
  check (mastery_percent is null or mastery_percent between 0 and 100);

create table if not exists public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  engagement_id uuid not null references public.tutoring_engagements(id) on delete cascade,
  tutor_id uuid references public.tutors(id) on delete set null,
  period_start date not null,
  period_end date not null,
  title text not null,
  overall_score smallint check (overall_score is null or overall_score between 0 and 100),
  attendance_rate numeric(5,2) check (attendance_rate is null or attendance_rate between 0 and 100),
  homework_completion_rate numeric(5,2) check (homework_completion_rate is null or homework_completion_rate between 0 and 100),
  average_understanding numeric(3,2) check (average_understanding is null or average_understanding between 1 and 5),
  topic_mastery_average numeric(5,2) check (topic_mastery_average is null or topic_mastery_average between 0 and 100),
  sessions_completed integer not null default 0 check (sessions_completed >= 0),
  sessions_missed integer not null default 0 check (sessions_missed >= 0),
  homework_completed integer not null default 0 check (homework_completed >= 0),
  homework_total integer not null default 0 check (homework_total >= 0),
  summary text,
  strengths text,
  areas_for_improvement text,
  next_focus text,
  tutor_comment text,
  student_visible boolean not null default true,
  created_by text not null default 'admin' check (created_by in ('admin','tutor')),
  unique (engagement_id, period_start, period_end),
  check (period_end >= period_start)
);

create index if not exists progress_reports_student_period_idx
  on public.progress_reports(student_id, period_end desc);
create index if not exists progress_reports_engagement_period_idx
  on public.progress_reports(engagement_id, period_end desc);
create index if not exists progress_reports_tutor_period_idx
  on public.progress_reports(tutor_id, period_end desc)
  where tutor_id is not null;

alter table public.progress_reports enable row level security;
revoke all on table public.progress_reports from anon, authenticated;
grant select, insert, update, delete on table public.progress_reports to service_role;

-- Existing delivery tables are already internal-only; retain that model.
revoke all on table public.learning_plan_items from anon, authenticated;

alter table public.student_communications
  drop constraint if exists student_communications_communication_type_check;
alter table public.student_communications
  add constraint student_communications_communication_type_check
  check (communication_type in ('intake_invitation','portal_invitation','session_update','homework_assigned','homework_update','progress_report'));
