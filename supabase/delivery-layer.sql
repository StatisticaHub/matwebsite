-- My Academic Tutor — tutoring delivery layer
-- Run this AFTER the existing CRM schema in Supabase SQL Editor.
-- These tables are internal-only. Browser roles receive no direct access.
-- The Next.js admin uses the server-only Supabase secret key after admin auth.

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_lead_id uuid unique references public.tutoring_leads(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  country text,
  academic_level text,
  institution text,
  programme text,
  curriculum text,
  status text not null default 'active' check (status in ('active','inactive','prospect')),
  notes text
);

create table if not exists public.tutoring_engagements (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  source_lead_id uuid unique references public.tutoring_leads(id) on delete set null,
  tutor_id uuid references public.tutors(id) on delete set null,
  subject text not null,
  title text not null,
  module text,
  goal text,
  target text,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('active','paused','completed')),
  frequency text,
  session_duration_minutes integer not null default 60 check (session_duration_minutes between 15 and 480),
  student_rate numeric(10,2),
  tutor_rate numeric(10,2),
  currency text not null default 'GBP',
  current_focus text,
  confidence smallint check (confidence between 1 and 5),
  upcoming_deadline date,
  preferred_learning_style text,
  weak_topics text[] not null default '{}',
  assessment_summary text,
  notes text
);

create table if not exists public.learning_plan_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  engagement_id uuid not null references public.tutoring_engagements(id) on delete cascade,
  topic text not null,
  objective text,
  priority text not null default 'medium' check (priority in ('high','medium','low')),
  progress_status text not null default 'needs_work' check (progress_status in ('needs_work','developing','comfortable','mastered')),
  sort_order integer not null default 0,
  notes text
);

create table if not exists public.tutoring_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  engagement_id uuid not null references public.tutoring_engagements(id) on delete cascade,
  tutor_id uuid references public.tutors(id) on delete set null,
  scheduled_for timestamptz,
  completed_at timestamptz,
  duration_minutes integer not null default 60 check (duration_minutes between 15 and 480),
  status text not null default 'planned' check (status in ('planned','completed','cancelled','no_show')),
  topic text not null,
  lesson_notes text,
  understanding_rating smallint check (understanding_rating between 1 and 5),
  next_topic text,
  homework_summary text,
  student_rate numeric(10,2),
  tutor_rate numeric(10,2),
  currency text not null default 'GBP'
);

create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  engagement_id uuid not null references public.tutoring_engagements(id) on delete cascade,
  session_id uuid references public.tutoring_sessions(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status text not null default 'assigned' check (status in ('assigned','submitted','reviewed','completed','skipped')),
  tutor_feedback text
);

create table if not exists public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  engagement_id uuid not null references public.tutoring_engagements(id) on delete cascade,
  session_id uuid references public.tutoring_sessions(id) on delete set null,
  title text not null,
  resource_type text not null default 'link' check (resource_type in ('link','note','worksheet','syllabus','other')),
  url text,
  note text
);

create index if not exists students_status_idx on public.students(status);
create index if not exists students_email_idx on public.students(lower(email));
create index if not exists engagements_student_idx on public.tutoring_engagements(student_id, status);
create index if not exists engagements_tutor_idx on public.tutoring_engagements(tutor_id, status);
create index if not exists plan_engagement_idx on public.learning_plan_items(engagement_id, sort_order, created_at);
create index if not exists sessions_engagement_date_idx on public.tutoring_sessions(engagement_id, scheduled_for desc);
create index if not exists sessions_status_date_idx on public.tutoring_sessions(status, scheduled_for);
create index if not exists homework_engagement_status_idx on public.homework(engagement_id, status);
create index if not exists resources_engagement_idx on public.learning_resources(engagement_id, created_at desc);

alter table public.students enable row level security;
alter table public.tutoring_engagements enable row level security;
alter table public.learning_plan_items enable row level security;
alter table public.tutoring_sessions enable row level security;
alter table public.homework enable row level security;
alter table public.learning_resources enable row level security;

revoke all on table public.students from anon, authenticated;
revoke all on table public.tutoring_engagements from anon, authenticated;
revoke all on table public.learning_plan_items from anon, authenticated;
revoke all on table public.tutoring_sessions from anon, authenticated;
revoke all on table public.homework from anon, authenticated;
revoke all on table public.learning_resources from anon, authenticated;

grant select, insert, update, delete on table public.students to service_role;
grant select, insert, update, delete on table public.tutoring_engagements to service_role;
grant select, insert, update, delete on table public.learning_plan_items to service_role;
grant select, insert, update, delete on table public.tutoring_sessions to service_role;
grant select, insert, update, delete on table public.homework to service_role;
grant select, insert, update, delete on table public.learning_resources to service_role;
