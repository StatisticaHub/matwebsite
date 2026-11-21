-- Mandatory tutor recruitment requirements:
-- 1. Degree certificate(s)
-- 2. Two professional / academic references
-- 3. Demo teaching submission

alter table public.tutor_applications
  add column if not exists demo_subject text,
  add column if not exists demo_level text,
  add column if not exists demo_topic text,
  add column if not exists demo_video_url text,
  add column if not exists demo_notes text;


-- ============================================================
-- REFERENCES
-- ============================================================

create table if not exists public.tutor_application_references (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.tutor_applications(id)
    on delete cascade,

  reference_number smallint not null
    check (reference_number in (1, 2)),

  name text not null,
  email text not null,
  phone text,
  relationship text not null,
  organisation text,

  status text not null default 'provided'
    check (
      status in (
        'provided',
        'contacted',
        'verified',
        'unresponsive',
        'concern'
      )
    ),

  admin_notes text,

  contacted_at timestamptz,
  verified_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(application_id, reference_number)
);

create index if not exists tutor_application_references_application_idx
  on public.tutor_application_references(application_id);

alter table public.tutor_application_references
  enable row level security;

revoke all on table public.tutor_application_references
  from anon, authenticated;


-- ============================================================
-- DEGREE / QUALIFICATION DOCUMENTS
-- ============================================================

create table if not exists public.tutor_application_documents (
  id uuid primary key default gen_random_uuid(),

  application_id uuid not null
    references public.tutor_applications(id)
    on delete cascade,

  document_type text not null
    check (
      document_type in (
        'degree_certificate'
      )
    ),

  storage_bucket text not null default 'tutor-application-documents',
  storage_path text not null unique,

  original_filename text not null,
  mime_type text,
  size_bytes bigint
    check (size_bytes is null or size_bytes >= 0),

  verification_status text not null default 'submitted'
    check (
      verification_status in (
        'submitted',
        'verified',
        'rejected'
      )
    ),

  admin_notes text,

  verified_at timestamptz,
  verified_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

create index if not exists tutor_application_documents_application_idx
  on public.tutor_application_documents(application_id);

alter table public.tutor_application_documents
  enable row level security;

revoke all on table public.tutor_application_documents
  from anon, authenticated;


-- ============================================================
-- PRIVATE STORAGE
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public
)
values (
  'tutor-application-documents',
  'tutor-application-documents',
  false
)
on conflict (id)
do update set public = false;

comment on table public.tutor_application_references is
  'Two referees supplied as part of a tutor application.';

comment on table public.tutor_application_documents is
  'Private qualification evidence submitted by tutor applicants.';

comment on column public.tutor_applications.demo_video_url is
  'Shareable link to the applicant teaching demonstration recording.';
