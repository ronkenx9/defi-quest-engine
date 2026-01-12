-- ============================================
-- DeFi Quest Engine - Supabase Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- TABLES
-- ============================================

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('swap', 'volume', 'streak', 'price', 'routing', 'limit_order', 'dca')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'legendary')),
  points INTEGER NOT NULL DEFAULT 50,
  reset_cycle TEXT DEFAULT 'none' CHECK (reset_cycle IN ('none', 'daily', 'weekly', 'monthly')),
  requirement JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  completions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  current_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(wallet_address, mission_id)
);

-- User stats for leaderboard
CREATE TABLE IF NOT EXISTS user_stats (
  wallet_address TEXT PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for dashboard feed
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL,
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (CRITICAL FOR SECURITY)
-- ============================================

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Admin can read all missions (authenticated users only)
CREATE POLICY "Authenticated users can read missions" ON missions
  FOR SELECT TO authenticated USING (true);

-- Admin can manage all missions
CREATE POLICY "Authenticated users can manage missions" ON missions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Admin can read all progress
CREATE POLICY "Authenticated users can read progress" ON mission_progress
  FOR SELECT TO authenticated USING (true);

-- Admin can read all user stats
CREATE POLICY "Authenticated users can read user_stats" ON user_stats
  FOR SELECT TO authenticated USING (true);

-- Admin can read all activity
CREATE POLICY "Authenticated users can read activity" ON activity_log
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_missions_active ON missions(is_active);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);
CREATE INDEX IF NOT EXISTS idx_progress_wallet ON mission_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_progress_mission ON mission_progress(mission_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_wallet ON activity_log(wallet_address);

-- ============================================
-- SAMPLE DATA (OPTIONAL - for testing)
-- ============================================

-- Insert some sample missions
INSERT INTO missions (name, description, type, difficulty, points, reset_cycle) VALUES
  ('First Swap', 'Complete your first token swap on Jupiter', 'swap', 'easy', 50, 'none'),
  ('Volume Hunter', 'Complete $100 in total swap volume', 'volume', 'medium', 100, 'weekly'),
  ('Week Warrior', 'Swap for 7 consecutive days', 'streak', 'hard', 200, 'none'),
  ('Price Watcher', 'Buy SOL when price is below $100', 'price', 'medium', 75, 'none'),
  ('Route Master', 'Use Jupiter optimal routing for 5 swaps', 'routing', 'legendary', 300, 'monthly')
ON CONFLICT DO NOTHING;
