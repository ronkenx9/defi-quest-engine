-- ============================================================================
-- Final RLS Optimization - Fix remaining warnings
-- ============================================================================

-- ============================================================================
-- Fix 1: missions_admin_manage overlaps with missions_select for SELECT
-- Change missions_admin_manage to only cover INSERT/UPDATE/DELETE
-- ============================================================================

DROP POLICY IF EXISTS "missions_admin_manage" ON public.missions;

-- Create separate policies for each action (no SELECT overlap)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'missions') THEN
        CREATE POLICY "missions_admin_insert" ON public.missions
            FOR INSERT
            TO authenticated
            WITH CHECK (public.is_admin((select auth.uid())));
            
        CREATE POLICY "missions_admin_update" ON public.missions
            FOR UPDATE
            TO authenticated
            USING (public.is_admin((select auth.uid())));
            
        CREATE POLICY "missions_admin_delete" ON public.missions
            FOR DELETE
            TO authenticated
            USING (public.is_admin((select auth.uid())));
    END IF;
END $$;

-- ============================================================================
-- Fix 2: user_stats_update_own - wrap auth.jwt() in subquery
-- ============================================================================

DROP POLICY IF EXISTS "user_stats_update_own" ON public.user_stats;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_stats') THEN
        CREATE POLICY "user_stats_update_own" ON public.user_stats
            FOR UPDATE
            TO authenticated
            USING (wallet_address = (select (select auth.jwt()) ->> 'wallet_address'));
    END IF;
END $$;

-- ============================================================================
-- Fix 3: mission_progress_update - wrap auth.jwt() in subquery
-- ============================================================================

DROP POLICY IF EXISTS "mission_progress_update" ON public.mission_progress;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_progress') THEN
        CREATE POLICY "mission_progress_update" ON public.mission_progress
            FOR UPDATE
            TO authenticated
            USING (wallet_address = (select (select auth.jwt()) ->> 'wallet_address'));
    END IF;
END $$;

-- ============================================================================
-- Fix 4: activity_log_select - fully optimize auth calls
-- ============================================================================

DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_log') THEN
        CREATE POLICY "activity_log_select" ON public.activity_log
            FOR SELECT
            TO authenticated
            USING (
                wallet_address = (select (select auth.jwt()) ->> 'wallet_address')
                OR public.is_admin((select auth.uid()))
            );
    END IF;
END $$;

-- ============================================================================
-- Fix 5: mission_progress_select - fully optimize auth calls
-- ============================================================================

DROP POLICY IF EXISTS "mission_progress_select" ON public.mission_progress;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_progress') THEN
        CREATE POLICY "mission_progress_select" ON public.mission_progress
            FOR SELECT
            TO authenticated
            USING (
                wallet_address = (select (select auth.jwt()) ->> 'wallet_address')
                OR public.is_admin((select auth.uid()))
            );
    END IF;
END $$;

-- Done!
SELECT 'RLS policies fully optimized!' as status;
