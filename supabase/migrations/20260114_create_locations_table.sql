create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('CART', 'WAREHOUSE', 'EXTERNAL')),
  created_at timestamptz default now()
);

alter table locations enable row level security;

create policy "Enable read access for all users" on locations for select using (true);
create policy "Enable insert access for all users" on locations for insert with check (true);
create policy "Enable delete access for all users" on locations for delete using (true);
