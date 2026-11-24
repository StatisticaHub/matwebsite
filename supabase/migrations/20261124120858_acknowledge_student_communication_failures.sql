alter table public.student_communications
  add column if not exists failure_acknowledged_at timestamptz,
  add column if not exists failure_acknowledged_by_email text,
  add column if not exists failure_acknowledgement_note text;

create index if not exists student_communications_unacknowledged_failures_idx
  on public.student_communications (created_at desc)
  where status = 'failed'
    and failure_acknowledged_at is null;
