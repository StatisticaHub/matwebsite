-- ============================================================
-- MAT Academic Question Quality Gate v0.1
--
-- Purpose
-- -------
-- Establish one canonical, reusable definition of whether an
-- academic question is ready for approval / publication.
--
-- This quality gate is deliberately enforced in PostgreSQL,
-- not merely in the Admin UI, so that:
--
--   * Admin actions
--   * future AI authoring
--   * future bulk imports
--   * internal scripts
--   * future Academy / assessment tooling
--
-- all use the same academic quality standard.
--
--
-- The gate validates:
--
-- QUESTION METADATA
--   - title
--   - prompt
--   - source / provenance
--   - marks
--   - estimated completion time
--
-- KNOWLEDGE GRAPH
--   - at least one concept
--   - exactly one primary concept
--   - at least one learning objective
--   - objective must belong to a mapped concept
--
-- PEDAGOGY
--   - at least one progressive hint
--   - hint levels must be unique and contiguous from 1
--
-- SOLUTION QUALITY
--   - exactly one canonical solution
--   - worked reasoning
--   - marking guidance
--   - common-error guidance
--   - final answer where appropriate
--
-- RESPONSE DESIGN
--   - MCQ: >= 2 options, exactly 1 correct
--   - True/False: exactly 2 options, exactly 1 correct
--   - option text / keys must be nonblank
--   - option explanations required for option-based questions
--
-- WARNINGS
--   - cognitive level not represented by mapped objective
--   - MCQ has fewer than four options
--   - options exist on a non-option-based question type
--
-- Approval and publication are blocked if any hard error exists.
-- ============================================================


-- ============================================================
-- 1. CANONICAL QUESTION QUALITY REPORT
-- ============================================================

create or replace function public.mat_academic_question_quality_report(
  p_question_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_question public.academic_questions%rowtype;

  v_errors text[] := array[]::text[];
  v_warnings text[] := array[]::text[];

  -- Concept checks
  v_concept_count integer := 0;
  v_primary_concept_count integer := 0;

  -- Objective checks
  v_objective_count integer := 0;
  v_invalid_objective_count integer := 0;
  v_matching_cognitive_objective_count integer := 0;

  -- Hint checks
  v_hint_count integer := 0;
  v_hint_distinct_level_count integer := 0;
  v_hint_min_level integer;
  v_hint_max_level integer;
  v_blank_hint_count integer := 0;

  -- Option checks
  v_option_count integer := 0;
  v_correct_option_count integer := 0;
  v_blank_option_count integer := 0;
  v_missing_option_explanation_count integer := 0;

  -- Solution checks
  v_solution_count integer := 0;
  v_solution_text_count integer := 0;
  v_final_answer_count integer := 0;
  v_marking_guidance_count integer := 0;
  v_common_errors_count integer := 0;

  v_hint_levels_valid boolean := false;
  v_ready boolean := false;
begin

  -- ----------------------------------------------------------
  -- Load canonical question
  -- ----------------------------------------------------------

  select *
  into v_question
  from public.academic_questions
  where id = p_question_id;

  if not found then
    raise exception 'Academic question not found.';
  end if;


  -- ==========================================================
  -- 2. CORE QUESTION METADATA
  -- ==========================================================

  if nullif(
    btrim(
      coalesce(v_question.title, '')
    ),
    ''
  ) is null then
    v_errors := array_append(
      v_errors,
      'Question title is required.'
    );
  end if;


  if nullif(
    btrim(
      coalesce(v_question.prompt, '')
    ),
    ''
  ) is null then
    v_errors := array_append(
      v_errors,
      'Question prompt is required.'
    );
  end if;


  if nullif(
    btrim(
      coalesce(v_question.source_note, '')
    ),
    ''
  ) is null then
    v_errors := array_append(
      v_errors,
      'Source / provenance note is required.'
    );
  end if;


  if v_question.marks is null
     or v_question.marks <= 0 then

    v_errors := array_append(
      v_errors,
      'A positive mark value is required.'
    );

  end if;


  if v_question.estimated_minutes is null
     or v_question.estimated_minutes <= 0 then

    v_errors := array_append(
      v_errors,
      'A positive estimated completion time is required.'
    );

  end if;


  -- ==========================================================
  -- 3. KNOWLEDGE GRAPH / CONCEPT MAPPING
  -- ==========================================================

  select
    count(*)::integer,
    count(*) filter (
      where is_primary = true
    )::integer

  into
    v_concept_count,
    v_primary_concept_count

  from public.academic_question_concepts
  where question_id = p_question_id;


  if v_concept_count < 1 then

    v_errors := array_append(
      v_errors,
      'At least one canonical concept mapping is required.'
    );

  end if;


  if v_primary_concept_count <> 1 then

    v_errors := array_append(
      v_errors,
      format(
        'Exactly one primary concept is required; found %s.',
        v_primary_concept_count
      )
    );

  end if;


  -- ==========================================================
  -- 4. LEARNING OBJECTIVE MAPPING
  -- ==========================================================

  select
    count(*)::integer,

    count(*) filter (
      where alo.objective_type =
        v_question.cognitive_level
    )::integer,

    count(*) filter (
      where not exists (
        select 1
        from public.academic_question_concepts aqc
        where aqc.question_id = p_question_id
          and aqc.concept_id = alo.concept_id
      )
    )::integer

  into
    v_objective_count,
    v_matching_cognitive_objective_count,
    v_invalid_objective_count

  from public.academic_question_objectives aqo

  join public.academic_learning_objectives alo
    on alo.id = aqo.learning_objective_id

  where aqo.question_id = p_question_id;


  if v_objective_count < 1 then

    v_errors := array_append(
      v_errors,
      'At least one learning objective mapping is required.'
    );

  end if;


  if v_invalid_objective_count > 0 then

    v_errors := array_append(
      v_errors,
      format(
        '%s mapped learning objective(s) belong to concepts that are not mapped to this question.',
        v_invalid_objective_count
      )
    );

  end if;


  if v_objective_count > 0
     and v_matching_cognitive_objective_count = 0 then

    v_warnings := array_append(
      v_warnings,
      format(
        'No mapped learning objective currently matches the question cognitive level "%s".',
        v_question.cognitive_level
      )
    );

  end if;


  -- ==========================================================
  -- 5. PROGRESSIVE HINT QUALITY
  -- ==========================================================

  select
    count(*)::integer,

    count(
      distinct hint_level
    )::integer,

    min(hint_level),

    max(hint_level),

    count(*) filter (
      where nullif(
        btrim(
          coalesce(hint_text, '')
        ),
        ''
      ) is null
    )::integer

  into
    v_hint_count,
    v_hint_distinct_level_count,
    v_hint_min_level,
    v_hint_max_level,
    v_blank_hint_count

  from public.academic_question_hints
  where question_id = p_question_id;


  if v_hint_count < 1 then

    v_errors := array_append(
      v_errors,
      'At least one progressive hint is required.'
    );

  end if;


  if v_blank_hint_count > 0 then

    v_errors := array_append(
      v_errors,
      format(
        '%s hint(s) contain blank text.',
        v_blank_hint_count
      )
    );

  end if;


  v_hint_levels_valid :=
    v_hint_count > 0
    and v_hint_distinct_level_count = v_hint_count
    and v_hint_min_level = 1
    and v_hint_max_level = v_hint_count;


  if v_hint_count > 0
     and not v_hint_levels_valid then

    v_errors := array_append(
      v_errors,
      'Hint levels must be unique and contiguous starting at level 1.'
    );

  end if;


  -- ==========================================================
  -- 6. ANSWER OPTION QUALITY
  -- ==========================================================

  select
    count(*)::integer,

    count(*) filter (
      where is_correct = true
    )::integer,

    count(*) filter (
      where
        nullif(
          btrim(
            coalesce(option_key, '')
          ),
          ''
        ) is null

        or

        nullif(
          btrim(
            coalesce(option_text, '')
          ),
          ''
        ) is null
    )::integer,

    count(*) filter (
      where nullif(
        btrim(
          coalesce(explanation, '')
        ),
        ''
      ) is null
    )::integer

  into
    v_option_count,
    v_correct_option_count,
    v_blank_option_count,
    v_missing_option_explanation_count

  from public.academic_question_options
  where question_id = p_question_id;


  -- ----------------------------------------------------------
  -- Multiple choice rules
  -- ----------------------------------------------------------

  if v_question.question_type = 'multiple_choice' then

    if v_option_count < 2 then

      v_errors := array_append(
        v_errors,
        'Multiple-choice questions require at least two answer options.'
      );

    end if;


    if v_correct_option_count <> 1 then

      v_errors := array_append(
        v_errors,
        format(
          'Multiple-choice questions require exactly one correct option; found %s.',
          v_correct_option_count
        )
      );

    end if;


    if v_blank_option_count > 0 then

      v_errors := array_append(
        v_errors,
        format(
          '%s multiple-choice option(s) contain a blank key or answer.',
          v_blank_option_count
        )
      );

    end if;


    if v_missing_option_explanation_count > 0 then

      v_errors := array_append(
        v_errors,
        format(
          '%s multiple-choice option(s) are missing pedagogical explanations.',
          v_missing_option_explanation_count
        )
      );

    end if;


    if v_option_count >= 2
       and v_option_count < 4 then

      v_warnings := array_append(
        v_warnings,
        format(
          'This multiple-choice question has only %s options. Four well-designed options are generally preferable when academically appropriate.',
          v_option_count
        )
      );

    end if;

  end if;


  -- ----------------------------------------------------------
  -- True / False rules
  -- ----------------------------------------------------------

  if v_question.question_type = 'true_false' then

    if v_option_count <> 2 then

      v_errors := array_append(
        v_errors,
        format(
          'True/false questions require exactly two options; found %s.',
          v_option_count
        )
      );

    end if;


    if v_correct_option_count <> 1 then

      v_errors := array_append(
        v_errors,
        format(
          'True/false questions require exactly one correct option; found %s.',
          v_correct_option_count
        )
      );

    end if;


    if v_blank_option_count > 0 then

      v_errors := array_append(
        v_errors,
        format(
          '%s true/false option(s) contain a blank key or answer.',
          v_blank_option_count
        )
      );

    end if;


    if v_missing_option_explanation_count > 0 then

      v_errors := array_append(
        v_errors,
        format(
          '%s true/false option(s) are missing pedagogical explanations.',
          v_missing_option_explanation_count
        )
      );

    end if;

  end if;


  -- ----------------------------------------------------------
  -- Non-option question warning
  -- ----------------------------------------------------------

  if v_question.question_type not in (
    'multiple_choice',
    'true_false'
  )
  and v_option_count > 0 then

    v_warnings := array_append(
      v_warnings,
      format(
        'This "%s" question contains %s answer option record(s), although this question type is not option-based.',
        v_question.question_type,
        v_option_count
      )
    );

  end if;


  -- ==========================================================
  -- 7. CANONICAL SOLUTION QUALITY
  -- ==========================================================

  select
    count(*)::integer,

    count(*) filter (
      where nullif(
        btrim(
          coalesce(solution_text, '')
        ),
        ''
      ) is not null
    )::integer,

    count(*) filter (
      where nullif(
        btrim(
          coalesce(final_answer, '')
        ),
        ''
      ) is not null
    )::integer,

    count(*) filter (
      where nullif(
        btrim(
          coalesce(marking_guidance, '')
        ),
        ''
      ) is not null
    )::integer,

    count(*) filter (
      where nullif(
        btrim(
          coalesce(common_errors, '')
        ),
        ''
      ) is not null
    )::integer

  into
    v_solution_count,
    v_solution_text_count,
    v_final_answer_count,
    v_marking_guidance_count,
    v_common_errors_count

  from public.academic_question_solutions
  where question_id = p_question_id;


  if v_solution_count <> 1 then

    v_errors := array_append(
      v_errors,
      format(
        'Exactly one canonical solution is required; found %s.',
        v_solution_count
      )
    );

  end if;


  if v_solution_text_count <> 1 then

    v_errors := array_append(
      v_errors,
      'A complete worked solution / reasoning explanation is required.'
    );

  end if;


  if v_marking_guidance_count <> 1 then

    v_errors := array_append(
      v_errors,
      'Canonical marking guidance is required.'
    );

  end if;


  if v_common_errors_count <> 1 then

    v_errors := array_append(
      v_errors,
      'Common-error guidance is required.'
    );

  end if;


  -- ----------------------------------------------------------
  -- Question types that require a concrete final answer
  -- ----------------------------------------------------------

  if v_question.question_type in (
    'multiple_choice',
    'true_false',
    'short_answer',
    'numeric',
    'calculation'
  )
  and v_final_answer_count <> 1 then

    v_errors := array_append(
      v_errors,
      format(
        'Question type "%s" requires a canonical final answer.',
        v_question.question_type
      )
    );

  end if;


  -- ==========================================================
  -- 8. FINAL READINESS RESULT
  -- ==========================================================

  v_ready := cardinality(v_errors) = 0;


  return jsonb_build_object(

    'question_id',
    v_question.id,

    'slug',
    v_question.slug,

    'lifecycle_status',
    v_question.lifecycle_status,

    'question_type',
    v_question.question_type,

    'cognitive_level',
    v_question.cognitive_level,

    'ready',
    v_ready,

    'error_count',
    cardinality(v_errors),

    'warning_count',
    cardinality(v_warnings),

    'errors',
    to_jsonb(v_errors),

    'warnings',
    to_jsonb(v_warnings),

    'checks',
    jsonb_build_object(

      'title_present',
      nullif(
        btrim(
          coalesce(v_question.title, '')
        ),
        ''
      ) is not null,

      'prompt_present',
      nullif(
        btrim(
          coalesce(v_question.prompt, '')
        ),
        ''
      ) is not null,

      'source_note_present',
      nullif(
        btrim(
          coalesce(v_question.source_note, '')
        ),
        ''
      ) is not null,

      'marks',
      v_question.marks,

      'estimated_minutes',
      v_question.estimated_minutes,

      'concept_count',
      v_concept_count,

      'primary_concept_count',
      v_primary_concept_count,

      'objective_count',
      v_objective_count,

      'invalid_objective_mapping_count',
      v_invalid_objective_count,

      'matching_cognitive_objective_count',
      v_matching_cognitive_objective_count,

      'hint_count',
      v_hint_count,

      'hint_levels_valid',
      v_hint_levels_valid,

      'blank_hint_count',
      v_blank_hint_count,

      'option_count',
      v_option_count,

      'correct_option_count',
      v_correct_option_count,

      'blank_option_count',
      v_blank_option_count,

      'missing_option_explanation_count',
      v_missing_option_explanation_count,

      'solution_count',
      v_solution_count,

      'solution_text_present',
      v_solution_text_count = 1,

      'final_answer_present',
      v_final_answer_count = 1,

      'marking_guidance_present',
      v_marking_guidance_count = 1,

      'common_errors_present',
      v_common_errors_count = 1

    )

  );

end;
$$;


comment on function
  public.mat_academic_question_quality_report(uuid)
is
  'Returns the canonical MAT academic-quality readiness report for a question, including blocking errors, non-blocking warnings and detailed completeness checks.';


-- ============================================================
-- 9. REPLACE LIFECYCLE FUNCTION WITH QUALITY GATE
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

  v_quality jsonb;
begin

  if nullif(
    btrim(
      coalesce(p_reviewer_email, '')
    ),
    ''
  ) is null then

    raise exception
      'Reviewer email is required.';

  end if;


  if p_next_status not in (
    'draft',
    'review',
    'approved',
    'published',
    'archived'
  ) then

    raise exception
      'Invalid lifecycle status.';

  end if;


  select *
  into v_existing
  from public.academic_questions
  where id = p_question_id
  for update;


  if not found then

    raise exception
      'Academic question not found.';

  end if;


  -- ==========================================================
  -- 10. LIFECYCLE TRANSITION VALIDATION
  -- ==========================================================

  if not (

    (
      v_existing.lifecycle_status = 'draft'
      and p_next_status in (
        'review',
        'archived'
      )
    )

    or

    (
      v_existing.lifecycle_status = 'review'
      and p_next_status in (
        'draft',
        'approved',
        'archived'
      )
    )

    or

    (
      v_existing.lifecycle_status = 'approved'
      and p_next_status in (
        'review',
        'published',
        'archived'
      )
    )

    or

    (
      v_existing.lifecycle_status = 'published'
      and p_next_status in (
        'approved',
        'archived'
      )
    )

    or

    (
      v_existing.lifecycle_status = 'archived'
      and p_next_status = 'draft'
    )

  ) then

    raise exception
      'Invalid academic question lifecycle transition: % -> %',
      v_existing.lifecycle_status,
      p_next_status;

  end if;


  -- ==========================================================
  -- 11. HARD QUALITY GATE
  --
  -- Revalidate both:
  --
  -- review -> approved
  -- approved -> published
  --
  -- Publication is checked again deliberately. This protects
  -- against a question becoming inconsistent after approval.
  -- ==========================================================

  if p_next_status in (
    'approved',
    'published'
  ) then

    select
      public.mat_academic_question_quality_report(
        p_question_id
      )
    into v_quality;


    if coalesce(
      (v_quality ->> 'ready')::boolean,
      false
    ) is not true then

      raise exception
        'Academic question quality gate failed. Blocking issues: %',
        v_quality -> 'errors';

    end if;

  end if;


  -- ==========================================================
  -- 12. STRUCTURED AUDIT EVENT
  -- ==========================================================

  v_event_type :=
    case

      when
        v_existing.lifecycle_status = 'draft'
        and p_next_status = 'review'
      then
        'submitted_for_review'


      when
        v_existing.lifecycle_status = 'review'
        and p_next_status = 'draft'
      then
        'returned_to_draft'


      when
        v_existing.lifecycle_status = 'approved'
        and p_next_status = 'review'
      then
        'returned_to_review'


      when
        v_existing.lifecycle_status = 'review'
        and p_next_status = 'approved'
      then
        'approved'


      when
        p_next_status = 'published'
      then
        'published'


      when
        v_existing.lifecycle_status = 'published'
        and p_next_status = 'approved'
      then
        'unpublished'


      when
        p_next_status = 'archived'
      then
        'archived'


      when
        v_existing.lifecycle_status = 'archived'
        and p_next_status = 'draft'
      then
        'restored'


      else
        'edited'

    end;


  update public.academic_questions
  set
    lifecycle_status = p_next_status,

    reviewed_at =
      case

        when p_next_status = 'approved'
          then now()

        when p_next_status = 'published'
          then coalesce(
            reviewed_at,
            now()
          )

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
    nullif(
      btrim(
        coalesce(p_note, '')
      ),
      ''
    ),
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
-- 13. FUNCTION EXECUTION SECURITY
-- ============================================================

revoke execute on function
  public.mat_academic_question_quality_report(uuid)
from public, anon, authenticated;


grant execute on function
  public.mat_academic_question_quality_report(uuid)
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
-- 14. EXISTING APPROVED/PUBLISHED DATA SAFETY CHECK
--
-- Do not silently introduce the new rule while already-approved
-- questions fail it.
--
-- If any currently approved/published question is incomplete,
-- the migration itself fails rather than normalising bad data.
-- ============================================================

do $$
declare
  v_row record;
  v_report jsonb;
begin

  for v_row in

    select
      id,
      slug,
      lifecycle_status

    from public.academic_questions

    where lifecycle_status in (
      'approved',
      'published'
    )

  loop

    select
      public.mat_academic_question_quality_report(
        v_row.id
      )
    into v_report;


    if coalesce(
      (v_report ->> 'ready')::boolean,
      false
    ) is not true then

      raise exception
        'Existing % question "%" fails the new MAT quality gate: %',
        v_row.lifecycle_status,
        v_row.slug,
        v_report -> 'errors';

    end if;

  end loop;

end
$$;
