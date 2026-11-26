-- ============================================================
-- MAT Academic Knowledge Engine v0.1
--
-- Canonical academic structure shared eventually by:
-- Learning Hub, Academy, AI Tutor, Labs, human tutoring,
-- assessments and learner mastery records.
-- ============================================================


-- ============================================================
-- SUBJECTS
-- ============================================================

create table if not exists public.academic_subjects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  slug text not null unique,
  name text not null,
  description text,

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

  sort_order integer not null default 0,

  reviewed_at timestamptz,
  review_notes text
);


-- ============================================================
-- DOMAINS
--
-- Example:
-- Statistics
--   ├── Probability
--   ├── Statistical inference
--   ├── Regression
--   └── Survival analysis
-- ============================================================

create table if not exists public.academic_domains (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  subject_id uuid not null
    references public.academic_subjects(id)
    on delete cascade,

  slug text not null,
  name text not null,
  description text,

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

  sort_order integer not null default 0,

  unique(subject_id, slug)
);


-- ============================================================
-- TOPICS
--
-- Example:
-- Domain: Regression
-- Topic: Simple linear regression
-- ============================================================

create table if not exists public.academic_topics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  domain_id uuid not null
    references public.academic_domains(id)
    on delete cascade,

  slug text not null,
  name text not null,
  description text,

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

  sort_order integer not null default 0,

  unique(domain_id, slug)
);


-- ============================================================
-- CONCEPTS
--
-- Smallest canonical teachable academic unit.
-- ============================================================

create table if not exists public.academic_concepts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  topic_id uuid not null
    references public.academic_topics(id)
    on delete cascade,

  slug text not null,
  name text not null,

  summary text,

  difficulty integer
    check (
      difficulty is null
      or difficulty between 1 and 5
    ),

  estimated_learning_minutes integer
    check (
      estimated_learning_minutes is null
      or estimated_learning_minutes > 0
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

  sort_order integer not null default 0,

  reviewed_at timestamptz,
  review_notes text,

  unique(topic_id, slug)
);


-- ============================================================
-- CONCEPT RELATIONSHIPS
--
-- Supports a knowledge graph rather than a flat syllabus.
-- ============================================================

create table if not exists public.academic_concept_relations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  source_concept_id uuid not null
    references public.academic_concepts(id)
    on delete cascade,

  target_concept_id uuid not null
    references public.academic_concepts(id)
    on delete cascade,

  relation_type text not null
    check (
      relation_type in (
        'prerequisite_of',
        'related_to',
        'extends',
        'used_in',
        'contrasts_with'
      )
    ),

  note text,

  check (source_concept_id <> target_concept_id),

  unique(
    source_concept_id,
    target_concept_id,
    relation_type
  )
);


-- ============================================================
-- LEARNING OBJECTIVES
-- ============================================================

create table if not exists public.academic_learning_objectives (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  concept_id uuid not null
    references public.academic_concepts(id)
    on delete cascade,

  objective text not null,

  objective_type text not null default 'understand'
    check (
      objective_type in (
        'remember',
        'understand',
        'apply',
        'analyse',
        'evaluate',
        'create'
      )
    ),

  sort_order integer not null default 0,

  unique(concept_id, objective)
);


-- ============================================================
-- CONTENT BLOCKS
--
-- Structured canonical teaching content.
-- Questions / assessments will be introduced separately once
-- concept structure and editorial workflow are stable.
-- ============================================================

create table if not exists public.academic_content_blocks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  concept_id uuid not null
    references public.academic_concepts(id)
    on delete cascade,

  block_type text not null
    check (
      block_type in (
        'explanation',
        'intuition',
        'derivation',
        'worked_example',
        'misconception',
        'teaching_strategy',
        'summary',
        'note'
      )
    ),

  title text,
  body text not null,

  sort_order integer not null default 0,

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


-- ============================================================
-- BRIDGE EXISTING STUDENT LEARNING PLANS TO CANONICAL CONCEPTS
--
-- Existing free-text topic remains required and untouched.
-- This lets MAT migrate gradually instead of rewriting the
-- operational tutoring system.
-- ============================================================

alter table public.learning_plan_items
  add column if not exists concept_id uuid
  references public.academic_concepts(id)
  on delete set null;


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists academic_domains_subject_idx
  on public.academic_domains(subject_id, sort_order);

create index if not exists academic_topics_domain_idx
  on public.academic_topics(domain_id, sort_order);

create index if not exists academic_concepts_topic_idx
  on public.academic_concepts(topic_id, sort_order);

create index if not exists academic_concepts_status_idx
  on public.academic_concepts(lifecycle_status);

create index if not exists academic_concept_relations_source_idx
  on public.academic_concept_relations(
    source_concept_id,
    relation_type
  );

create index if not exists academic_concept_relations_target_idx
  on public.academic_concept_relations(
    target_concept_id,
    relation_type
  );

create index if not exists academic_objectives_concept_idx
  on public.academic_learning_objectives(
    concept_id,
    sort_order
  );

create index if not exists academic_content_blocks_concept_idx
  on public.academic_content_blocks(
    concept_id,
    block_type,
    sort_order
  );

create index if not exists learning_plan_items_concept_idx
  on public.learning_plan_items(concept_id)
  where concept_id is not null;


-- ============================================================
-- SECURITY
--
-- Knowledge authoring is admin/server-side only in v0.1.
-- No direct browser access is granted.
-- ============================================================

alter table public.academic_subjects
  enable row level security;

alter table public.academic_domains
  enable row level security;

alter table public.academic_topics
  enable row level security;

alter table public.academic_concepts
  enable row level security;

alter table public.academic_concept_relations
  enable row level security;

alter table public.academic_learning_objectives
  enable row level security;

alter table public.academic_content_blocks
  enable row level security;


revoke all on table public.academic_subjects
  from anon, authenticated;

revoke all on table public.academic_domains
  from anon, authenticated;

revoke all on table public.academic_topics
  from anon, authenticated;

revoke all on table public.academic_concepts
  from anon, authenticated;

revoke all on table public.academic_concept_relations
  from anon, authenticated;

revoke all on table public.academic_learning_objectives
  from anon, authenticated;

revoke all on table public.academic_content_blocks
  from anon, authenticated;


grant select, insert, update, delete
  on table public.academic_subjects
  to service_role;

grant select, insert, update, delete
  on table public.academic_domains
  to service_role;

grant select, insert, update, delete
  on table public.academic_topics
  to service_role;

grant select, insert, update, delete
  on table public.academic_concepts
  to service_role;

grant select, insert, update, delete
  on table public.academic_concept_relations
  to service_role;

grant select, insert, update, delete
  on table public.academic_learning_objectives
  to service_role;

grant select, insert, update, delete
  on table public.academic_content_blocks
  to service_role;


-- ============================================================
-- DOCUMENTATION
-- ============================================================

comment on table public.academic_subjects is
  'Top-level subjects in the MAT Academic Knowledge Engine.';

comment on table public.academic_domains is
  'Major academic domains within a subject.';

comment on table public.academic_topics is
  'Structured topics within an academic domain.';

comment on table public.academic_concepts is
  'Canonical teachable concepts used across MAT products.';

comment on table public.academic_concept_relations is
  'Knowledge-graph relationships between canonical concepts.';

comment on table public.academic_learning_objectives is
  'Observable learning objectives attached to canonical concepts.';

comment on table public.academic_content_blocks is
  'Human-reviewed reusable academic content attached to concepts.';

comment on column public.learning_plan_items.concept_id is
  'Optional canonical Knowledge Engine concept linked to this student-specific learning-plan item.';
