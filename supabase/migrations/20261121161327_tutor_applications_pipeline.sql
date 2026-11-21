-- Tutor recruitment pipeline.
-- Public applicants submit through a server-side API route.
-- The table itself is not exposed to anon/authenticated clients.

create table if not exists public.tutor_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  reference text not null unique,

  name text not null,
  email text not null,
  phone text,
  country text,

  subjects text[] not null default '{}'::text[],
  levels text[] not null default '{}'::text[],
  specialisms text[] not null default '{}'::text[],
  languages text[] not null default '{}'::text[],

  qualifications text not null,
  teaching_experience text not null,

  timezone text,
  availability text,

  online_teaching_setup text,
  motivation text,

  academic_integrity_confirmed boolean not null default false,

  status text not null default 'new'
    check (
      status in (
        'new',
        'reviewing',
        'approved',
        'rejected',
        'converted'
      )
    ),

  admin_notes text,

  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,

  converted_tutor_id uuid
    references public.tutors(id)
    on delete set null,

  converted_at timestamptz
);

create index if not exists tutor_applications_status_created_idx
  on public.tutor_applications(status, created_at desc);

create index if not exists tutor_applications_email_idx
  on public.tutor_applications(lower(email));

create index if not exists tutor_applications_converted_tutor_idx
  on public.tutor_applications(converted_tutor_id)
  where converted_tutor_id is not null;

alter table public.tutor_applications enable row level security;

-- Applicant data is accessed only through trusted server-side code.
-- Do not allow browser Supabase clients to query this table directly.
revoke all on table public.tutor_applications from anon, authenticated;

comment on table public.tutor_applications is
  'Private tutor applications submitted through the My Academic Tutor recruitment form.';

comment on column public.tutor_applications.status is
  'Recruitment state: new, reviewing, approved, rejected or converted.';

comment on column public.tutor_applications.converted_tutor_id is
  'Tutor record created after an approved application is converted into onboarding.';
