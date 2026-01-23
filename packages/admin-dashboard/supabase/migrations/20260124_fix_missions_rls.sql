-- Migration: Fix missions table RLS to allow creation from admin dashboard
-- Run this in Supabase SQL Editor

-- The admin dashboard uses the anon key, so we need to allow 
-- authenticated/service_role users to manage missions

-- Drop any problematic policies
DROP POLICY IF EXISTS "missions_admin_manage" ON public.missions;
DROP POLICY IF EXISTS "missions_service_role" ON public.missions;

-- Create policy for service role to have full access
CREATE POLICY "missions_service_role_all" 
ON public.missions 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Create policy to allow insert/update/delete for authenticated users
-- (Admin dashboard authenticated users)
CREATE POLICY "missions_authenticated_manage" 
ON public.missions 
FOR ALL 
TO authenticated
USING (true) 
WITH CHECK (true);

-- Also allow anon to manage (for admin dashboard using anon key)
-- This is temporary - ideally admin should authenticate
CREATE POLICY "missions_anon_manage" 
ON public.missions 
FOR ALL 
TO anon
USING (true) 
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;

-- Check policies exist
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'missions' AND schemaname = 'public';
    
    RAISE NOTICE 'Total policies on missions table: %', policy_count;
END
$$;
