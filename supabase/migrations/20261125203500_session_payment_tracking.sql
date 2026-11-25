-- MAT session payment tracking
-- Existing sessions default to 'untracked' so historical records
-- are not incorrectly marked unpaid.

alter table public.tutoring_sessions
  add column if not exists payment_status text not null default 'untracked',
  add column if not exists paid_at timestamp with time zone,
  add column if not exists payment_method text,
  add column if not exists payment_reference text,
  add column if not exists payment_note text;

alter table public.tutoring_sessions
  drop constraint if exists tutoring_sessions_payment_status_check;

alter table public.tutoring_sessions
  add constraint tutoring_sessions_payment_status_check
  check (
    payment_status in (
      'untracked',
      'unpaid',
      'paid',
      'waived'
    )
  );

comment on column public.tutoring_sessions.payment_status is
  'Administrative payment state: untracked, unpaid, paid or waived.';

comment on column public.tutoring_sessions.paid_at is
  'Timestamp when student payment was received.';

comment on column public.tutoring_sessions.payment_method is
  'Administrative payment method, for example bank_transfer, card, cash or other.';

comment on column public.tutoring_sessions.payment_reference is
  'Optional external payment or transfer reference.';

comment on column public.tutoring_sessions.payment_note is
  'Optional internal administrative payment note.';
