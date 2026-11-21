-- ============================================================
-- MAT WEEKLY HOMEWORK WORKSPACE
--
-- Extends the existing homework system so assignments can be
-- organised by:
--
-- Engagement / course
--   -> Week
--      -> Optional session
--         -> Homework
--
-- Existing homework and homework submissions remain intact.
-- ============================================================


alter table public.homework
  add column if not exists week_id uuid;


do $$
begin

  if not exists (
    select 1
    from pg_constraint
    where conname =
      'homework_week_id_fkey'
      and conrelid =
        'public.homework'::regclass
  ) then

    alter table public.homework
      add constraint homework_week_id_fkey
      foreign key (week_id)
      references public.tutoring_weeks(id)
      on delete set null;

  end if;

end
$$;


/*
 * Backfill existing homework where
 * homework already belongs to a session
 * and that session belongs to a week.
 */

update public.homework h

set week_id =
  s.week_id

from public.tutoring_sessions s

where h.session_id =
    s.id

  and h.week_id
    is null

  and s.week_id
    is not null;


/*
 * Workspace lookup indexes.
 */

create index if not exists
  homework_week_due_idx

on public.homework (
  week_id,
  due_date
);


create index if not exists
  homework_week_session_idx

on public.homework (
  week_id,
  session_id
);
