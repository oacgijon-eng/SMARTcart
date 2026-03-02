-- Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    category TEXT NOT NULL, -- e.g., 'Respiradores', 'Bombas of Infusión', 'Ecógrafos'
    stock_quantity INTEGER DEFAULT 0,
    maintenance_status TEXT DEFAULT 'Operativo', -- 'Operativo', 'En Revisión', 'Avariado'
    location TEXT, -- Optional physical location string if not using the full Location system for now
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies (Open access for now as per existing pattern, or authenticated)
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON equipment
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON equipment
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON equipment
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON equipment
    FOR DELETE USING (auth.role() = 'authenticated');

-- Fallback for development (if anon access is used significantly as seen in previous logs)
CREATE POLICY "Enable all access for anon" ON equipment
    FOR ALL USING (true);
