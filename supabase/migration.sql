-- GreenThread schema: brands + products with public read access.
create table if not exists public.brands (
  slug text primary key,
  name text not null,
  website text not null,
  ethics_summary text not null default '',
  certifications text[] not null default '{}',
  ethics_modifier int not null default 0
);

create table if not exists public.products (
  id text primary key,
  brand_slug text not null references public.brands(slug) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null,
  gender text not null default 'unisex',
  price numeric not null,
  currency text not null default 'INR',
  retailer text not null default '',
  buy_url text not null default '',
  image_url text not null default '',
  color text not null default '',
  fabric_composition jsonb not null default '[]',
  sustainability jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- UK-market columns (idempotent for existing deployments)
alter table public.products add column if not exists sizes text[] not null default '{}';
alter table public.products add column if not exists color_family text not null default '';
alter table public.products add column if not exists fit text not null default 'Regular';
alter table public.products add column if not exists source text not null default 'generated';

-- lightweight behavioural events: searches, out-clicks (CRO + affiliate proof)
create table if not exists public.events (
  id bigint generated always as identity primary key,
  type text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
drop policy if exists "anon insert events" on public.events;
create policy "anon insert events" on public.events for insert with check (true);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_brand_idx on public.products (brand_slug);

alter table public.brands enable row level security;
alter table public.products enable row level security;

drop policy if exists "public read brands" on public.brands;
create policy "public read brands" on public.brands for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);
