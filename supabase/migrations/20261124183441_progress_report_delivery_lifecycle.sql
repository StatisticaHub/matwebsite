alter table public.progress_reports
  add column if not exists published_at timestamptz,
  add column if not exists student_notified_at timestamptz,
  add column if not exists first_viewed_at timestamptz,
  add column if not exists last_viewed_at timestamptz,
  add column if not exists view_count integer not null default 0;

create index if not exists progress_reports_student_delivery_idx
  on public.progress_reports (
    student_id,
    student_visible,
    first_viewed_at
  );
