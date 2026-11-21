-- Richer tutor-quality profile for internal matching and verification.
-- Extends the existing tutors table; no duplicate tutor system is created.

alter table public.tutors
  add column if not exists specialisms text[] not null default '{}'::text[],
  add column if not exists qualifications text,
  add column if not exists teaching_experience text,
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists verification_notes text;

comment on column public.tutors.specialisms is
  'Specific topics, methods, software or curricula the tutor is particularly suited to teach.';

comment on column public.tutors.qualifications is
  'Internal summary of relevant academic and professional qualifications.';

comment on column public.tutors.teaching_experience is
  'Internal summary of tutoring, teaching or relevant professional experience.';

comment on column public.tutors.languages is
  'Languages in which the tutor can comfortably teach.';

comment on column public.tutors.verification_notes is
  'Private admin notes about qualification, identity and tutor-quality verification.';
