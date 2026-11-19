select 'lead_nurture_settings' as check_name,
       to_regclass('public.lead_nurture_settings') is not null as installed
union all
select 'lead_nurture_log',
       to_regclass('public.lead_nurture_log') is not null
union all
select 'settings_seed',
       exists(select 1 from public.lead_nurture_settings where id = 1)
union all
select 'lead_columns',
       (select count(*) = 8 from information_schema.columns
        where table_schema = 'public' and table_name = 'tutoring_leads'
          and column_name in (
            'nurture_started_at','nurture_paused','marketing_email_consent',
            'marketing_email_consent_at','marketing_email_consent_source',
            'marketing_email_consent_version','marketing_email_unsubscribed_at',
            'email_preference_token'
          ))
union all
select 'rls_enabled',
       coalesce((select bool_and(c.relrowsecurity)
                 from pg_class c join pg_namespace n on n.oid = c.relnamespace
                 where n.nspname='public' and c.relname in ('lead_nurture_settings','lead_nurture_log')), false);
