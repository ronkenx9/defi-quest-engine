-- Migration: Fix RLS policy duplicates and secure RPC function
-- Run this in Supabase SQL Editor AFTER the previous migration

-- ============================================
-- FIX 1: Secure the RPC function with immutable search_path
-- ============================================

-- Drop and recreate with proper security settings
DROP FUNCTION IF EXISTS increment_mission_completions(UUID);

CREATE OR REPLACE FUNCTION increment_mission_completions(mission_id UUID)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Immutable search_path for security
AS $$
BEGIN
    UPDATE public.missions 
    SET completions = COALESCE(completions, 0) + 1,
        updated_at = NOW()
    WHERE id = mission_id;
END;
$$;

-- Grant execute to service role only
REVOKE ALL ON FUNCTION increment_mission_completions(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_mission_completions(UUID) TO service_role;

-- ============================================
-- FIX 2: Remove duplicate permissive SELECT policies on mission_progress
-- ============================================

-- Drop the conflicting policies
DROP POLICY IF EXISTS "Users can read own progress" ON public.mission_progress;
DROP POLICY IF EXISTS "mission_progress_select" ON public.mission_progress;

-- Create a single unified SELECT policy
CREATE POLICY "mission_progress_read" 
ON public.mission_progress 
FOR SELECT 
TO authenticated, anon
USING (true);

-- ============================================
-- Verify the fixes
-- ============================================

-- Check function has proper search_path
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'increment_mission_completions'
        AND p.proconfig IS NOT NULL
        AND 'search_path=' = ANY(p.proconfig)
    ) THEN
        RAISE NOTICE 'Warning: Function may not have immutable search_path set correctly';
    ELSE
        RAISE NOTICE 'Function search_path is properly secured';
    END IF;
END
$$;

COMMENT ON FUNCTION increment_mission_completions(UUID) IS 'Securely increments mission completion count. Called by swap API service role.';
