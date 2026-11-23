alter table public.student_portal_links
add column if not exists access_kind text;

update public.student_portal_links
set access_kind =
  case
    when label = 'Authenticated student login'
      then 'authenticated_session'
    else 'admin_link'
  end
where access_kind is null;

alter table public.student_portal_links
alter column access_kind set default 'admin_link';

alter table public.student_portal_links
alter column access_kind set not null;

alter table public.student_portal_links
drop constraint if exists student_portal_links_access_kind_check;

alter table public.student_portal_links
add constraint student_portal_links_access_kind_check
check (
  access_kind in (
    'admin_link',
    'authenticated_session'
  )
);

drop index if exists public.student_portal_one_active_link_idx;

create unique index if not exists student_portal_one_active_admin_link_idx
on public.student_portal_links(student_id)
where
  revoked_at is null
  and access_kind = 'admin_link';

create unique index if not exists student_portal_one_active_authenticated_session_idx
on public.student_portal_links(student_id)
where
  revoked_at is null
  and access_kind = 'authenticated_session';
