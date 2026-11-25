alter table public.tutoring_leads
add column if not exists is_test boolean not null default false;

comment on column public.tutoring_leads.is_test is
'True for internal, validation, localhost or other non-production tutoring leads that must be excluded from business reporting.';

update public.tutoring_leads
set is_test = true
where id in (
  'ae867d6b-20cd-421b-901f-556e8296fabd',
  '0b850f91-13e7-44c8-97e9-17e1bc4c54d0',
  'c74c2617-0817-4ca9-b2a8-77ab976cb5e3'
);
