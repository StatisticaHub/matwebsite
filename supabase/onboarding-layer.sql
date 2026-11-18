-- My Academic Tutor — student onboarding layer
-- Run this AFTER supabase/student-portal-layer.sql.
-- Student intake is server-mediated. Browser roles receive no direct table access.
-- Raw intake tokens are never stored; only SHA-256 hashes and short previews are persisted.

create table if not exists public.student_onboarding (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  status text not null default 'awaiting_intake' check (status in ('awaiting_intake','review','ready','complete')),
  timezone text,
  availability text,
  target_outcome text,
  target_date date,
  current_confidence smallint check (current_confidence between 1 and 5),
  strong_topics text,
  weak_topics text,
  learning_preferences text,
  course_context text,
  assessment_context text,
  accessibility_requirements text,
  anything_else text,
  consent_confirmed boolean not null default false,
  intake_completed_at timestamptz,
  reviewed_at timestamptz,
  admin_notes text
);

create table if not exists public.student_intake_links (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  token_hash text not null unique,
  token_preview text not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_by_email text,
  label text
);

create unique index if not exists student_intake_one_active_link_idx
  on public.student_intake_links(student_id)
  where revoked_at is null;

create index if not exists student_intake_hash_idx
  on public.student_intake_links(token_hash)
  where revoked_at is null;

create index if not exists student_onboarding_status_idx
  on public.student_onboarding(status, updated_at desc);

-- Backfill onboarding rows for students created before this layer was installed.
insert into public.student_onboarding (student_id)
select s.id
from public.students s
on conflict (student_id) do nothing;

alter table public.student_onboarding enable row level security;
alter table public.student_intake_links enable row level security;

revoke all on table public.student_onboarding from anon, authenticated;
revoke all on table public.student_intake_links from anon, authenticated;

grant select, insert, update, delete on table public.student_onboarding to service_role;
grant select, insert, update, delete on table public.student_intake_links to service_role;

-- Transactional communication log. This is server/admin-only and contains no raw portal or intake tokens.
create table if not exists public.student_communications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  engagement_id uuid references public.tutoring_engagements(id) on delete set null,
  communication_type text not null check (communication_type in ('intake_invitation','portal_invitation','session_update','homework_assigned','homework_update')),
  channel text not null default 'email' check (channel in ('email')),
  recipient text not null,
  subject text not null,
  status text not null check (status in ('sent','failed','skipped')),
  provider_id text,
  error text,
  created_by_email text
);

create index if not exists student_communications_student_idx
  on public.student_communications(student_id, created_at desc);

alter table public.student_communications enable row level security;
revoke all on table public.student_communications from anon, authenticated;
grant select, insert, update, delete on table public.student_communications to service_role;

