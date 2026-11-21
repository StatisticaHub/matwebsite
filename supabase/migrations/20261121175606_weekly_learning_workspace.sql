-- ============================================================
-- MAT weekly learning workspace
--
-- Student
--   -> tutoring engagement
--      -> tutoring week
--         -> tutoring sessions
--            -> learning materials / homework
--
-- Existing session, homework and material records are retained.
-- ============================================================


-- ============================================================
-- WEEKLY LEARNING PLANS
-- ============================================================

create table if not exists public.tutoring_weeks (
  id uuid primary key
    default gen_random_uuid(),

  created_at timestamptz
    not null
    default now(),

  updated_at timestamptz
    not null
    default now(),

  engagement_id uuid
    not null
    references public.tutoring_engagements(id)
    on delete cascade,

  created_by_tutor_id uuid
    references public.tutors(id)
    on delete set null,

  week_number integer
    not null
    check (week_number >= 1),

  week_start date
    not null,

  week_end date
    not null,

  title text
    not null
    check (
      char_length(title)
      between 1 and 200
    ),

  focus text,

  objectives text[]
    not null
    default '{}'::text[],

  student_summary text,

  tutor_notes text,

  status text
    not null
    default 'draft'
    check (
      status in (
        'draft',
        'published',
        'completed'
      )
    ),

  published_at timestamptz,

  completed_at timestamptz,

  constraint tutoring_weeks_dates_check
    check (
      week_end >= week_start
    ),

  constraint tutoring_weeks_engagement_week_unique
    unique (
      engagement_id,
      week_number
    )
);


create index if not exists tutoring_weeks_engagement_idx
  on public.tutoring_weeks (
    engagement_id,
    week_start desc
  );

create index if not exists tutoring_weeks_tutor_idx
  on public.tutoring_weeks (
    created_by_tutor_id,
    week_start desc
  )
  where created_by_tutor_id is not null;

create index if not exists tutoring_weeks_status_idx
  on public.tutoring_weeks (
    engagement_id,
    status,
    week_start desc
  );


-- Server-controlled access only.
alter table public.tutoring_weeks
  enable row level security;

revoke all
  on table public.tutoring_weeks
  from anon, authenticated;

grant
  select,
  insert,
  update,
  delete
  on table public.tutoring_weeks
  to service_role;


-- ============================================================
-- LINK EXISTING REAL SESSIONS TO A WEEK
-- ============================================================

alter table public.tutoring_sessions
  add column if not exists
    week_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where
      conname =
        'tutoring_sessions_week_id_fkey'
      and conrelid =
        'public.tutoring_sessions'::regclass
  ) then

    alter table public.tutoring_sessions
      add constraint
        tutoring_sessions_week_id_fkey
      foreign key (
        week_id
      )
      references public.tutoring_weeks(id)
      on delete set null;

  end if;
end
$$;


create index if not exists tutoring_sessions_week_idx
  on public.tutoring_sessions (
    week_id,
    scheduled_for
  )
  where week_id is not null;


-- ============================================================
-- ALLOW GENERAL WEEK MATERIALS
--
-- session_id continues to mean:
-- "this file belongs specifically to this lesson".
--
-- week_id without session_id means:
-- "this is a general file for the whole week".
-- ============================================================

alter table public.learning_materials
  add column if not exists
    week_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where
      conname =
        'learning_materials_week_id_fkey'
      and conrelid =
        'public.learning_materials'::regclass
  ) then

    alter table public.learning_materials
      add constraint
        learning_materials_week_id_fkey
      foreign key (
        week_id
      )
      references public.tutoring_weeks(id)
      on delete set null;

  end if;
end
$$;


create index if not exists learning_materials_week_idx
  on public.learning_materials (
    week_id,
    created_at desc
  )
  where week_id is not null;


-- ============================================================
-- OPTIONAL DISPLAY ORDER FOR A SESSION WITHIN ITS WEEK
-- ============================================================

alter table public.tutoring_sessions
  add column if not exists
    week_position integer;

alter table public.tutoring_sessions
  drop constraint if exists
    tutoring_sessions_week_position_check;

alter table public.tutoring_sessions
  add constraint
    tutoring_sessions_week_position_check
  check (
    week_position is null
    or week_position >= 1
  );


create index if not exists tutoring_sessions_week_position_idx
  on public.tutoring_sessions (
    week_id,
    week_position
  )
  where week_id is not null;


-- ============================================================
-- COMMENTS
-- ============================================================

comment on table public.tutoring_weeks is
  'Tutor-managed weekly learning plans for each tutoring engagement.';

comment on column public.tutoring_weeks.tutor_notes is
  'Internal tutor planning notes. Not intended for student display.';

comment on column public.tutoring_weeks.student_summary is
  'Student-visible description of the goals and plan for the week.';

comment on column public.tutoring_sessions.week_id is
  'Weekly learning workspace containing this tutoring session.';

comment on column public.tutoring_sessions.week_position is
  'Optional tutor-defined display order of the session inside its week.';

comment on column public.learning_materials.week_id is
  'Weekly learning workspace associated with this material.';
