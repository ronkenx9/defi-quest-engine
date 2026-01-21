-- ============================================================================
-- DeFi Quest Engine - ADDITIVE Migration for Existing Database
-- Safe to run on existing Supabase schemas - only adds what's missing
-- Following PostgreSQL skill best practices (safe schema evolution)
-- ============================================================================

-- ============================================================================
-- PART 1: ADD MISSING TABLES (IF NOT EXISTS)
-- These tables are required for the swap API and gamification
-- ============================================================================

-- Rate limits (for swap API rate limiting)
CREATE TABLE IF NOT EXISTS rate_limits (
    wallet_address TEXT PRIMARY KEY,
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claimed transactions (prevent double-claiming XP)
CREATE TABLE IF NOT EXISTS claimed_transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    signature TEXT UNIQUE NOT NULL,
    wallet_address TEXT NOT NULL,
    amount NUMERIC(20, 9) NOT NULL,
    claimed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats (core gamification - may already exist)
CREATE TABLE IF NOT EXISTS user_stats (
    wallet_address TEXT PRIMARY KEY,
    total_points INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    total_missions_completed INTEGER NOT NULL DEFAULT 0,
    badges_earned INTEGER NOT NULL DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by TEXT,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill progress
CREATE TABLE IF NOT EXISTS skill_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    skill_type TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    current_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, skill_type)
);

-- Season tables
CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    theme TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    tiers JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    current_xp INTEGER NOT NULL DEFAULT 0,
    current_tier INTEGER NOT NULL DEFAULT 0,
    claimed_rewards JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, season_id)
);

-- Active multipliers
CREATE TABLE IF NOT EXISTS active_multipliers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    multiplier_type TEXT NOT NULL,
    multiplier_value NUMERIC(5,2) NOT NULL,
    source TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    badge_name TEXT,
    mint_address TEXT,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, badge_id)
);

-- Quest chains
CREATE TABLE IF NOT EXISTS quest_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    steps JSONB NOT NULL DEFAULT '[]',
    total_xp INTEGER NOT NULL DEFAULT 0,
    badge_reward TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_chain_progress (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    chain_id UUID NOT NULL REFERENCES quest_chains(id) ON DELETE CASCADE,
    current_step INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, chain_id)
);

-- Prophecies
CREATE TABLE IF NOT EXISTS prophecies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_option INTEGER,
    status TEXT DEFAULT 'open',
    closes_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    total_pool INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prophecy_entries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    prophecy_id UUID NOT NULL REFERENCES prophecies(id) ON DELETE CASCADE,
    selected_option INTEGER NOT NULL,
    stake_amount INTEGER NOT NULL DEFAULT 0,
    is_winner BOOLEAN,
    payout INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, prophecy_id)
);

-- Narrative system
CREATE TABLE IF NOT EXISTS narrative_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    unlock_level INTEGER NOT NULL DEFAULT 1,
    xp_reward INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS narrative_unlocks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    chapter_id UUID NOT NULL REFERENCES narrative_chapters(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, chapter_id)
);

-- Glitches (UUID primary key for consistency)
CREATE TABLE IF NOT EXISTS glitches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_conditions JSONB NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    reward_badge TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discovered_glitches (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    glitch_id UUID NOT NULL REFERENCES glitches(id) ON DELETE CASCADE,
    xp_awarded INTEGER NOT NULL,
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(wallet_address, glitch_id)
);

-- Leaderboard cache
CREATE TABLE IF NOT EXISTS leaderboard_weekly (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    weekly_xp INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    week_start TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PART 2: ADD MISSING INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_log_wallet ON activity_log(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_claimed_transactions_signature ON claimed_transactions(signature);
CREATE INDEX IF NOT EXISTS idx_claimed_transactions_wallet ON claimed_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_skill_progress_wallet ON skill_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_active_multipliers_wallet ON active_multipliers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_badges_wallet ON user_badges(wallet_address);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_rank ON leaderboard_weekly(rank);

-- ============================================================================
-- PART 3: ENABLE RLS (safe to run multiple times)
-- ============================================================================

DO $$ 
BEGIN
    EXECUTE 'ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE claimed_transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE seasons ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE active_multipliers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE quest_chains ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE quest_chain_progress ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE prophecies ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE prophecy_entries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE narrative_chapters ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE narrative_unlocks ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE glitches ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE discovered_glitches ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Some RLS already enabled, continuing...';
END $$;

-- ============================================================================
-- PART 4: ADD RLS POLICIES (drop if exists, then create)
-- ============================================================================

-- Service role policies for all new tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'rate_limits', 'claimed_transactions', 'user_stats', 'activity_log',
        'skill_progress', 'seasons', 'season_progress', 'active_multipliers',
        'user_badges', 'quest_chains', 'quest_chain_progress', 'prophecies',
        'prophecy_entries', 'narrative_chapters', 'narrative_unlocks',
        'glitches', 'discovered_glitches', 'leaderboard_weekly'
    ])
    LOOP
        -- Drop existing service_role_all policy if it exists
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS service_role_all ON %I', tbl);
        EXCEPTION WHEN undefined_table THEN NULL;
        END;
        
        -- Create service role policy
        BEGIN
            EXECUTE format(
                'CREATE POLICY service_role_all ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
                tbl
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not create policy for %, already exists or table missing', tbl;
        END;
    END LOOP;
END $$;

-- Public read policies for specific tables
DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON user_stats;
    CREATE POLICY public_read ON user_stats FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON seasons;
    CREATE POLICY public_read ON seasons FOR SELECT USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON quest_chains;
    CREATE POLICY public_read ON quest_chains FOR SELECT USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON prophecies;
    CREATE POLICY public_read ON prophecies FOR SELECT USING (status IN ('open', 'closed', 'resolved'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON narrative_chapters;
    CREATE POLICY public_read ON narrative_chapters FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON glitches;
    CREATE POLICY public_read ON glitches FOR SELECT USING (is_active = true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    DROP POLICY IF EXISTS public_read ON leaderboard_weekly;
    CREATE POLICY public_read ON leaderboard_weekly FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- PART 5: is_admin helper function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
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

-- ============================================================================
-- DONE! This migration is safe to run multiple times
-- ============================================================================

COMMENT ON SCHEMA public IS 'DeFi Quest Engine - additive migration applied';
