-- ============================================================
-- MAT Academic Question Bulk Quality Report v0.1
--
-- Provides one server-side RPC for retrieving the canonical
-- quality report for the complete Question Bank.
--
-- This avoids application-side N+1 network calls such as:
--
--   question 1 -> quality RPC
--   question 2 -> quality RPC
--   question 3 -> quality RPC
--   ...
--
-- Instead:
--
--   Question Bank -> one RPC -> all quality reports
--
-- The canonical quality logic remains in:
--
--   mat_academic_question_quality_report(uuid)
--
-- so there is still exactly one definition of question quality.
-- ============================================================


create or replace function
  public.mat_academic_question_quality_reports()
returns table (
  question_id uuid,
  lifecycle_status text,
  ready boolean,
  error_count integer,
  warning_count integer,
  report jsonb
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    q.id as question_id,

    q.lifecycle_status,

    coalesce(
      (
        public.mat_academic_question_quality_report(q.id)
        ->> 'ready'
      )::boolean,
      false
    ) as ready,

    coalesce(
      (
        public.mat_academic_question_quality_report(q.id)
        ->> 'error_count'
      )::integer,
      0
    ) as error_count,

    coalesce(
      (
        public.mat_academic_question_quality_report(q.id)
        ->> 'warning_count'
      )::integer,
      0
    ) as warning_count,

    public.mat_academic_question_quality_report(q.id)
      as report

  from public.academic_questions q

  order by
    q.updated_at desc,
    q.id;
$$;


comment on function
  public.mat_academic_question_quality_reports()
is
  'Returns MAT academic quality readiness reports for all canonical questions in one server-side request. Intended for the Admin Question Bank quality dashboard.';


-- ============================================================
-- SECURITY
-- ============================================================

revoke execute on function
  public.mat_academic_question_quality_reports()
from public, anon, authenticated;


grant execute on function
  public.mat_academic_question_quality_reports()
to service_role;
