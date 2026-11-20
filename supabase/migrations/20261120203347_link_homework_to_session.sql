-- Link standalone homework assignments back to the tutoring session that created them.
-- Safe to run more than once.

alter table public.homework
  add column if not exists source_session_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'homework_source_session_id_fkey'
      and conrelid = 'public.homework'::regclass
  ) then
    alter table public.homework
      add constraint homework_source_session_id_fkey
      foreign key (source_session_id)
      references public.tutoring_sessions(id)
      on delete set null;
  end if;
end
$$;

create unique index if not exists homework_source_session_unique
  on public.homework(source_session_id);
