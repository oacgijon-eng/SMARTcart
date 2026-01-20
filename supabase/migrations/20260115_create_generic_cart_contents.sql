-- Create a generic table to store items for any dynamic cart (Location Type: 'CART')
-- This replaces the need for creating separate tables for each new cart.

create table if not exists cart_contents (
  id uuid primary key default gen_random_uuid(),
  
  -- The cart this item belongs to (e.g., "Carro de Anestesia" location ID)
  location_id uuid references locations(id) on delete cascade not null,
  
  -- The item being stored
  item_id text references items(id) on delete cascade not null,
  
  -- Stock management
  stock_ideal integer default 0,
  next_expiry_date date,
  
  created_at timestamptz default now(),
  
  -- Prevent duplicate entries for the same item in the same cart
  unique(location_id, item_id)
);

-- Enable Row Level Security
alter table cart_contents enable row level security;

-- Policies (Public access for simplicity, matching existing pattern)
create policy "Public read access" on cart_contents for select using (true);
create policy "Public insert access" on cart_contents for insert with check (true);
create policy "Public update access" on cart_contents for update using (true);
create policy "Public delete access" on cart_contents for delete using (true);
