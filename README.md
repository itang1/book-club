create table if not exists public.friends (
  id text primary key,
  name text not null,
  city text not null,
  state text not null,
  status text not null default 'waiting' check (status in ('waiting', 'reading', 'done')),
  address text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id text primary key,
  title text not null,
  author text not null,
  cover_color text not null,
  status text not null default 'in-transit' check (status in ('in-transit', 'reading', 'returned', 'annotated')),
  current_owner text not null,
  next_stop text not null,
  last_updated text not null,
  notes_count integer not null default 0,
  tracking_number text,
  friends jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references public.books(id) on delete cascade,
  friend_id text,
  page_number integer,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  book_id text not null references public.books(id) on delete cascade,
  tracking_number text not null,
  from_name text not null,
  to_name text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.friends enable row level security;
alter table public.books enable row level security;
alter table public.annotations enable row level security;
alter table public.shipments enable row level security;

create policy "Friends are viewable by anyone" on public.friends
for select using (true);

create policy "Books are viewable by anyone" on public.books
for select using (true);

create policy "Annotations are viewable by anyone" on public.annotations
for select using (true);

create policy "Shipments are viewable by anyone" on public.shipments
for select using (true);

create policy "Friends can be inserted by anyone" on public.friends
for insert with check (true);

create policy "Books can be inserted by anyone" on public.books
for insert with check (true);

create policy "Annotations can be inserted by anyone" on public.annotations
for insert with check (true);

create policy "Shipments can be inserted by anyone" on public.shipments
for insert with check (true);
