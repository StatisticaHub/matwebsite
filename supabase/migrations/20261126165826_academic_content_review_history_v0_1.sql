-- ============================================================
-- MAT Academic Knowledge Engine
-- Structured Academic Review History v0.1
--
-- Adds:
--   1. Immutable-style academic review event history
--   2. Content snapshots at review events
--   3. Atomic content editing + audit logging
--   4. Atomic lifecycle transitions + audit logging
--
-- Functions are SECURITY INVOKER and service-role only.
-- ============================================================


-- ============================================================
-- REVIEW EVENT HISTORY
-- ============================================================

create table if not exists public.academic_content_review_events (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  content_block_id uuid not null
    references public.academic_content_blocks(id)
    on delete restrict,

  concept_id uuid not null
    references public.academic_concepts(id)
    on delete restrict,

  event_type text not null
    check (
      event_type in (
        'edited',
        'submitted_for_review',
        'returned_to_draft',
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

  block_type_snapshot text not null,
  title_snapshot text,
  body_snapshot text not null
);


create index if not exists academic_content_review_events_block_idx
  on public.academic_content_review_events(
    content_block_id,
    created_at desc
  );

create index if not exists academic_content_review_events_concept_idx
  on public.academic_content_review_events(
    concept_id,
    created_at desc
  );

create index if not exists academic_content_review_events_reviewer_idx
  on public.academic_content_review_events(
    reviewer_email,
    created_at desc
  );


-- ============================================================
-- SECURITY
-- ============================================================

alter table public.academic_content_review_events
  enable row level security;

revoke all
  on table public.academic_content_review_events
  from anon, authenticated;

grant select, insert, update, delete
  on table public.academic_content_review_events
  to service_role;


-- ============================================================
-- ATOMIC CONTENT EDIT FUNCTION
--
-- Rules:
-- - reviewer identity required
-- - published content cannot be silently edited
-- - editing approved content automatically returns it to review
-- - edit + audit event happen in one transaction
-- ============================================================

create or replace function public.mat_update_academic_content_block(
  p_block_id uuid,
  p_concept_id uuid,
  p_title text,
  p_body text,
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
  v_block public.academic_content_blocks%rowtype;
  v_next_status text;
  v_updated public.academic_content_blocks%rowtype;
begin
  if p_reviewer_email is null
     or btrim(p_reviewer_email) = '' then
    raise exception
      'Reviewer identity is required.';
  end if;

  if p_body is null
     or btrim(p_body) = '' then
    raise exception
      'Academic content body cannot be empty.';
  end if;

  select *
  into v_block
  from public.academic_content_blocks
  where id = p_block_id
    and concept_id = p_concept_id
  for update;

  if not found then
    raise exception
      'Academic content block was not found.';
  end if;

  if v_block.lifecycle_status = 'published' then
    raise exception
      'Published academic content must be unpublished before editing.';
  end if;

  v_next_status :=
    case
      when v_block.lifecycle_status = 'approved'
        then 'review'
      else v_block.lifecycle_status
    end;

  update public.academic_content_blocks
  set
    title = nullif(btrim(p_title), ''),
    body = p_body,
    review_notes =
      nullif(btrim(p_review_notes), ''),
    lifecycle_status = v_next_status,
    reviewed_at =
      case
        when v_block.lifecycle_status = 'approved'
          then null
        else reviewed_at
      end,
    updated_at = now()
  where id = p_block_id
    and concept_id = p_concept_id
  returning *
  into v_updated;

  insert into public.academic_content_review_events (
    content_block_id,
    concept_id,
    event_type,
    from_status,
    to_status,
    reviewer_user_id,
    reviewer_email,
    note,
    block_type_snapshot,
    title_snapshot,
    body_snapshot
  )
  values (
    v_updated.id,
    v_updated.concept_id,
    'edited',
    v_block.lifecycle_status,
    v_updated.lifecycle_status,
    p_reviewer_user_id,
    btrim(p_reviewer_email),
    case
      when v_block.lifecycle_status = 'approved'
        then
          'Approved content was edited and automatically returned to review.'
      else
          'Academic content edited.'
    end,
    v_updated.block_type,
    v_updated.title,
    v_updated.body
  );

  return v_updated.id;
end;
$$;


-- ============================================================
-- ATOMIC LIFECYCLE TRANSITION FUNCTION
--
-- Enforces:
--
-- draft     -> review | archived
-- review    -> draft | approved | archived
-- approved  -> review | published | archived
-- published -> approved | archived
-- archived  -> draft
--
-- No direct draft -> published.
-- ============================================================

create or replace function public.mat_transition_academic_content_block(
  p_block_id uuid,
  p_concept_id uuid,
  p_next_status text,
  p_reviewer_user_id uuid,
  p_reviewer_email text,
  p_note text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_block public.academic_content_blocks%rowtype;
  v_updated public.academic_content_blocks%rowtype;
  v_event_type text;
begin
  if p_reviewer_email is null
     or btrim(p_reviewer_email) = '' then
    raise exception
      'Reviewer identity is required.';
  end if;

  if p_next_status not in (
    'draft',
    'review',
    'approved',
    'published',
    'archived'
  ) then
    raise exception
      'Invalid lifecycle status: %',
      p_next_status;
  end if;

  select *
  into v_block
  from public.academic_content_blocks
  where id = p_block_id
    and concept_id = p_concept_id
  for update;

  if not found then
    raise exception
      'Academic content block was not found.';
  end if;

  if not (
    (
      v_block.lifecycle_status = 'draft'
      and p_next_status in ('review', 'archived')
    )
    or
    (
      v_block.lifecycle_status = 'review'
      and p_next_status in (
        'draft',
        'approved',
        'archived'
      )
    )
    or
    (
      v_block.lifecycle_status = 'approved'
      and p_next_status in (
        'review',
        'published',
        'archived'
      )
    )
    or
    (
      v_block.lifecycle_status = 'published'
      and p_next_status in (
        'approved',
        'archived'
      )
    )
    or
    (
      v_block.lifecycle_status = 'archived'
      and p_next_status = 'draft'
    )
  ) then
    raise exception
      'Illegal academic lifecycle transition: % -> %',
      v_block.lifecycle_status,
      p_next_status;
  end if;

  v_event_type :=
    case
      when v_block.lifecycle_status = 'draft'
        and p_next_status = 'review'
        then 'submitted_for_review'

      when v_block.lifecycle_status = 'review'
        and p_next_status = 'draft'
        then 'returned_to_draft'

      when p_next_status = 'approved'
        and v_block.lifecycle_status = 'review'
        then 'approved'

      when p_next_status = 'published'
        then 'published'

      when v_block.lifecycle_status = 'published'
        and p_next_status = 'approved'
        then 'unpublished'

      when p_next_status = 'archived'
        then 'archived'

      when v_block.lifecycle_status = 'archived'
        and p_next_status = 'draft'
        then 'restored'

      when v_block.lifecycle_status = 'approved'
        and p_next_status = 'review'
        then 'returned_to_draft'

      else 'edited'
    end;

  update public.academic_content_blocks
  set
    lifecycle_status = p_next_status,

    reviewed_at =
      case
        when p_next_status = 'approved'
          then now()

        when p_next_status = 'published'
          then reviewed_at

        when (
          v_block.lifecycle_status = 'published'
          and p_next_status = 'approved'
        )
          then reviewed_at

        else null
      end,

    updated_at = now()

  where id = p_block_id
    and concept_id = p_concept_id

  returning *
  into v_updated;

  insert into public.academic_content_review_events (
    content_block_id,
    concept_id,
    event_type,
    from_status,
    to_status,
    reviewer_user_id,
    reviewer_email,
    note,
    block_type_snapshot,
    title_snapshot,
    body_snapshot
  )
  values (
    v_updated.id,
    v_updated.concept_id,
    v_event_type,
    v_block.lifecycle_status,
    v_updated.lifecycle_status,
    p_reviewer_user_id,
    btrim(p_reviewer_email),
    nullif(btrim(p_note), ''),
    v_updated.block_type,
    v_updated.title,
    v_updated.body
  );

  return v_updated.id;
end;
$$;


-- ============================================================
-- FUNCTION ACCESS
--
-- public functions receive EXECUTE for PUBLIC by default,
-- therefore explicitly restrict these admin-only functions.
-- ============================================================

revoke execute
  on function public.mat_update_academic_content_block(
    uuid,
    uuid,
    text,
    text,
    text,
    uuid,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.mat_update_academic_content_block(
    uuid,
    uuid,
    text,
    text,
    text,
    uuid,
    text
  )
  to service_role;


revoke execute
  on function public.mat_transition_academic_content_block(
    uuid,
    uuid,
    text,
    uuid,
    text,
    text
  )
  from public, anon, authenticated;

grant execute
  on function public.mat_transition_academic_content_block(
    uuid,
    uuid,
    text,
    uuid,
    text,
    text
  )
  to service_role;


-- ============================================================
-- BACKFILL CURRENT NON-DRAFT STATE
--
-- The controlled Arithmetic Mean test happened before this
-- structured audit table existed.
--
-- We preserve that historical state without pretending we have
-- structured reviewer attribution for the pre-audit event.
-- Existing review_notes remain on the content block.
-- ============================================================

insert into public.academic_content_review_events (
  content_block_id,
  concept_id,
  event_type,
  from_status,
  to_status,
  reviewer_user_id,
  reviewer_email,
  note,
  block_type_snapshot,
  title_snapshot,
  body_snapshot,
  created_at
)
select
  block.id,
  block.concept_id,
  'legacy_state',
  null,
  block.lifecycle_status,
  null,
  null,
  'Backfilled when structured academic review history was introduced. Earlier reviewer attribution remains in the content block review notes.',
  block.block_type,
  block.title,
  block.body,
  coalesce(block.reviewed_at, block.updated_at, block.created_at)
from public.academic_content_blocks block
where (
    block.lifecycle_status <> 'draft'
    or block.reviewed_at is not null
  )
  and not exists (
    select 1
    from public.academic_content_review_events existing
    where existing.content_block_id = block.id
  );


-- ============================================================
-- DOCUMENTATION
-- ============================================================

comment on table public.academic_content_review_events is
  'Structured audit trail for MAT academic content edits and lifecycle review events, including reviewer identity and content snapshots.';

comment on function public.mat_update_academic_content_block(
  uuid,
  uuid,
  text,
  text,
  text,
  uuid,
  text
) is
  'Atomically edits academic content and records an attributed review event. Published content cannot be edited directly.';

comment on function public.mat_transition_academic_content_block(
  uuid,
  uuid,
  text,
  uuid,
  text,
  text
) is
  'Atomically enforces MAT academic lifecycle transitions and records reviewer-attributed content snapshots.';
