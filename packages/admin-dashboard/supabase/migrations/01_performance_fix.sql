-- ============================================================================
-- DeFi Quest Engine - Performance Fix Migration
-- Fixes: Multiple permissive policies + Duplicate indexes
-- Run this in Supabase SQL Editor AFTER the main schema migration
-- ============================================================================

-- ============================================================================
-- PART 1: REMOVE DUPLICATE POLICIES (Multiple Permissive Policies Fix)
-- Keep only ONE policy per table/role/action combination
-- ============================================================================

-- glitches: Remove old policy, keep "public_read"
DROP POLICY IF EXISTS "Public read glitches metadata" ON public.glitches;

-- leaderboard_weekly: Remove old policy, keep "public_read"
DROP POLICY IF EXISTS "Public read weekly leaderboards" ON public.leaderboard_weekly;

-- narrative_chapters: Remove old policy, keep "public_read"
DROP POLICY IF EXISTS "Public read narrative_chapters" ON public.narrative_chapters;

-- prophecies: Remove old policy, keep "public_read"
DROP POLICY IF EXISTS "Public read prophecies" ON public.prophecies;

-- quest_chains: Remove old policy, keep "public_read"
DROP POLICY IF EXISTS "Public read quest_chains" ON public.quest_chains;

-- seasons: Remove old policy, keep "public_read"
DROP POLICY IF EXISTS "Public read seasons" ON public.seasons;

-- user_stats: Remove duplicate, keep "public_read"
DROP POLICY IF EXISTS "user_stats_select" ON public.user_stats;

-- ============================================================================
-- PART 2: REMOVE DUPLICATE INDEXES
-- Keep the more descriptive naming convention (idx_<table>_<column>)
-- ============================================================================

-- active_multipliers: Keep idx_active_multipliers_wallet, drop idx_multipliers_wallet
DROP INDEX IF EXISTS idx_multipliers_wallet;

-- activity_log: Keep idx_activity_log_wallet, drop idx_activity_wallet
DROP INDEX IF EXISTS idx_activity_wallet;

-- skill_progress: Keep idx_skill_progress_wallet, drop idx_skill_wallet
DROP INDEX IF EXISTS idx_skill_wallet;

-- ============================================================================
-- VERIFICATION: Check remaining policies and indexes
-- ============================================================================

-- You can run these to verify the fix worked:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

COMMENT ON SCHEMA public IS 'DeFi Quest Engine - performance-optimized (duplicate policies and indexes removed)';
