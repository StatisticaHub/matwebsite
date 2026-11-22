-- Connect private student/tutor files to the assignment they belong to.
alter table public.learning_materials
  add column if not exists homework_id uuid
  references public.homework(id)
  on delete set null;

create index if not exists learning_materials_homework_id_idx
  on public.learning_materials(homework_id);
