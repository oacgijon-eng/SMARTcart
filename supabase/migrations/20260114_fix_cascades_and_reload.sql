
-- 1. Force Supabase to refresh its schema cache (fixes PGRST204 error)
NOTIFY pgrst, 'reload config';

-- 2. Drop existing keys to ensure we can re-create them cleanly
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_parent_id_fkey;
ALTER TABLE technique_items DROP CONSTRAINT IF EXISTS technique_items_technique_id_fkey;
ALTER TABLE technique_items DROP CONSTRAINT IF EXISTS technique_items_item_id_fkey;

-- 3. Re-Add Foreign Keys with ON DELETE CASCADE

-- Locations: Deleting a parent deletes its children
ALTER TABLE locations
  ADD CONSTRAINT locations_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES locations(id)
  ON DELETE CASCADE;

-- Technique Items: Deleting a technique deletes its item links
ALTER TABLE technique_items
  ADD CONSTRAINT technique_items_technique_id_fkey
  FOREIGN KEY (technique_id)
  REFERENCES techniques(id)
  ON DELETE CASCADE;

-- Technique Items: Deleting an item deletes it from any techniques
ALTER TABLE technique_items
  ADD CONSTRAINT technique_items_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;
