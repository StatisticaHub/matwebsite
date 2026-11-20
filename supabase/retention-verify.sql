select 'retention_settings' as check_name,
       to_regclass('public.retention_settings') is not null as installed
union all
select 'retention_cases',
       to_regclass('public.retention_cases') is not null
union all
select 'retention_outreach_log',
       to_regclass('public.retention_outreach_log') is not null
union all
select 'settings_seed',
       exists (select 1 from public.retention_settings where id = 1)
union all
select 'rls_enabled',
       coalesce((select bool_and(relrowsecurity)
                 from pg_class
                 where oid in ('public.retention_settings'::regclass,
                               'public.retention_cases'::regclass,
                               'public.retention_outreach_log'::regclass)), false)
union all
select 'service_role_grants',
       has_table_privilege('service_role','public.retention_settings','SELECT')
       and has_table_privilege('service_role','public.retention_cases','SELECT')
       and has_table_privilege('service_role','public.retention_outreach_log','SELECT');
