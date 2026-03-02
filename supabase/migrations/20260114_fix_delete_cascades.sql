-- Fix locations parent_id cascade
-- First, drop the constraint if it exists (using generic name or probable name)
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_parent_id_fkey;
-- Re-add with CASCADE
ALTER TABLE locations
  ADD CONSTRAINT locations_parent_id_fkey
  FOREIGN KEY (parent_id)
  REFERENCES locations(id)
  ON DELETE CASCADE;

-- Ensure technique_items cascades
ALTER TABLE technique_items DROP CONSTRAINT IF EXISTS technique_items_technique_id_fkey;
ALTER TABLE technique_items
  ADD CONSTRAINT technique_items_technique_id_fkey
  FOREIGN KEY (technique_id)
  REFERENCES techniques(id)
  ON DELETE CASCADE;

ALTER TABLE technique_items DROP CONSTRAINT IF EXISTS technique_items_item_id_fkey;
ALTER TABLE technique_items
  ADD CONSTRAINT technique_items_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;
