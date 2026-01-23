-- ============================================================================
-- FIX: Remove permissive anonymous policies
-- Run this FIRST to clear existing bad policies
-- ============================================================================

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "guilds_anon_insert" ON guilds;
DROP POLICY IF EXISTS "guild_members_anon_insert" ON guild_members;
DROP POLICY IF EXISTS "guild_members_anon_delete" ON guild_members;

-- Verify they're gone
-- Run: SELECT policyname FROM pg_policies WHERE tablename IN ('guilds', 'guild_members');
