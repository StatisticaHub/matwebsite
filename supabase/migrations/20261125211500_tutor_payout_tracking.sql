-- MAT tutor payout tracking
-- Historical sessions default to untracked.

alter table public.tutoring_sessions
  add column if not exists tutor_payout_status text not null default 'untracked',
  add column if not exists tutor_payout_amount numeric(10,2),
  add column if not exists tutor_paid_at timestamp with time zone,
  add column if not exists tutor_payment_method text,
  add column if not exists tutor_payment_reference text,
  add column if not exists tutor_payment_note text;

alter table public.tutoring_sessions
  drop constraint if exists tutoring_sessions_tutor_payout_status_check;

alter table public.tutoring_sessions
  add constraint tutoring_sessions_tutor_payout_status_check
  check (
    tutor_payout_status in (
      'untracked',
      'unpaid',
      'paid',
      'not_applicable'
    )
  );

alter table public.tutoring_sessions
  drop constraint if exists tutoring_sessions_tutor_payout_amount_check;

alter table public.tutoring_sessions
  add constraint tutoring_sessions_tutor_payout_amount_check
  check (
    tutor_payout_amount is null
    or tutor_payout_amount >= 0
  );

comment on column public.tutoring_sessions.tutor_payout_status is
  'Administrative tutor payout state: untracked, unpaid, paid or not_applicable.';

comment on column public.tutoring_sessions.tutor_payout_amount is
  'Actual amount paid to the tutor for this session.';

comment on column public.tutoring_sessions.tutor_paid_at is
  'Timestamp when the tutor payout was made.';

comment on column public.tutoring_sessions.tutor_payment_method is
  'Administrative tutor payout method.';

comment on column public.tutoring_sessions.tutor_payment_reference is
  'Optional tutor payout transaction or transfer reference.';

comment on column public.tutoring_sessions.tutor_payment_note is
  'Optional internal administrative note about the tutor payout.';
