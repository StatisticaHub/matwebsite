-- My Academic Tutor — student learning portal layer
-- Run this AFTER supabase/delivery-layer.sql.
-- Portal access is server-mediated: anon/authenticated roles have no direct table access.
-- Raw portal tokens are never stored; only SHA-256 hashes and short non-secret previews are persisted.

create table if not exists public.student_portal_links (
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

create unique index if not exists student_portal_one_active_link_idx
  on public.student_portal_links(student_id)
  where revoked_at is null;

create index if not exists student_portal_hash_idx
  on public.student_portal_links(token_hash)
  where revoked_at is null;

create table if not exists public.student_support_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid not null references public.students(id) on delete cascade,
  engagement_id uuid references public.tutoring_engagements(id) on delete set null,
  portal_link_id uuid references public.student_portal_links(id) on delete set null,
  category text not null default 'general' check (category in ('general','lesson','homework','resource','technical')),
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  admin_note text,
  resolved_at timestamptz
);

create index if not exists support_requests_status_idx
  on public.student_support_requests(status, created_at desc);
create index if not exists support_requests_student_idx
  on public.student_support_requests(student_id, created_at desc);

create table if not exists public.homework_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  homework_id uuid not null references public.homework(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  portal_link_id uuid references public.student_portal_links(id) on delete set null,
  note text,
  submission_url text,
  submitted_at timestamptz not null default now(),
  unique(homework_id, student_id)
);

create index if not exists homework_submissions_student_idx
  on public.homework_submissions(student_id, submitted_at desc);

alter table public.student_portal_links enable row level security;
alter table public.student_support_requests enable row level security;
alter table public.homework_submissions enable row level security;

revoke all on table public.student_portal_links from anon, authenticated;
revoke all on table public.student_support_requests from anon, authenticated;
revoke all on table public.homework_submissions from anon, authenticated;

grant select, insert, update, delete on table public.student_portal_links to service_role;
grant select, insert, update, delete on table public.student_support_requests to service_role;
grant select, insert, update, delete on table public.homework_submissions to service_role;
