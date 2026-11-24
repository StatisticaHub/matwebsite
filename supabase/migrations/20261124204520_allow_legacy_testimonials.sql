alter table public.testimonials
  alter column student_id drop not null,
  alter column engagement_id drop not null,
  alter column tutor_id drop not null;
