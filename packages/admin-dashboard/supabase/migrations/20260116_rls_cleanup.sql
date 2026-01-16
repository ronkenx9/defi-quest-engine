-- ============================================================================
-- RLS Policy Cleanup Migration
-- Fixes: auth_rls_initplan warnings + multiple_permissive_policies warnings
-- ============================================================================

-- ============================================================================
-- MISSIONS TABLE - Clean up duplicate policies
-- ============================================================================
DO $$
BEGIN
    -- Drop ALL existing policies on missions
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.missions;
    DROP POLICY IF EXISTS "Allow all" ON public.missions;
    DROP POLICY IF EXISTS "Public read access" ON public.missions;
    DROP POLICY IF EXISTS "Anyone can read active missions" ON public.missions;
    DROP POLICY IF EXISTS "Public read missions" ON public.missions;
    DROP POLICY IF EXISTS "Read missions" ON public.missions;
    DROP POLICY IF EXISTS "Read active missions" ON public.missions;
    DROP POLICY IF EXISTS "Authenticated can read all missions" ON public.missions;
    DROP POLICY IF EXISTS "Authenticated users can read missions" ON public.missions;
    DROP POLICY IF EXISTS "Authenticated users can manage missions" ON public.missions;
    DROP POLICY IF EXISTS "Only admins can manage missions" ON public.missions;
    DROP POLICY IF EXISTS "Service role full access" ON public.missions;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Create clean policies for missions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'missions') THEN
        -- Single SELECT policy: Anyone can read
        CREATE POLICY "missions_select" ON public.missions
            FOR SELECT
            USING (true);
        
        -- Single admin policy for INSERT/UPDATE/DELETE using optimized auth call
        CREATE POLICY "missions_admin_manage" ON public.missions
            FOR ALL
            TO authenticated
            USING (public.is_admin((select auth.uid())));
            
        -- Service role bypass
        CREATE POLICY "missions_service_role" ON public.missions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- USER_STATS TABLE - Clean up duplicate policies
-- ============================================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read user_stats" ON public.user_stats;
    DROP POLICY IF EXISTS "Users can read own stats" ON public.user_stats;
    DROP POLICY IF EXISTS "Authenticated users can read user_stats" ON public.user_stats;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
        -- Single SELECT policy: Anyone can read (leaderboard needs this)
        CREATE POLICY "user_stats_select" ON public.user_stats
            FOR SELECT
            USING (true);
        
        -- Users can update own stats (using optimized auth call)
        CREATE POLICY "user_stats_update_own" ON public.user_stats
            FOR UPDATE
            TO authenticated
            USING (wallet_address = (select auth.jwt() ->> 'wallet_address'));
            
        -- Service role can do everything
        CREATE POLICY "user_stats_service_role" ON public.user_stats
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- ACTIVITY_LOG TABLE - Clean up duplicate policies
-- ============================================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can read activity" ON public.activity_log;
    DROP POLICY IF EXISTS "Authenticated users can read activity" ON public.activity_log;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_log') THEN
        -- Single SELECT policy for authenticated users (using optimized auth call)
        CREATE POLICY "activity_log_select" ON public.activity_log
            FOR SELECT
            TO authenticated
            USING (
                wallet_address = (select auth.jwt() ->> 'wallet_address')
                OR public.is_admin((select auth.uid()))
            );
        
        -- Service role can do everything
        CREATE POLICY "activity_log_service_role" ON public.activity_log
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- ADMIN_USERS TABLE - Fix auth_rls_initplan warning
-- ============================================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can read admin_users" ON public.admin_users;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
        -- Optimized policy using (select ...) pattern
        CREATE POLICY "admin_users_select" ON public.admin_users
            FOR SELECT
            TO authenticated
            USING (public.is_admin((select auth.uid())));
        
        -- Service role can do everything
        CREATE POLICY "admin_users_service_role" ON public.admin_users
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- MISSION_PROGRESS TABLE - Clean up duplicate policies
-- ============================================================================
DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can read progress" ON public.mission_progress;
    DROP POLICY IF EXISTS "Users can read own progress" ON public.mission_progress;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_progress') THEN
        -- Single SELECT policy (using optimized auth call)
        CREATE POLICY "mission_progress_select" ON public.mission_progress
            FOR SELECT
            TO authenticated
            USING (
                wallet_address = (select auth.jwt() ->> 'wallet_address')
                OR public.is_admin((select auth.uid()))
            );
        
        -- Users can update own progress
        CREATE POLICY "mission_progress_update" ON public.mission_progress
            FOR UPDATE
            TO authenticated
            USING (wallet_address = (select auth.jwt() ->> 'wallet_address'));
            
        -- Service role can do everything
        CREATE POLICY "mission_progress_service_role" ON public.mission_progress
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- ============================================================================
-- Fix is_admin function with proper search_path (if not already fixed)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE  -- Mark as stable for query optimization
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = check_user_id
    );
EXCEPTION WHEN undefined_table THEN
    RETURN FALSE;
END;
$$;

-- ============================================================================
-- Summary of changes
-- ============================================================================
COMMENT ON SCHEMA public IS 'RLS policies cleaned up. All auth.<function>() calls now use (select auth.<function>()) pattern for query optimization.';
