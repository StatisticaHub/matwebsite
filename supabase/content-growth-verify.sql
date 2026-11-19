select
  'content_growth_items' as check_name,
  to_regclass('public.content_growth_items') is not null as installed,
  coalesce((select relrowsecurity from pg_class where oid = 'public.content_growth_items'::regclass), false) as rls_enabled
union all
select
  'content_performance_snapshots',
  to_regclass('public.content_performance_snapshots') is not null,
  coalesce((select relrowsecurity from pg_class where oid = 'public.content_performance_snapshots'::regclass), false)
union all
select
  'service_role_items_grant',
  has_table_privilege('service_role','public.content_growth_items','SELECT,INSERT,UPDATE,DELETE'),
  true
union all
select
  'service_role_snapshots_grant',
  has_table_privilege('service_role','public.content_performance_snapshots','SELECT,INSERT,UPDATE,DELETE'),
  true;
