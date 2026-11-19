-- My Academic Tutor — consent-aware lead nurture layer
-- Apply after the core CRM/follow-up layers.
-- Existing leads are NOT automatically enrolled: nurture_started_at stays NULL
-- until a new website lead is created by the upgraded application or an admin
-- explicitly starts nurture later.

alter table if exists public.tutoring_leads
  add column if not exists nurture_started_at timestamptz,
  add column if not exists nurture_paused boolean not null default false,
  add column if not exists marketing_email_consent boolean not null default false,
  add column if not exists marketing_email_consent_at timestamptz,
  add column if not exists marketing_email_consent_source text,
  add column if not exists marketing_email_consent_version text,
  add column if not exists marketing_email_unsubscribed_at timestamptz,
  add column if not exists email_preference_token uuid not null default gen_random_uuid();

create unique index if not exists tutoring_leads_email_preference_token_idx
  on public.tutoring_leads(email_preference_token);

create index if not exists tutoring_leads_nurture_started_idx
  on public.tutoring_leads(nurture_started_at)
  where nurture_started_at is not null;

create index if not exists tutoring_leads_marketing_consent_idx
  on public.tutoring_leads(marketing_email_consent, nurture_paused)
  where nurture_started_at is not null;

create table if not exists public.lead_nurture_settings (
  id smallint primary key default 1 check (id = 1),
  updated_at timestamptz not null default now(),
  automation_enabled boolean not null default true,
  service_checkin_enabled boolean not null default true,
  educational_day3_enabled boolean not null default true,
  educational_day7_enabled boolean not null default true,
  final_day14_enabled boolean not null default true
);

insert into public.lead_nurture_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.lead_nurture_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id uuid not null references public.tutoring_leads(id) on delete cascade,
  sequence_key text not null check (sequence_key in (
    'service_checkin_day1',
    'education_day3',
    'education_day7',
    'final_checkin_day14'
  )),
  recipient_email text not null,
  subject text not null,
  status text not null check (status in ('sent','failed','skipped')),
  provider_id text,
  error text,
  trigger_source text not null default 'cron' check (trigger_source in ('cron','manual')),
  dedupe_key text not null unique
);

create index if not exists lead_nurture_log_created_idx
  on public.lead_nurture_log(created_at desc);
create index if not exists lead_nurture_log_lead_idx
  on public.lead_nurture_log(lead_id, created_at desc);
create index if not exists lead_nurture_log_sequence_idx
  on public.lead_nurture_log(sequence_key, created_at desc);

alter table public.lead_nurture_settings enable row level security;
alter table public.lead_nurture_log enable row level security;

revoke all on table public.lead_nurture_settings from anon, authenticated;
revoke all on table public.lead_nurture_log from anon, authenticated;

grant select, insert, update, delete on table public.lead_nurture_settings to service_role;
grant select, insert, update, delete on table public.lead_nurture_log to service_role;

-- Existing tutoring_leads grants/RLS continue to protect the new columns.
