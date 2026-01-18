-- Fix: Restrict profiles table to authenticated users only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Profiles viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);