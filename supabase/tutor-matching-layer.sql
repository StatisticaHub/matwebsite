-- My Academic Tutor — tutor availability + matching layer
-- Extends the existing internal tutors table only.

alter table if exists public.tutors
  add column if not exists availability_days text[] not null default '{}',
  add column if not exists availability_periods text[] not null default '{}',
  add column if not exists weekly_capacity_hours numeric(5,1),
  add column if not exists max_active_students integer,
  add column if not exists accepts_trials boolean not null default true;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tutors_weekly_capacity_check'
  ) then
    alter table public.tutors
      add constraint tutors_weekly_capacity_check
      check (weekly_capacity_hours is null or (weekly_capacity_hours >= 0 and weekly_capacity_hours <= 80));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'tutors_max_active_students_check'
  ) then
    alter table public.tutors
      add constraint tutors_max_active_students_check
      check (max_active_students is null or (max_active_students >= 0 and max_active_students <= 100));
  end if;
end $$;
