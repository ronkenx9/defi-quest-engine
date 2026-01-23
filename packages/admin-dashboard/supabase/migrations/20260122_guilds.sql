-- ============================================================================
-- Guilds System - SAFE Additive Migration
-- Safe to run multiple times (idempotent) - following PostgreSQL Wizard patterns
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE TABLES (IF NOT EXISTS)
-- ============================================================================

-- Guilds table
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    leader_wallet TEXT NOT NULL,
    total_xp BIGINT DEFAULT 0,
    member_count INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guild members junction table
CREATE TABLE IF NOT EXISTS guild_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id UUID NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    xp_contributed BIGINT DEFAULT 0,
    UNIQUE(guild_id, wallet_address)
);

-- Add unique constraint on guild name (safe - only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'guilds_name_key'
    ) THEN
        ALTER TABLE guilds ADD CONSTRAINT guilds_name_key UNIQUE (name);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint guilds_name_key already exists or could not be created';
END $$;

-- ============================================================================
-- PART 2: CREATE INDEXES (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_guild_members_wallet ON guild_members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX IF NOT EXISTS idx_guilds_total_xp ON guilds(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_guilds_leader ON guilds(leader_wallet);
CREATE INDEX IF NOT EXISTS idx_guilds_active ON guilds(is_active) WHERE is_active = true;

-- ============================================================================
-- PART 3: ENABLE RLS (safe to run multiple times)
-- ============================================================================

DO $$
BEGIN
    EXECUTE 'ALTER TABLE guilds ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled on guilds tables';
END $$;

-- ============================================================================
-- PART 4: CREATE RLS POLICIES (drop if exists, then create)
-- ============================================================================

-- Guilds policies: Public read, service role write only
-- Anonymous users cannot directly create/modify guilds - must go through API
DO $$
BEGIN
    DROP POLICY IF EXISTS "guilds_public_read" ON guilds;
    CREATE POLICY "guilds_public_read" ON guilds 
        FOR SELECT USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "guilds_service_write" ON guilds;
    CREATE POLICY "guilds_service_write" ON guilds 
        FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Guild members policies: Public read, service role write only
-- Anonymous users cannot directly join/leave - must go through API for validation
DO $$
BEGIN
    DROP POLICY IF EXISTS "guild_members_public_read" ON guild_members;
    CREATE POLICY "guild_members_public_read" ON guild_members 
        FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS "guild_members_service_write" ON guild_members;
    CREATE POLICY "guild_members_service_write" ON guild_members 
        FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to increment guild member count
CREATE OR REPLACE FUNCTION increment_guild_member_count(p_guild_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE guilds 
    SET member_count = member_count + 1,
        updated_at = NOW()
    WHERE id = p_guild_id;
END;
$$;

-- Function to decrement guild member count  
CREATE OR REPLACE FUNCTION decrement_guild_member_count(p_guild_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE guilds 
    SET member_count = GREATEST(member_count - 1, 0),
        updated_at = NOW()
    WHERE id = p_guild_id;
END;
$$;

-- Function to recalculate guild XP from members
CREATE OR REPLACE FUNCTION recalculate_guild_xp(p_guild_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE guilds 
    SET total_xp = (
        SELECT COALESCE(SUM(xp_contributed), 0)
        FROM guild_members
        WHERE guild_id = p_guild_id
    ),
    updated_at = NOW()
    WHERE id = p_guild_id;
END;
$$;

-- ============================================================================
-- DONE! This migration is safe to run multiple times
-- ============================================================================

COMMENT ON TABLE guilds IS 'Guild teams for competitive play';
COMMENT ON TABLE guild_members IS 'Guild membership and XP contributions';
