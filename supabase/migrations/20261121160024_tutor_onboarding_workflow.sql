-- Tutor onboarding workflow.
-- Operational tutor status remains pending / active / inactive.
-- onboarding_status tracks profile completion and admin review separately.

alter table public.tutors
  add column if not exists onboarding_status text
    not null
    default 'not_started'
    check (
      onboarding_status in (
        'not_started',
        'draft',
        'submitted',
        'changes_requested',
        'approved'
      )
    ),
  add column if not exists onboarding_submitted_at timestamptz,
  add column if not exists onboarding_updated_at timestamptz;

-- Existing operational tutors should not suddenly appear as incomplete.
update public.tutors
set
  onboarding_status = 'approved',
  onboarding_updated_at = coalesce(onboarding_updated_at, now())
where status in ('active', 'inactive')
  and onboarding_status = 'not_started';

comment on column public.tutors.onboarding_status is
  'Tutor onboarding progress: not_started, draft, submitted, changes_requested or approved.';

comment on column public.tutors.onboarding_submitted_at is
  'Most recent time the tutor submitted their profile for admin review.';

comment on column public.tutors.onboarding_updated_at is
  'Most recent time tutor onboarding information was changed.';
