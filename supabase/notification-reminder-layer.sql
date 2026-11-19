-- My Academic Tutor — automated notification + reminder engine
-- Internal-only. Run after the tutoring delivery, onboarding and progress layers.

create table if not exists public.notification_settings (
  id smallint primary key default 1 check (id = 1),
  updated_at timestamptz not null default now(),
  automation_enabled boolean not null default true,
  session_24h_enabled boolean not null default true,
  session_same_day_enabled boolean not null default true,
  trial_24h_enabled boolean not null default true,
  overdue_homework_enabled boolean not null default true,
  tutor_missing_notes_enabled boolean not null default true,
  overdue_followups_enabled boolean not null default true,
  monthly_progress_enabled boolean not null default true
);

insert into public.notification_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  notification_type text not null check (notification_type in (
    'session_24h',
    'session_same_day',
    'trial_24h_student',
    'trial_24h_tutor',
    'homework_overdue',
    'tutor_missing_notes',
    'admin_overdue_followups',
    'monthly_progress_due'
  )),
  recipient_kind text not null check (recipient_kind in ('student','tutor','admin')),
  recipient_id uuid,
  recipient_email text not null,
  related_entity_type text,
  related_entity_id uuid,
  dedupe_key text not null unique,
  subject text not null,
  status text not null check (status in ('sent','failed','skipped')),
  provider_id text,
  error text,
  trigger_source text not null default 'cron' check (trigger_source in ('cron','manual'))
);

create index if not exists notification_log_created_idx
  on public.notification_log(created_at desc);
create index if not exists notification_log_type_created_idx
  on public.notification_log(notification_type, created_at desc);
create index if not exists notification_log_recipient_idx
  on public.notification_log(recipient_kind, recipient_email, created_at desc);

alter table public.notification_settings enable row level security;
alter table public.notification_log enable row level security;

revoke all on table public.notification_settings from anon, authenticated;
revoke all on table public.notification_log from anon, authenticated;

grant select, insert, update, delete on table public.notification_settings to service_role;
grant select, insert, update, delete on table public.notification_log to service_role;
