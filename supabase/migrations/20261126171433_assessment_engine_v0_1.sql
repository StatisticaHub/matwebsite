-- ============================================================
-- MAT Academic Assessment Engine v0.1
--
-- Canonical, reusable academic questions.
--
-- Deliberately separate from operational homework:
--
-- Academic Knowledge Engine
--   -> concepts
--   -> learning objectives
--   -> canonical questions
--        -> concept mappings
--        -> objective mappings
--        -> answer options
--        -> hints
--        -> worked solutions / marking guidance
--
-- Student delivery remains separate:
--   homework
--   homework_submissions
--
-- A later migration can link assigned homework / attempts to
-- canonical questions without mixing learner state into the
-- academic question bank.
-- ============================================================


-- ============================================================
-- 1. CANONICAL QUESTIONS
-- ============================================================

create table if not exists public.academic_questions (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  slug text not null unique,
  title text,
  prompt text not null,

  question_type text not null
    check (
      question_type in (
        'multiple_choice',
        'true_false',
        'short_answer',
        'numeric',
        'calculation',
        'interpretation',
        'proof',
        'code',
        'extended_response'
      )
    ),

  difficulty smallint not null default 3
    check (difficulty between 1 and 5),

  cognitive_level text not null default 'apply'
    check (
      cognitive_level in (
        'remember',
        'understand',
        'apply',
        'analyse',
        'evaluate',
        'create'
      )
    ),

  estimated_minutes integer
    check (
      estimated_minutes is null
      or estimated_minutes > 0
    ),

  marks numeric(7,2)
    check (
      marks is null
      or marks >= 0
    ),

  lifecycle_status text not null default 'draft'
    check (
      lifecycle_status in (
        'draft',
        'review',
        'approved',
        'published',
        'archived'
      )
    ),

  source_note text,
  reviewed_at timestamptz,
  review_notes text
);


create index if not exists academic_questions_lifecycle_idx
  on public.academic_questions(
    lifecycle_status,
    updated_at desc
  );

create index if not exists academic_questions_type_idx
  on public.academic_questions(
    question_type,
    difficulty
  );

create index if not exists academic_questions_cognitive_idx
  on public.academic_questions(
    cognitive_level,
    difficulty
  );


-- ============================================================
-- 2. QUESTION <-> CONCEPT MAPPING
--
-- Questions may test more than one concept.
-- Exactly zero or one mapping may be marked primary.
-- ============================================================

create table if not exists public.academic_question_concepts (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  question_id uuid not null
    references public.academic_questions(id)
    on delete cascade,

  concept_id uuid not null
    references public.academic_concepts(id)
    on delete restrict,

  is_primary boolean not null default false,
  sort_order integer not null default 0,

  unique(question_id, concept_id)
);


create unique index if not exists
  academic_question_one_primary_concept_idx
on public.academic_question_concepts(question_id)
where is_primary = true;


create index if not exists academic_question_concepts_concept_idx
  on public.academic_question_concepts(
    concept_id,
    question_id
  );


-- ============================================================
-- 3. QUESTION <-> LEARNING OBJECTIVE MAPPING
-- ============================================================

create table if not exists public.academic_question_objectives (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  question_id uuid not null
    references public.academic_questions(id)
    on delete cascade,

  learning_objective_id uuid not null
    references public.academic_learning_objectives(id)
    on delete restrict,

  unique(question_id, learning_objective_id)
);


create index if not exists
  academic_question_objectives_objective_idx
on public.academic_question_objectives(
  learning_objective_id,
  question_id
);


-- ============================================================
-- 4. ANSWER OPTIONS
--
-- Used primarily for multiple-choice / true-false questions.
--
-- Correct-answer information remains server/admin only for now.
-- ============================================================

create table if not exists public.academic_question_options (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  question_id uuid not null
    references public.academic_questions(id)
    on delete cascade,

  option_key text not null,
  option_text text not null,

  is_correct boolean not null default false,

  explanation text,

  sort_order integer not null default 0,

  unique(question_id, option_key)
);


create index if not exists academic_question_options_question_idx
  on public.academic_question_options(
    question_id,
    sort_order
  );


-- ============================================================
-- 5. PROGRESSIVE HINTS
-- ============================================================

create table if not exists public.academic_question_hints (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),

  question_id uuid not null
    references public.academic_questions(id)
    on delete cascade,

  hint_text text not null,

  hint_level smallint not null default 1
    check (hint_level > 0),

  sort_order integer not null default 0
);


create unique index if not exists
  academic_question_hints_order_idx
on public.academic_question_hints(
  question_id,
  sort_order
);


-- ============================================================
-- 6. CANONICAL SOLUTION / MARKING GUIDANCE
--
-- One canonical solution record per question in v0.1.
-- This can later evolve into alternative solution methods.
-- ============================================================

create table if not exists public.academic_question_solutions (
  id uuid primary key default gen_random_uuid(),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  question_id uuid not null unique
    references public.academic_questions(id)
    on delete cascade,

  final_answer text,

  solution_text text not null,

  marking_guidance text,

  common_errors text
);


-- ============================================================
-- 7. SECURITY
--
-- Canonical assessment authoring is server/admin only.
-- No anon/authenticated policies yet.
-- ============================================================

alter table public.academic_questions
  enable row level security;

alter table public.academic_question_concepts
  enable row level security;

alter table public.academic_question_objectives
  enable row level security;

alter table public.academic_question_options
  enable row level security;

alter table public.academic_question_hints
  enable row level security;

alter table public.academic_question_solutions
  enable row level security;


revoke all
  on table public.academic_questions
  from anon, authenticated;

revoke all
  on table public.academic_question_concepts
  from anon, authenticated;

revoke all
  on table public.academic_question_objectives
  from anon, authenticated;

revoke all
  on table public.academic_question_options
  from anon, authenticated;

revoke all
  on table public.academic_question_hints
  from anon, authenticated;

revoke all
  on table public.academic_question_solutions
  from anon, authenticated;


grant select, insert, update, delete
  on table public.academic_questions
  to service_role;

grant select, insert, update, delete
  on table public.academic_question_concepts
  to service_role;

grant select, insert, update, delete
  on table public.academic_question_objectives
  to service_role;

grant select, insert, update, delete
  on table public.academic_question_options
  to service_role;

grant select, insert, update, delete
  on table public.academic_question_hints
  to service_role;

grant select, insert, update, delete
  on table public.academic_question_solutions
  to service_role;


-- ============================================================
-- 8. DOCUMENTATION
-- ============================================================

comment on table public.academic_questions is
  'Canonical MAT academic question bank. Questions are reusable across tutoring, assessment, AI teaching and future Academy products.';

comment on table public.academic_question_concepts is
  'Maps canonical academic questions to one or more Knowledge Engine concepts.';

comment on table public.academic_question_objectives is
  'Maps canonical academic questions to explicit Knowledge Engine learning objectives.';

comment on table public.academic_question_options is
  'Answer options and option-level explanations for canonical academic questions.';

comment on table public.academic_question_hints is
  'Progressive hints for canonical academic questions.';

comment on table public.academic_question_solutions is
  'Canonical worked solution, final answer, marking guidance and common-error notes for an academic question.';
