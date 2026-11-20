select 'lead_ga_columns' as check_name,
  count(*) = 3 as installed
from information_schema.columns
where table_schema = 'public'
  and table_name = 'tutoring_leads'
  and column_name in ('ga_client_id','ga_session_id','ga_captured_at')
union all
select 'ga4_log_table', to_regclass('public.ga4_lifecycle_event_log') is not null
union all
select 'ga4_log_rls', coalesce((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relname='ga4_lifecycle_event_log'), false)
union all
select 'service_role_log_grant', has_table_privilege('service_role', 'public.ga4_lifecycle_event_log', 'SELECT,INSERT,UPDATE,DELETE');
