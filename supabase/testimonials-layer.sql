-- My Academic Tutor — testimonials & reviews layer
-- Internal-only table. Public feedback forms and public testimonial pages are
-- served through Next.js server code using SUPABASE_SECRET_KEY.


-- Extend the existing internal communication log so feedback-request emails are auditable.
alter table public.student_communications
  drop constraint if exists student_communications_communication_type_check;
alter table public.student_communications
  add constraint student_communications_communication_type_check
  check (communication_type in ('intake_invitation','portal_invitation','session_update','homework_assigned','homework_update','progress_report','feedback_request'));

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  student_id uuid references public.students(id) on delete set null,
  engagement_id uuid references public.tutoring_engagements(id) on delete set null,
  tutor_id uuid references public.tutors(id) on delete set null,
  request_token uuid not null default gen_random_uuid() unique,
  request_expires_at timestamptz not null default (now() + interval '45 days'),
  requested_at timestamptz not null default now(),
  email_sent_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  status text not null default 'requested' check (status in ('requested','submitted','approved','rejected')),
  rating smallint check (rating between 1 and 5),
  review_text text,
  display_name text,
  display_context text,
  subject text,
  academic_level text,
  consent_to_publish boolean not null default false,
  featured boolean not null default false,
  admin_note text
);

create index if not exists testimonials_status_approved_idx
  on public.testimonials(status, approved_at desc);
create index if not exists testimonials_student_idx
  on public.testimonials(student_id, created_at desc);
create index if not exists testimonials_subject_idx
  on public.testimonials(subject, status);
create index if not exists testimonials_tutor_idx
  on public.testimonials(tutor_id, status);

alter table public.testimonials enable row level security;

-- Keep the table out of the browser Data API surface. The public feedback link
-- is handled by server actions that validate the one-time request token.
revoke all on table public.testimonials from anon, authenticated;
grant select, insert, update, delete on table public.testimonials to service_role;
