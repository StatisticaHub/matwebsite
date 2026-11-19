create table if not exists public.content_growth_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  path text unique,
  title text not null,
  category text,
  content_type text not null default 'guide' check (content_type in ('guide','topic_hub','tutoring','subject','core','other')),
  stage text not null default 'idea' check (stage in ('idea','draft','published','refresh','consolidate')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  search_intent text not null default 'informational' check (search_intent in ('informational','commercial','transactional','navigational')),
  target_query text,
  indexing_status text not null default 'unknown' check (indexing_status in ('unknown','indexed','not_indexed','requested','blocked')),
  last_inspected_at timestamptz,
  published_at date,
  last_updated_at date,
  next_review_at date,
  notes text
);

create index if not exists content_growth_items_stage_idx on public.content_growth_items(stage);
create index if not exists content_growth_items_priority_idx on public.content_growth_items(priority);
create index if not exists content_growth_items_review_idx on public.content_growth_items(next_review_at);
create index if not exists content_growth_items_indexing_idx on public.content_growth_items(indexing_status);

create table if not exists public.content_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  content_item_id uuid not null references public.content_growth_items(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  clicks integer not null default 0 check (clicks >= 0),
  impressions integer not null default 0 check (impressions >= 0),
  ctr numeric(8,5) not null default 0 check (ctr >= 0 and ctr <= 1),
  average_position numeric(8,2) check (average_position is null or average_position >= 0),
  source text not null default 'gsc' check (source in ('gsc','manual')),
  unique(content_item_id, period_start, period_end, source)
);

create index if not exists content_performance_item_period_idx
  on public.content_performance_snapshots(content_item_id, period_end desc);

alter table public.content_growth_items enable row level security;
alter table public.content_performance_snapshots enable row level security;

revoke all on table public.content_growth_items from anon, authenticated;
revoke all on table public.content_performance_snapshots from anon, authenticated;

grant select, insert, update, delete on table public.content_growth_items to service_role;
grant select, insert, update, delete on table public.content_performance_snapshots to service_role;
