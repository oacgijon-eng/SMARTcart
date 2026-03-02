
-- 1. Fix ID generation for techniques table (fixes Create)
ALTER TABLE techniques
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Ensure Foreign Keys have ON DELETE CASCADE (fixes Delete/Edit)

-- Drop existing constraints to avoid errors if they exist or are wrong
ALTER TABLE technique_items DROP CONSTRAINT IF EXISTS technique_items_technique_id_fkey;
ALTER TABLE technique_items DROP CONSTRAINT IF EXISTS technique_items_item_id_fkey;

-- Re-add with CASCADE
ALTER TABLE technique_items
  ADD CONSTRAINT technique_items_technique_id_fkey
  FOREIGN KEY (technique_id)
  REFERENCES techniques(id)
  ON DELETE CASCADE;

ALTER TABLE technique_items
  ADD CONSTRAINT technique_items_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;

-- 3. Reload Config (fixes API cache)
NOTIFY pgrst, 'reload config';
