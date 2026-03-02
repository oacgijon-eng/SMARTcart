-- Enable RLS on logistics tables
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

-- Create convenient policies for Authenticated Users (Base Security)
-- This ensures that anonymous users cannot access these tables, enforcing the login requirement.
-- Future refinement: Restrict access based on 'profiles.unit_id' if strict user-unit binding is implemented.

-- Locations
DROP POLICY IF EXISTS "Authenticated users can manage locations" ON locations;
CREATE POLICY "Authenticated users can manage locations" ON locations
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Equipment
DROP POLICY IF EXISTS "Authenticated users can manage equipment" ON equipment;
CREATE POLICY "Authenticated users can manage equipment" ON equipment
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Stock Revisions
DROP POLICY IF EXISTS "Authenticated users can manage stock_revisions" ON stock_revisions;
CREATE POLICY "Authenticated users can manage stock_revisions" ON stock_revisions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Incidents
DROP POLICY IF EXISTS "Authenticated users can manage incidents" ON incidents;
CREATE POLICY "Authenticated users can manage incidents" ON incidents
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Feedbacks
DROP POLICY IF EXISTS "Authenticated users can manage feedbacks" ON feedbacks;
CREATE POLICY "Authenticated users can manage feedbacks" ON feedbacks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
