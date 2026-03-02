ALTER TABLE locations ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES locations(id);
