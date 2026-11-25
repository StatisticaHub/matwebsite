-- MAT actual student payment amount

alter table public.tutoring_sessions
  add column if not exists amount_paid numeric(10,2);

alter table public.tutoring_sessions
  drop constraint if exists tutoring_sessions_amount_paid_check;

alter table public.tutoring_sessions
  add constraint tutoring_sessions_amount_paid_check
  check (
    amount_paid is null
    or amount_paid >= 0
  );

comment on column public.tutoring_sessions.amount_paid is
  'Actual student payment received for this tutoring session.';
