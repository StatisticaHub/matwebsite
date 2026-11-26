-- Correct semantic labelling for approved -> review transitions.

alter table public.academic_content_review_events
  drop constraint if exists academic_content_review_events_event_type_check;

alter table public.academic_content_review_events
  add constraint academic_content_review_events_event_type_check
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
  );

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
    raise exception 'Reviewer identity is required.';
  end if;

  if p_next_status not in (
    'draft',
    'review',
    'approved',
    'published',
    'archived'
  ) then
    raise exception 'Invalid lifecycle status: %', p_next_status;
  end if;

  select *
  into v_block
  from public.academic_content_blocks
  where id = p_block_id
    and concept_id = p_concept_id
  for update;

  if not found then
    raise exception 'Academic content block was not found.';
  end if;

  if not (
    (
      v_block.lifecycle_status = 'draft'
      and p_next_status in ('review', 'archived')
    )
    or
    (
      v_block.lifecycle_status = 'review'
      and p_next_status in ('draft', 'approved', 'archived')
    )
    or
    (
      v_block.lifecycle_status = 'approved'
      and p_next_status in ('review', 'published', 'archived')
    )
    or
    (
      v_block.lifecycle_status = 'published'
      and p_next_status in ('approved', 'archived')
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

      when v_block.lifecycle_status = 'approved'
        and p_next_status = 'review'
        then 'returned_to_review'

      when v_block.lifecycle_status = 'review'
        and p_next_status = 'approved'
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
