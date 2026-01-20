
-- Enable RLS on the table (good security practice)
alter table public.cart_contents enable row level security;

-- Create a policy that allows everything for everyone (since this is a dev/internal tool)
-- This allows the generic 'anon' key to Read, Insert, Update, and Delete.
create policy "Allow all access to cart_contents"
on public.cart_contents
for all
using (true)
with check (true);
