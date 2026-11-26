-- ============================================================
-- MAT Statistics Foundations
-- Outliers analyse-objective alignment v0.1
--
-- Problem
-- -------
-- Question:
--   stats-foundations-outliers-001
--
-- is correctly classified at cognitive level:
--   analyse
--
-- but is currently mapped to the learning objective:
--
--   "Evaluate whether an extreme value should be investigated
--    rather than automatically removed."
--
-- That objective measures a different academic skill.
--
-- This migration:
--
--   1. preserves the existing evaluate objective
--   2. adds a reusable analyse objective to the Outliers concept
--   3. removes only the incorrect mapping for this question
--   4. maps the question to the new analyse objective
--
-- ============================================================

do $$
declare
  v_concept_id uuid;
  v_question_id uuid;
  v_old_objective_id uuid;
  v_new_objective_id uuid;
begin

  -- ----------------------------------------------------------
  -- Resolve canonical Outliers concept
  -- ----------------------------------------------------------

  select id
  into v_concept_id
  from public.academic_concepts
  where slug = 'outliers';

  if v_concept_id is null then
    raise exception
      'Canonical concept "outliers" was not found.';
  end if;


  -- ----------------------------------------------------------
  -- Resolve canonical question
  -- ----------------------------------------------------------

  select id
  into v_question_id
  from public.academic_questions
  where slug = 'stats-foundations-outliers-001';

  if v_question_id is null then
    raise exception
      'Canonical question "stats-foundations-outliers-001" was not found.';
  end if;


  -- ----------------------------------------------------------
  -- Resolve the currently incorrect objective mapping target
  -- ----------------------------------------------------------

  select id
  into v_old_objective_id
  from public.academic_learning_objectives
  where concept_id = v_concept_id
    and objective_type = 'evaluate'
    and objective =
      'Evaluate whether an extreme value should be investigated rather than automatically removed.';

  if v_old_objective_id is null then
    raise exception
      'Expected existing Outliers evaluate objective was not found.';
  end if;


  -- ----------------------------------------------------------
  -- Reuse the analyse objective if it already exists.
  -- Otherwise create it.
  -- ----------------------------------------------------------

  select id
  into v_new_objective_id
  from public.academic_learning_objectives
  where concept_id = v_concept_id
    and objective_type = 'analyse'
    and objective =
      'Analyse how extreme observations influence measures of central tendency and compare the resistance of the mean and median to outliers.';

  if v_new_objective_id is null then

    insert into public.academic_learning_objectives (
      concept_id,
      objective,
      objective_type,
      sort_order
    )
    values (
      v_concept_id,
      'Analyse how extreme observations influence measures of central tendency and compare the resistance of the mean and median to outliers.',
      'analyse',
      30
    )
    returning id
    into v_new_objective_id;

  end if;


  -- ----------------------------------------------------------
  -- Remove only the academically incorrect mapping.
  --
  -- The evaluate objective itself remains canonical and can be
  -- used by future questions that genuinely assess evaluation.
  -- ----------------------------------------------------------

  delete from public.academic_question_objectives
  where question_id = v_question_id
    and learning_objective_id = v_old_objective_id;


  -- ----------------------------------------------------------
  -- Add correct analyse mapping.
  -- ----------------------------------------------------------

  if not exists (
    select 1
    from public.academic_question_objectives
    where question_id = v_question_id
      and learning_objective_id = v_new_objective_id
  ) then

    insert into public.academic_question_objectives (
      question_id,
      learning_objective_id
    )
    values (
      v_question_id,
      v_new_objective_id
    );

  end if;

end
$$;
