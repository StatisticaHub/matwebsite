-- My Academic Tutor — retention + rebooking intelligence layer
-- Internal-only operational tables. Browser roles receive no direct access.

create table if not exists public.retention_settings (
  id smallint primary key default 1 check (id = 1),
  updated_at timestamptz not null default now(),
  last_scan_at timestamptz,
  automation_enabled boolean not null default true,
  scan_interval_hours integer not null default 6 check (scan_interval_hours between 1 and 168),
  inactivity_days integer not null default 21 check (inactivity_days between 7 and 180),
  high_attention_days integer not null default 30 check (high_attention_days between 14 and 365),
  disruption_threshold integer not null default 2 check (disruption_threshold between 1 and 10),
  plan_completion_threshold integer not null default 80 check (plan_completion_threshold between 50 and 100),
  end_date_window_days integer not null default 14 check (end_date_window_days between 1 and 90)
);

insert into public.retention_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.retention_cases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  engagement_id uuid not null unique references public.tutoring_engagements(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  tutor_id uuid references public.tutors(id) on delete set null,
  status text not null default 'monitoring' check (status in ('open','monitoring','snoozed','resolved','dismissed')),
  risk_level text not null default 'low' check (risk_level in ('low','watch','high')),
  attention_score smallint not null default 0 check (attention_score between 0 and 100),
  primary_signal text,
  signals text[] not null default '{}',
  suggested_action text,
  last_session_at timestamptz,
  next_session_at timestamptz,
  days_since_last_session integer,
  recent_disruptions integer not null default 0,
  completed_sessions integer not null default 0,
  engagement_hours numeric(10,2) not null default 0,
  plan_completion_percent numeric(5,1),
  cadence_days numeric(6,1),
  tutor_capacity_flag text,
  snoozed_until date,
  admin_note text,
  tutor_note text,
  tutor_reviewed_at timestamptz,
  last_outreach_at timestamptz,
  last_outcome text,
  resolved_at timestamptz,
  last_evaluated_at timestamptz not null default now()
);

create table if not exists public.retention_outreach_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  engagement_id uuid not null references public.tutoring_engagements(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  tutor_id uuid references public.tutors(id) on delete set null,
  channel text not null check (channel in ('email','phone','whatsapp','portal','other')),
  outcome text not null check (outcome in ('contacted','rebooked','paused','completed','no_response','declined','other')),
  note text,
  actor_kind text not null check (actor_kind in ('admin','tutor')),
  actor_email text
);

create index if not exists retention_cases_status_score_idx
  on public.retention_cases(status, attention_score desc, last_evaluated_at desc);
create index if not exists retention_cases_tutor_idx
  on public.retention_cases(tutor_id, status, attention_score desc);
create index if not exists retention_cases_student_idx
  on public.retention_cases(student_id, status);
create index if not exists retention_outreach_engagement_idx
  on public.retention_outreach_log(engagement_id, created_at desc);

alter table public.retention_settings enable row level security;
alter table public.retention_cases enable row level security;
alter table public.retention_outreach_log enable row level security;

revoke all on table public.retention_settings from anon, authenticated;
revoke all on table public.retention_cases from anon, authenticated;
revoke all on table public.retention_outreach_log from anon, authenticated;

-- Explicit grants are required for new public-schema tables on current Supabase projects.
grant select, insert, update, delete on table public.retention_settings to service_role;
grant select, insert, update, delete on table public.retention_cases to service_role;
grant select, insert, update, delete on table public.retention_outreach_log to service_role;
