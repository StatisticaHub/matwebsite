alter table public.tutor_application_references
  add column if not exists request_token uuid not null default gen_random_uuid(),
  add column if not exists request_sent_at timestamptz,
  add column if not exists responded_at timestamptz,
  add column if not exists how_long_known text,
  add column if not exists relationship_context text,
  add column if not exists reliability_rating smallint
    check (reliability_rating between 1 and 5),
  add column if not exists communication_rating smallint
    check (communication_rating between 1 and 5),
  add column if not exists subject_competence_rating smallint
    check (subject_competence_rating between 1 and 5),
  add column if not exists professionalism_rating smallint
    check (professionalism_rating between 1 and 5),
  add column if not exists would_recommend boolean,
  add column if not exists concerns text,
  add column if not exists referee_comments text,
  add column if not exists declaration_confirmed boolean not null default false;

create unique index if not exists
  tutor_application_references_request_token_idx
on public.tutor_application_references(request_token);

alter table public.tutor_application_references
  drop constraint if exists tutor_application_references_status_check;

alter table public.tutor_application_references
  add constraint tutor_application_references_status_check
  check (
    status in (
      'provided',
      'contacted',
      'responded',
      'verified',
      'unresponsive',
      'concern'
    )
  );

comment on column public.tutor_application_references.request_token is
  'Private token used for the referee response link.';

comment on column public.tutor_application_references.responded_at is
  'Time the referee submitted their independent reference response.';
