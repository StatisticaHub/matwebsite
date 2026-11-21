-- Student Portal authentication
-- Only MAT-approved active students are linked to Supabase Auth accounts.

alter table public.students
  add column if not exists auth_user_id uuid,
  add column if not exists portal_enabled boolean not null default false,
  add column if not exists portal_invited_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_auth_user_id_fkey'
      and conrelid = 'public.students'::regclass
  ) then
    alter table public.students
      add constraint students_auth_user_id_fkey
      foreign key (auth_user_id)
      references auth.users(id)
      on delete set null;
  end if;
end
$$;

create unique index if not exists students_auth_user_id_unique
  on public.students(auth_user_id)
  where auth_user_id is not null;

create index if not exists students_portal_enabled_idx
  on public.students(portal_enabled)
  where portal_enabled = true;
