
-- Create the generic cart contents table
create table public.cart_contents (
  id uuid default gen_random_uuid() primary key,
  location_id uuid references public.locations(id) on delete cascade not null,
  item_id uuid references public.items(id) on delete cascade not null,
  stock_ideal integer default 0,
  next_expiry_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cart_contents enable row level security;

-- Allow all access policy
create policy "Allow all access to cart_contents"
on public.cart_contents
for all
using (true)
with check (true);
