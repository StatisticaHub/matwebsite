-- My Academic Tutor — tutor portal layer
-- Run after the tutor matching + delivery layers.
-- Portal data remains server-mediated; authenticated browser roles are not granted table access.

alter table if exists public.tutors
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null,
  add column if not exists portal_enabled boolean not null default false,
  add column if not exists portal_invited_at timestamptz;

alter table if exists public.tutoring_sessions
  add column if not exists meeting_url text;

alter table if exists public.tutoring_leads
  add column if not exists trial_tutor_feedback text;

create index if not exists tutors_auth_user_idx
  on public.tutors(auth_user_id)
  where auth_user_id is not null;

create index if not exists tutor_sessions_tutor_date_idx
  on public.tutoring_sessions(tutor_id, scheduled_for desc)
  where tutor_id is not null;

-- Existing security model is preserved: operational tables are read/written
-- through server-side code after tutor identity + tutor ownership checks.
revoke all on table public.tutors from anon, authenticated;
revoke all on table public.tutoring_sessions from anon, authenticated;
revoke all on table public.tutoring_leads from anon, authenticated;

grant select, insert, update, delete on table public.tutors to service_role;
grant select, insert, update, delete on table public.tutoring_sessions to service_role;
grant select, insert, update, delete on table public.tutoring_leads to service_role;
