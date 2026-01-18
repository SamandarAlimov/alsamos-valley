-- Remove the redundant role column from profiles table
-- This prevents potential privilege escalation since users can UPDATE their own profile
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;