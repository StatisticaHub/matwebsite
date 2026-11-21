alter table public.tutor_applications
  add column if not exists demo_review_status text not null default 'not_reviewed',
  add column if not exists demo_subject_accuracy smallint,
  add column if not exists demo_explanation_clarity smallint,
  add column if not exists demo_teaching_structure smallint,
  add column if not exists demo_communication smallint,
  add column if not exists demo_professionalism smallint,
  add column if not exists demo_review_notes text,
  add column if not exists demo_reviewed_at timestamptz,
  add column if not exists demo_reviewed_by uuid references auth.users(id) on delete set null;

alter table public.tutor_applications
  drop constraint if exists tutor_applications_demo_review_status_check;

alter table public.tutor_applications
  add constraint tutor_applications_demo_review_status_check
  check (
    demo_review_status in (
      'not_reviewed',
      'needs_review',
      'satisfactory',
      'rejected'
    )
  );

alter table public.tutor_applications
  drop constraint if exists tutor_applications_demo_scores_check;

alter table public.tutor_applications
  add constraint tutor_applications_demo_scores_check
  check (
    (demo_subject_accuracy is null or demo_subject_accuracy between 1 and 5)
    and
    (demo_explanation_clarity is null or demo_explanation_clarity between 1 and 5)
    and
    (demo_teaching_structure is null or demo_teaching_structure between 1 and 5)
    and
    (demo_communication is null or demo_communication between 1 and 5)
    and
    (demo_professionalism is null or demo_professionalism between 1 and 5)
  );

comment on column public.tutor_applications.demo_review_status is
  'MAT review outcome for the submitted teaching demonstration.';
