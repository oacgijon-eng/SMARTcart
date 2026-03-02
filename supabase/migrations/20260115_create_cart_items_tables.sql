-- Create tables for each cart type to store their specific items and stock

-- 1. Carro de Técnicas Items
create table cart_techniques_items (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade not null,
  item_id text references items(id) on delete cascade not null,
  stock_ideal integer default 0,
  created_at timestamptz default now(),
  unique(location_id, item_id) -- Prevent duplicate item in same drawer
);

-- 2. Carro de Curas Items
create table cart_cures_items (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade not null,
  item_id text references items(id) on delete cascade not null,
  stock_ideal integer default 0,
  created_at timestamptz default now(),
  unique(location_id, item_id)
);

-- 3. Carro de Paradas Items
create table cart_crash_items (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete cascade not null,
  item_id text references items(id) on delete cascade not null,
  stock_ideal integer default 0,
  created_at timestamptz default now(),
  unique(location_id, item_id)
);

-- Enable RLS
alter table cart_techniques_items enable row level security;
alter table cart_cures_items enable row level security;
alter table cart_crash_items enable row level security;

-- Policies (Public access for prototype simplicity, similar to existing tables)
create policy "Public read access" on cart_techniques_items for select using (true);
create policy "Public insert access" on cart_techniques_items for insert with check (true);
create policy "Public update access" on cart_techniques_items for update using (true);
create policy "Public delete access" on cart_techniques_items for delete using (true);

create policy "Public read access" on cart_cures_items for select using (true);
create policy "Public insert access" on cart_cures_items for insert with check (true);
create policy "Public update access" on cart_cures_items for update using (true);
create policy "Public delete access" on cart_cures_items for delete using (true);

create policy "Public read access" on cart_crash_items for select using (true);
create policy "Public insert access" on cart_crash_items for insert with check (true);
create policy "Public update access" on cart_crash_items for update using (true);
create policy "Public delete access" on cart_crash_items for delete using (true);
