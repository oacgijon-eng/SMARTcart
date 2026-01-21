-- Add unit_id to locations
ALTER TABLE locations 
ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE CASCADE;

-- Add unit_id to equipment
ALTER TABLE equipment 
ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE CASCADE;

-- Add unit_id to stock_revisions
ALTER TABLE stock_revisions 
ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE CASCADE;

-- Add unit_id to incidents
ALTER TABLE incidents 
ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE CASCADE;

-- Add unit_id to feedbacks
ALTER TABLE feedbacks 
ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE CASCADE;

-- Enable RLS on these tables if not already enabled (they should be)
-- We will create a policy function to help with RLS later, for now we want to allow the columns to be populated.

-- IMPORTANT: For existing data, we might have null unit_ids. 
-- Ideally we would backfill this if we knew which unit the data belonged to.
-- Since this is a refactor of a prototype, we can leave them null or default to a "default unit" if one exists.
-- For now, we allow NULL.

-- Create index for performance
CREATE INDEX idx_locations_unit_id ON locations(unit_id);
CREATE INDEX idx_equipment_unit_id ON equipment(unit_id);
CREATE INDEX idx_stock_revisions_unit_id ON stock_revisions(unit_id);
CREATE INDEX idx_incidents_unit_id ON incidents(unit_id);
CREATE INDEX idx_feedbacks_unit_id ON feedbacks(unit_id);
