-- Supabase Storage RLS Policies for avatars bucket

-- Make sure avatars bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'avatars';

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar read policy" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create correct policies

-- Public read access for avatars
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "Auth users upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Authenticated users can update avatars
CREATE POLICY "Auth users update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Authenticated users can delete avatars
CREATE POLICY "Auth users delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
