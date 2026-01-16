-- Security Tables Migration
-- Required for P0 and P1 security fixes in swap/route.ts
-- Fixed for Supabase Security Advisor compliance

-- ============================================================================
-- Rate limiting table (P0 fix: persistent rate limiting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
    wallet_address TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (required by Security Advisor)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too
ALTER TABLE rate_limits FORCE ROW LEVEL SECURITY;

-- Policy: Only service role can access (used by API)
CREATE POLICY "Service role access only" ON rate_limits
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Claimed transactions table (P0 fix: prevent duplicate claims)
-- ============================================================================
CREATE TABLE IF NOT EXISTS claimed_transactions (
    id SERIAL PRIMARY KEY,
    signature TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    amount DECIMAL(20, 9) NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (required by Security Advisor)
ALTER TABLE claimed_transactions ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner too
ALTER TABLE claimed_transactions FORCE ROW LEVEL SECURITY;

-- Policy: Only service role can access (used by API)
CREATE POLICY "Service role access only" ON claimed_transactions
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rate_limits_wallet ON rate_limits(wallet_address);
CREATE INDEX IF NOT EXISTS idx_claimed_transactions_signature ON claimed_transactions(signature);
CREATE INDEX IF NOT EXISTS idx_claimed_transactions_wallet ON claimed_transactions(wallet_address);

-- ============================================================================
-- Fix existing tables with Security Advisor warnings
-- ============================================================================

-- Fix: RLS Policy Always True on missions table
-- Drop the overly permissive policy and create proper ones
DO $$ 
BEGIN
    -- Drop existing policies on missions if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.missions;
    DROP POLICY IF EXISTS "Allow all" ON public.missions;
    DROP POLICY IF EXISTS "Public read access" ON public.missions;
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

-- Create proper policies for missions (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'missions') THEN
        -- Check if status column exists
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'missions' 
            AND column_name = 'status'
        ) THEN
            -- Use status-based policy
            CREATE POLICY "Read active missions" ON public.missions
                FOR SELECT
                USING (status = 'active' OR status IS NULL);
        ELSE
            -- No status column - allow authenticated users to read
            CREATE POLICY "Read missions" ON public.missions
                FOR SELECT
                TO authenticated
                USING (true);
        END IF;
        
        -- Service role can do everything
        CREATE POLICY "Service role full access" ON public.missions
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Fix: Function Search Path Mutable on is_admin
-- Recreate the function with explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
-- Enable Leaked Password Protection (Auth setting)
-- Note: This must be done in Supabase Dashboard under Authentication > Settings
-- ============================================================================
COMMENT ON SCHEMA public IS 'SECURITY NOTE: Enable "Leaked Password Protection" in Supabase Dashboard > Authentication > Settings';

-- Table comments
COMMENT ON TABLE rate_limits IS 'Persistent rate limiting for API endpoints - service role access only';
COMMENT ON TABLE claimed_transactions IS 'Tracks claimed swap transactions to prevent double-claiming XP - service role access only';

