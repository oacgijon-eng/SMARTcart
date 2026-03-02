-- Create table for linking Equipment to Techniques
CREATE TABLE IF NOT EXISTS technique_equipment (
  technique_id TEXT NOT NULL REFERENCES techniques(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (technique_id, equipment_id)
);

-- Add comment
COMMENT ON TABLE technique_equipment IS 'Links Equipment to Techniques with quantity';

-- Enable RLS
ALTER TABLE technique_equipment ENABLE ROW LEVEL SECURITY;

-- Add policies allowing ANON users to Edit (required for current Admin setup)
CREATE POLICY "Enable read access for anon users" ON technique_equipment
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Enable insert access for anon users" ON technique_equipment
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "Enable delete access for anon users" ON technique_equipment
    FOR DELETE TO anon
    USING (true);
