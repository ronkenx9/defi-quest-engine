-- ============================================================================
-- Final security fixes - Complete overhaul
-- ============================================================================

-- Step 1: Drop policies that depend on is_admin
DROP POLICY IF EXISTS "missions_admin_manage" ON public.missions;
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "admin_users_select" ON public.admin_users;
DROP POLICY IF EXISTS "mission_progress_select" ON public.mission_progress;

-- Step 2: Drop ALL is_admin function overloads
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_admin(UUID);

-- Step 3: Create single clean function with search_path
CREATE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
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

-- Step 4: Recreate policies with optimized auth calls

-- Missions admin policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'missions') THEN
        CREATE POLICY "missions_admin_manage" ON public.missions
            FOR ALL
            TO authenticated
            USING (public.is_admin((select auth.uid())));
    END IF;
END $$;

-- Activity log select policy  
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'activity_log') THEN
        CREATE POLICY "activity_log_select" ON public.activity_log
            FOR SELECT
            TO authenticated
            USING (
                wallet_address = (select auth.jwt() ->> 'wallet_address')
                OR public.is_admin((select auth.uid()))
            );
    END IF;
END $$;

-- Admin users select policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
        CREATE POLICY "admin_users_select" ON public.admin_users
            FOR SELECT
            TO authenticated
            USING (public.is_admin((select auth.uid())));
    END IF;
END $$;

-- Mission progress select policy
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mission_progress') THEN
        CREATE POLICY "mission_progress_select" ON public.mission_progress
            FOR SELECT
            TO authenticated
            USING (
                wallet_address = (select auth.jwt() ->> 'wallet_address')
                OR public.is_admin((select auth.uid()))
            );
    END IF;
END $$;

-- ============================================================================
-- Fix 2: Leaked Password Protection
-- NOTE: This CANNOT be set via SQL. Enable in Supabase Dashboard:
-- Authentication > Providers > Email > Enable "Leaked Password Protection"
-- ============================================================================

COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if user is admin. Has search_path set for security.';
