-- My Academic Tutor — GA4 CRM lifecycle sync
-- Server-only storage for GA identity capture and Measurement Protocol audit.

alter table public.tutoring_leads
  add column if not exists ga_client_id text,
  add column if not exists ga_session_id text,
  add column if not exists ga_captured_at timestamptz;

create index if not exists tutoring_leads_ga_client_id_idx
  on public.tutoring_leads (ga_client_id)
  where ga_client_id is not null;

create table if not exists public.ga4_lifecycle_event_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid not null references public.tutoring_leads(id) on delete cascade,
  event_name text not null check (event_name in (
    'working_lead',
    'qualify_lead',
    'disqualify_lead',
    'close_convert_lead',
    'close_unconvert_lead'
  )),
  source_action text not null,
  dedupe_key text not null unique,
  status text not null check (status in ('sent','failed','skipped')),
  attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  response_status integer,
  error text,
  client_id_present boolean not null default false
);

create index if not exists ga4_lifecycle_event_log_lead_idx
  on public.ga4_lifecycle_event_log (lead_id, attempted_at desc);

create index if not exists ga4_lifecycle_event_log_status_idx
  on public.ga4_lifecycle_event_log (status, attempted_at desc);

alter table public.ga4_lifecycle_event_log enable row level security;

revoke all on table public.ga4_lifecycle_event_log from anon, authenticated;
grant select, insert, update, delete on table public.ga4_lifecycle_event_log to service_role;

-- The lead table already belongs to the existing server-side CRM. Explicitly make
-- the new attribution columns inaccessible to browser roles as part of that model.
revoke select (ga_client_id, ga_session_id, ga_captured_at)
  on table public.tutoring_leads from anon, authenticated;
