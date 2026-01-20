
-- Create Incidents Table
CREATE TABLE IF NOT EXISTS incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('INCIDENCE', 'RATING', 'SUGGESTION')),
  category text,
  description text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  related_item_id text REFERENCES items(id) ON DELETE SET NULL,
  related_technique_id text REFERENCES techniques(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  status text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'DISMISSED'))
);

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all access (since we are using anon key for everything in this demo)
-- Ideally this would be authenticated only, but preventing friction for now.
CREATE POLICY "Allow all access to incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
