-- Fix RLS policy for team creation
DROP POLICY IF EXISTS "Users can create teams" ON independent_teams;

CREATE POLICY "Users can create teams" 
ON independent_teams 
FOR INSERT 
TO authenticated
WITH CHECK (creator_id = auth.uid());

-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for team logos
CREATE POLICY "Users can upload team logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-logos');

CREATE POLICY "Anyone can view team logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-logos');

CREATE POLICY "Users can delete their team logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add logo_url column to independent_teams
ALTER TABLE independent_teams 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Make emoji optional (since we now have logos)
ALTER TABLE independent_teams 
ALTER COLUMN emoji DROP NOT NULL;

ALTER TABLE independent_teams 
ALTER COLUMN emoji DROP DEFAULT;