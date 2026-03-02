create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  rating integer,
  issue text,
  comments text,
  technique_id text,
  created_at timestamp with time zone default now()
);

alter table feedbacks enable row level security;

create policy "Public access" on feedbacks for all using (true) with check (true);
