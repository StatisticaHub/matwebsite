-- My Academic Tutor — lead follow-up + trial workflow layer
-- Apply once to the same Supabase project used by the MAT CRM.
-- This extends the existing internal tutoring_leads table; it creates no new public-facing table.

alter table if exists public.tutoring_leads
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists follow_up_note text,
  add column if not exists trial_status text not null default 'not_scheduled',
  add column if not exists trial_scheduled_for timestamptz,
  add column if not exists trial_duration_minutes integer not null default 30,
  add column if not exists trial_meeting_url text,
  add column if not exists trial_outcome text,
  add column if not exists trial_notes text,
  add column if not exists trial_completed_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tutoring_leads_trial_status_check'
  ) then
    alter table public.tutoring_leads
      add constraint tutoring_leads_trial_status_check
      check (trial_status in ('not_scheduled','scheduled','completed','cancelled','no_show'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tutoring_leads_trial_duration_check'
  ) then
    alter table public.tutoring_leads
      add constraint tutoring_leads_trial_duration_check
      check (trial_duration_minutes between 15 and 180);
  end if;
end $$;

create index if not exists tutoring_leads_follow_up_idx
  on public.tutoring_leads(next_follow_up_at)
  where next_follow_up_at is not null;

create index if not exists tutoring_leads_trial_schedule_idx
  on public.tutoring_leads(trial_status, trial_scheduled_for)
  where trial_scheduled_for is not null;

-- Existing RLS/grants on tutoring_leads continue to apply to these columns.
