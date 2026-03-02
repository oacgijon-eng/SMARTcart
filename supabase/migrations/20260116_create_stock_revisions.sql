-- Create stock_revisions table
CREATE TABLE IF NOT EXISTS stock_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Add RLS policies (simple ones for now, assuming public or authenticated access)
ALTER TABLE stock_revisions ENABLE ROW LEVEL SECURITY;

-- Allow insert for anon/authenticated (depending on app auth, but usually anon for this app based on history)
CREATE POLICY "Enable insert for all users" ON stock_revisions FOR INSERT WITH CHECK (true);

-- Allow select for all users (to see history if needed)
CREATE POLICY "Enable select for all users" ON stock_revisions FOR SELECT USING (true);
