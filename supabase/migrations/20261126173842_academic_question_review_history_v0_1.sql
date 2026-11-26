-- ============================================================
-- MAT Academic Question Review History v0.1
--
-- Structured governance for canonical assessment questions.
--
-- Lifecycle:
-- draft -> review -> approved -> published
--
-- Supported backward / archive transitions:
-- review    -> draft
-- approved  -> review
-- published -> approved
-- any active state -> archived
-- archived  -> draft
--
-- All mutations and audit events occur transactionally inside
-- SECURITY INVOKER database functions.
-- ============================================================


-- ============================================================
-- 1. STRUCTURED QUESTION REVIEW HISTORY
-- ============================================================

create table if not exists public.academic_question_review_events (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  question_id uuid not null
    references public.academic_questions(id)
    on delete restrict,

  event_type text not null
    check (
      event_type in (
        'edited',
        'submitted_for_review',
        'returned_to_draft',
        'returned_to_review',
        'approved',
        'published',
        'unpublished',
        'archived',
        'restored',
        'legacy_state'
      )
    ),

  from_status text
    check (
      from_status is null
      or from_status in (
        'draft',
        'review',
        'approved',
        'published',
        'archived'
      )
    ),

  to_status text
    check (
      to_status is null
      or to_status in (
        'draft',
        'review',
        'approved',
        'published',
        'archived'
      )
    ),

  reviewer_user_id uuid,
  reviewer_email text,
  note text,

  slug_snapshot text not null,
  title_snapshot text,
  prompt_snapshot text not null,

  question_type_snapshot text not null,
  difficulty_snapshot smallint not null,
  cognitive_level_snapshot text not null,

  estimated_minutes_snapshot integer,
  marks_snapshot numeric(7,2)
);


create index if not exists
  academic_question_review_events_question_idx
on public.academic_question_review_events(
  question_id,
  created_at desc
);


create index if not exists
  academic_question_review_events_reviewer_idx
on public.academic_question_review_events(
  reviewer_user_id,
  created_at desc
);


alter table public.academic_question_review_events
  enable row level security;


revoke all
  on table public.academic_question_review_events
  from anon, authenticated;


grant select, insert, update, delete
  on table public.academic_question_review_events
  to service_role;


comment on table public.academic_question_review_events is
  'Immutable-style structured review history and question snapshots for MAT canonical academic questions.';


-- ============================================================
-- 2. TRANSACTIONAL QUESTION EDIT FUNCTION
-- ============================================================

create or replace function public.mat_update_academic_question(
  p_question_id uuid,
  p_title text,
  p_prompt text,
  p_question_type text,
  p_difficulty smallint,
  p_cognitive_level text,
  p_estimated_minutes integer,
  p_marks numeric,
  p_source_note text,
  p_review_notes text,
  p_reviewer_user_id uuid,
  p_reviewer_email text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.academic_questions%rowtype;
  v_updated public.academic_questions%rowtype;
  v_next_status text;
begin
  if nullif(btrim(coalesce(p_reviewer_email, '')), '') is null then
    raise exception 'Reviewer email is required.';
  end if;

  if nullif(btrim(coalesce(p_prompt, '')), '') is null then
    raise exception 'Question prompt is required.';
  end if;

  if p_question_type not in (
    'multiple_choice',
    'true_false',
    'short_answer',
    'numeric',
    'calculation',
    'interpretation',
    'proof',
    'code',
    'extended_response'
  ) then
    raise exception 'Invalid question type.';
  end if;

  if p_difficulty is null or p_difficulty < 1 or p_difficulty > 5 then
    raise exception 'Difficulty must be between 1 and 5.';
  end if;

  if p_cognitive_level not in (
    'remember',
    'understand',
    'apply',
    'analyse',
    'evaluate',
    'create'
  ) then
    raise exception 'Invalid cognitive level.';
  end if;

  if p_estimated_minutes is not null and p_estimated_minutes <= 0 then
    raise exception 'Estimated minutes must be positive.';
  end if;

  if p_marks is not null and p_marks < 0 then
    raise exception 'Marks cannot be negative.';
  end if;

  select *
  into v_existing
  from public.academic_questions
  where id = p_question_id
  for update;

  if not found then
    raise exception 'Academic question not found.';
  end if;

  if v_existing.lifecycle_status = 'published' then
    raise exception
      'Published questions must be unpublished before editing.';
  end if;

  if v_existing.lifecycle_status = 'archived' then
    raise exception
      'Archived questions must be restored before editing.';
  end if;

  v_next_status := v_existing.lifecycle_status;

  -- Editing previously approved content invalidates approval.
  if v_existing.lifecycle_status = 'approved' then
    v_next_status := 'review';
  end if;

  update public.academic_questions
  set
    title = nullif(btrim(coalesce(p_title, '')), ''),
    prompt = btrim(p_prompt),
    question_type = p_question_type,
    difficulty = p_difficulty,
    cognitive_level = p_cognitive_level,
    estimated_minutes = p_estimated_minutes,
    marks = p_marks,
    source_note = nullif(btrim(coalesce(p_source_note, '')), ''),
    review_notes = nullif(btrim(coalesce(p_review_notes, '')), ''),
    lifecycle_status = v_next_status,
    reviewed_at = case
      when v_next_status = 'approved'
        then reviewed_at
      else null
    end,
    updated_at = now()
  where id = p_question_id
  returning *
  into v_updated;

  insert into public.academic_question_review_events (
    question_id,
    event_type,
    from_status,
    to_status,
    reviewer_user_id,
    reviewer_email,
    note,
    slug_snapshot,
    title_snapshot,
    prompt_snapshot,
    question_type_snapshot,
    difficulty_snapshot,
    cognitive_level_snapshot,
    estimated_minutes_snapshot,
    marks_snapshot
  )
  values (
    v_updated.id,
    'edited',
    v_existing.lifecycle_status,
    v_updated.lifecycle_status,
    p_reviewer_user_id,
    btrim(p_reviewer_email),
    nullif(btrim(coalesce(p_review_notes, '')), ''),
    v_updated.slug,
    v_updated.title,
    v_updated.prompt,
    v_updated.question_type,
    v_updated.difficulty,
    v_updated.cognitive_level,
    v_updated.estimated_minutes,
    v_updated.marks
  );

  return v_updated.id;
end;
$$;


-- ============================================================
-- 3. TRANSACTIONAL QUESTION LIFECYCLE FUNCTION
-- ============================================================

create or replace function public.mat_transition_academic_question(
  p_question_id uuid,
  p_next_status text,
  p_reviewer_user_id uuid,
  p_reviewer_email text,
  p_note text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.academic_questions%rowtype;
  v_updated public.academic_questions%rowtype;
  v_event_type text;
begin
  if nullif(btrim(coalesce(p_reviewer_email, '')), '') is null then
    raise exception 'Reviewer email is required.';
  end if;

  if p_next_status not in (
    'draft',
    'review',
    'approved',
    'published',
    'archived'
  ) then
    raise exception 'Invalid lifecycle status.';
  end if;

  select *
  into v_existing
  from public.academic_questions
  where id = p_question_id
  for update;

  if not found then
    raise exception 'Academic question not found.';
  end if;

  if not (
    (v_existing.lifecycle_status = 'draft'
      and p_next_status in ('review', 'archived'))

    or

    (v_existing.lifecycle_status = 'review'
      and p_next_status in ('draft', 'approved', 'archived'))

    or

    (v_existing.lifecycle_status = 'approved'
      and p_next_status in ('review', 'published', 'archived'))

    or

    (v_existing.lifecycle_status = 'published'
      and p_next_status in ('approved', 'archived'))

    or

    (v_existing.lifecycle_status = 'archived'
      and p_next_status = 'draft')
  ) then
    raise exception
      'Invalid academic question lifecycle transition: % -> %',
      v_existing.lifecycle_status,
      p_next_status;
  end if;

  v_event_type :=
    case
      when v_existing.lifecycle_status = 'draft'
        and p_next_status = 'review'
        then 'submitted_for_review'

      when v_existing.lifecycle_status = 'review'
        and p_next_status = 'draft'
        then 'returned_to_draft'

      when v_existing.lifecycle_status = 'approved'
        and p_next_status = 'review'
        then 'returned_to_review'

      when v_existing.lifecycle_status = 'review'
        and p_next_status = 'approved'
        then 'approved'

      when p_next_status = 'published'
        then 'published'

      when v_existing.lifecycle_status = 'published'
        and p_next_status = 'approved'
        then 'unpublished'

      when p_next_status = 'archived'
        then 'archived'

      when v_existing.lifecycle_status = 'archived'
        and p_next_status = 'draft'
        then 'restored'

      else 'edited'
    end;

  update public.academic_questions
  set
    lifecycle_status = p_next_status,

    reviewed_at =
      case
        when p_next_status = 'approved'
          then now()

        when p_next_status = 'published'
          then coalesce(reviewed_at, now())

        else null
      end,

    updated_at = now()

  where id = p_question_id
  returning *
  into v_updated;

  insert into public.academic_question_review_events (
    question_id,
    event_type,
    from_status,
    to_status,
    reviewer_user_id,
    reviewer_email,
    note,
    slug_snapshot,
    title_snapshot,
    prompt_snapshot,
    question_type_snapshot,
    difficulty_snapshot,
    cognitive_level_snapshot,
    estimated_minutes_snapshot,
    marks_snapshot
  )
  values (
    v_updated.id,
    v_event_type,
    v_existing.lifecycle_status,
    v_updated.lifecycle_status,
    p_reviewer_user_id,
    btrim(p_reviewer_email),
    nullif(btrim(coalesce(p_note, '')), ''),
    v_updated.slug,
    v_updated.title,
    v_updated.prompt,
    v_updated.question_type,
    v_updated.difficulty,
    v_updated.cognitive_level,
    v_updated.estimated_minutes,
    v_updated.marks
  );

  return v_updated.id;
end;
$$;


-- ============================================================
-- 4. LOCK DOWN FUNCTION EXECUTION
-- ============================================================

revoke execute on function
  public.mat_update_academic_question(
    uuid,
    text,
    text,
    text,
    smallint,
    text,
    integer,
    numeric,
    text,
    text,
    uuid,
    text
  )
from public, anon, authenticated;


grant execute on function
  public.mat_update_academic_question(
    uuid,
    text,
    text,
    text,
    smallint,
    text,
    integer,
    numeric,
    text,
    text,
    uuid,
    text
  )
to service_role;


revoke execute on function
  public.mat_transition_academic_question(
    uuid,
    text,
    uuid,
    text,
    text
  )
from public, anon, authenticated;


grant execute on function
  public.mat_transition_academic_question(
    uuid,
    text,
    uuid,
    text,
    text
  )
to service_role;


-- ============================================================
-- 5. BACKFILL PRE-HISTORY NON-DRAFT STATES
--
-- Current v0.1 seed questions are draft, so normally this adds
-- zero rows. It protects against any pre-existing reviewed state.
-- ============================================================

insert into public.academic_question_review_events (
  created_at,
  question_id,
  event_type,
  from_status,
  to_status,
  reviewer_user_id,
  reviewer_email,
  note,
  slug_snapshot,
  title_snapshot,
  prompt_snapshot,
  question_type_snapshot,
  difficulty_snapshot,
  cognitive_level_snapshot,
  estimated_minutes_snapshot,
  marks_snapshot
)
select
  coalesce(
    q.reviewed_at,
    q.updated_at,
    q.created_at
  ),
  q.id,
  'legacy_state',
  null,
  q.lifecycle_status,
  null,
  null,
  'Backfilled when structured academic question review history was introduced. Earlier reviewer attribution, if any, remains in the question review notes.',
  q.slug,
  q.title,
  q.prompt,
  q.question_type,
  q.difficulty,
  q.cognitive_level,
  q.estimated_minutes,
  q.marks
from public.academic_questions q
where (
    q.lifecycle_status <> 'draft'
    or q.reviewed_at is not null
  )
  and not exists (
    select 1
    from public.academic_question_review_events e
    where e.question_id = q.id
  );
