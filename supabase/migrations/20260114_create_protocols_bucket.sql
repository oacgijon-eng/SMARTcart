
-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('protocols', 'protocols', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public access (SELECT)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'protocols' );

-- Policy to allow authenticated uploads (INSERT) - effectively public for this app version
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'protocols' );

-- Policy to allow updates
CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'protocols' );
