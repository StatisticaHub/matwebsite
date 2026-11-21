-- ============================================================
-- MAT secure learning materials workspace
-- Shared by Student Portal, Tutor Portal and Admin.
-- Files remain in a private Supabase Storage bucket.
-- ============================================================

create table if not exists public.learning_materials (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  student_id uuid not null
    references public.students(id)
    on delete cascade,

  engagement_id uuid
    references public.tutoring_engagements(id)
    on delete cascade,

  session_id uuid
    references public.tutoring_sessions(id)
    on delete set null,

  uploaded_by_role text not null
    check (
      uploaded_by_role in (
        'admin',
        'tutor',
        'student'
      )
    ),

  uploaded_by_tutor_id uuid
    references public.tutors(id)
    on delete set null,

  created_by_user_id uuid
    references auth.users(id)
    on delete set null,

  portal_link_id uuid
    references public.student_portal_links(id)
    on delete set null,

  material_type text not null
    check (
      material_type in (
        'file',
        'link',
        'note'
      )
    ),

  category text not null default 'other'
    check (
      category in (
        'lesson_material',
        'worksheet',
        'homework',
        'submission',
        'slides',
        'dataset',
        'notes',
        'reference',
        'solution',
        'other'
      )
    ),

  title text not null
    check (
      char_length(title) between 1 and 200
    ),

  description text,

  original_filename text,

  storage_bucket text,
  storage_path text,

  mime_type text,

  size_bytes bigint
    check (
      size_bytes is null
      or (
        size_bytes >= 0
        and size_bytes <= 52428800
      )
    ),

  external_url text,

  note text,

  visible_to_student boolean not null default true,
  visible_to_tutor boolean not null default true,

  status text not null default 'active'
    check (
      status in (
        'active',
        'archived'
      )
    ),

  constraint learning_material_file_fields
    check (
      material_type <> 'file'
      or (
        storage_bucket is not null
        and storage_path is not null
        and original_filename is not null
      )
    ),

  constraint learning_material_link_fields
    check (
      material_type <> 'link'
      or external_url is not null
    ),

  constraint learning_material_note_fields
    check (
      material_type <> 'note'
      or note is not null
    )
);


create index if not exists learning_materials_student_idx
  on public.learning_materials (
    student_id,
    created_at desc
  );

create index if not exists learning_materials_engagement_idx
  on public.learning_materials (
    engagement_id,
    created_at desc
  );

create index if not exists learning_materials_session_idx
  on public.learning_materials (
    session_id
  )
  where session_id is not null;

create index if not exists learning_materials_tutor_idx
  on public.learning_materials (
    uploaded_by_tutor_id,
    created_at desc
  )
  where uploaded_by_tutor_id is not null;


-- Direct browser access to the metadata table is deliberately blocked.
-- Portal and Tutor operations will go through validated server routes.
alter table public.learning_materials
  enable row level security;

revoke all
  on table public.learning_materials
  from anon, authenticated;


-- ============================================================
-- PRIVATE STORAGE BUCKET
-- 50 MB maximum per learning file.
-- No public URLs.
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'learning-materials',
  'learning-materials',
  false,
  52428800,
  array[
    'application/pdf',

    'image/jpeg',
    'image/png',
    'image/webp',

    'text/plain',
    'text/csv',

    'application/json',
    'application/octet-stream',

    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id)
do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
