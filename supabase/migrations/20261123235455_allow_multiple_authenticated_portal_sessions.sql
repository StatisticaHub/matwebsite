drop index if exists public.student_portal_one_active_authenticated_session_idx;

create index if not exists student_portal_active_authenticated_session_idx
on public.student_portal_links(student_id, expires_at)
where
  revoked_at is null
  and access_kind = 'authenticated_session';
