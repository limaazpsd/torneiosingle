-- Create RLS policies for team-logos bucket
-- Note: We create these policies using a function approach to avoid direct schema modification

-- Policy: Anyone can view team logos (public bucket)
CREATE POLICY "Team logos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-logos');

-- Policy: Authenticated users can upload their own team logos
CREATE POLICY "Users can upload team logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own team logos
CREATE POLICY "Users can update their own team logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'team-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own team logos
CREATE POLICY "Users can delete their own team logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);