create table if not exists public.session_recordings (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.tutoring_sessions(id)
    on delete cascade,

  provider text not null default 'zoom',

  provider_recording_id text not null,
  provider_meeting_id text,
  provider_meeting_uuid text,

  recording_type text,
  file_type text,
  file_extension text,
  file_name text,

  file_size_bytes bigint,

  recording_start timestamptz,
  recording_end timestamptz,

  play_url text,
  download_url text,
  play_passcode text,

  status text not null default 'completed',

  tutor_visible boolean not null default true,
  student_visible boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint session_recordings_provider_recording_unique
    unique (provider, provider_recording_id),

  constraint session_recordings_file_size_check
    check (
      file_size_bytes is null
      or file_size_bytes >= 0
    )
);

create index if not exists
  session_recordings_session_id_idx
on public.session_recordings(session_id);

create index if not exists
  session_recordings_session_visible_idx
on public.session_recordings(
  session_id,
  student_visible
);

alter table public.session_recordings
  enable row level security;

/*
 * Recording metadata stays server-side.
 * Student/tutor access will go through authenticated MAT routes.
 */
revoke all
on table public.session_recordings
from anon, authenticated;
