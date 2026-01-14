-- ============================================
-- DeFi Quest Engine - Supabase Database Schema
-- ADVANCED GAMIFICATION SYSTEM
-- ============================================
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ============================================
-- CORE TABLES
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
  level INTEGER DEFAULT 1,
  narrative_chapter INTEGER DEFAULT 1,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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

-- User NFT badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  image_url TEXT,
  mint_address TEXT,
  source TEXT DEFAULT 'mission' CHECK (source IN ('mission', 'glitch', 'season', 'prophecy', 'chain')),
  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, name)
);

-- Admin users table (for role-based access)
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SKILL TREE SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  skill_type TEXT NOT NULL CHECK (skill_type IN ('swapper', 'holder', 'explorer', 'oracle')),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, skill_type)
);

-- ============================================
-- QUEST CHAIN SYSTEM (Multi-step narratives)
-- ============================================

CREATE TABLE IF NOT EXISTS quest_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'matrix',
  steps JSONB NOT NULL DEFAULT '[]',
  final_reward_xp INTEGER DEFAULT 500,
  final_reward_badge TEXT,
  final_reward_badge_rarity TEXT CHECK (final_reward_badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_chain_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  chain_id UUID REFERENCES quest_chains(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 0,
  step_progress JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(wallet_address, chain_id)
);

-- ============================================
-- PROPHECY SYSTEM (Predictions with XP staking)
-- ============================================

CREATE TABLE IF NOT EXISTS prophecies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL CHECK (condition_type IN ('price_above', 'price_below', 'volume_above', 'custom')),
  condition_value JSONB NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  min_stake INTEGER DEFAULT 50,
  max_stake INTEGER DEFAULT 500,
  win_multiplier NUMERIC DEFAULT 3.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved_win', 'resolved_lose', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prophecy_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  prophecy_id UUID REFERENCES prophecies(id) ON DELETE CASCADE,
  prediction BOOLEAN NOT NULL,
  staked_xp INTEGER NOT NULL,
  potential_win INTEGER NOT NULL,
  result TEXT CHECK (result IN ('pending', 'won', 'lost')),
  xp_change INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE(wallet_address, prophecy_id)
);

-- ============================================
-- GLITCH SYSTEM (Hidden/Secret missions)
-- ============================================

CREATE TABLE IF NOT EXISTS glitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'count', 'amount', 'pattern', 'streak')),
  trigger_condition JSONB NOT NULL,
  reward_xp INTEGER DEFAULT 200,
  reward_badge TEXT,
  reward_badge_rarity TEXT CHECK (reward_badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
  rarity TEXT DEFAULT 'rare' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  discovery_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS glitch_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  glitch_id UUID REFERENCES glitches(id) ON DELETE CASCADE,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  xp_awarded INTEGER DEFAULT 0,
  UNIQUE(wallet_address, glitch_id)
);

-- ============================================
-- SEASON / BATTLE PASS SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'The Awakening',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  reward_track JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS season_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  season_xp INTEGER DEFAULT 0,
  current_tier INTEGER DEFAULT 0,
  claimed_tiers INTEGER[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, season_id)
);

-- ============================================
-- LEADERBOARD TABLES (Cached for performance)
-- ============================================

CREATE TABLE IF NOT EXISTS leaderboard_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  rank INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(wallet_address, date)
);

CREATE TABLE IF NOT EXISTS leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  xp INTEGER DEFAULT 0,
  rank INTEGER,
  week_start DATE NOT NULL,
  UNIQUE(wallet_address, week_start)
);

CREATE TABLE IF NOT EXISTS leaderboard_alltime (
  wallet_address TEXT PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  rank INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MULTIPLIER SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS active_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  multiplier_type TEXT NOT NULL CHECK (multiplier_type IN ('streak', 'season', 'event', 'referral', 'skill')),
  multiplier_value NUMERIC NOT NULL DEFAULT 1.0,
  source TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DAILY CHALLENGES
-- ============================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  bonus_multiplier NUMERIC DEFAULT 2.0,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 3),
  UNIQUE(date, slot)
);

CREATE TABLE IF NOT EXISTS daily_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  challenge_id UUID REFERENCES daily_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(wallet_address, challenge_id)
);

-- ============================================
-- NARRATIVE PROGRESSION
-- ============================================

CREATE TABLE IF NOT EXISTS narrative_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_number INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  unlock_level INTEGER NOT NULL,
  lore_text TEXT,
  unlock_feature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS narrative_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  chapter_id UUID REFERENCES narrative_chapters(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, chapter_id)
);

-- ============================================
-- REFERRAL SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet TEXT NOT NULL,
  referee_wallet TEXT NOT NULL UNIQUE,
  xp_earned_from_referee INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_chain_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prophecies ENABLE ROW LEVEL SECURITY;
ALTER TABLE prophecy_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE glitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE glitch_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_alltime ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read missions" ON missions FOR SELECT USING (is_active = true);
CREATE POLICY "Public read quest_chains" ON quest_chains FOR SELECT USING (is_active = true);
CREATE POLICY "Public read prophecies" ON prophecies FOR SELECT USING (status = 'active');
CREATE POLICY "Public read glitches metadata" ON glitches FOR SELECT USING (is_active = true);
CREATE POLICY "Public read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Public read leaderboards" ON leaderboard_alltime FOR SELECT USING (true);
CREATE POLICY "Public read daily leaderboards" ON leaderboard_daily FOR SELECT USING (true);
CREATE POLICY "Public read weekly leaderboards" ON leaderboard_weekly FOR SELECT USING (true);
CREATE POLICY "Public read daily_challenges" ON daily_challenges FOR SELECT USING (true);
CREATE POLICY "Public read narrative_chapters" ON narrative_chapters FOR SELECT USING (true);
CREATE POLICY "Public read user_stats" ON user_stats FOR SELECT USING (true);

-- Service role policies for mutations
CREATE POLICY "Service manages user_stats" ON user_stats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages skill_progress" ON skill_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages quest_chain_progress" ON quest_chain_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages prophecy_entries" ON prophecy_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages glitch_discoveries" ON glitch_discoveries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages season_progress" ON season_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages active_multipliers" ON active_multipliers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages daily_challenge_completions" ON daily_challenge_completions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages narrative_unlocks" ON narrative_unlocks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages user_badges" ON user_badges FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages activity_log" ON activity_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages referrals" ON referrals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages leaderboard_alltime" ON leaderboard_alltime FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages leaderboard_daily" ON leaderboard_daily FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service manages leaderboard_weekly" ON leaderboard_weekly FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_missions_active ON missions(is_active);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(type);
CREATE INDEX IF NOT EXISTS idx_progress_wallet ON mission_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_wallet ON skill_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_chain_progress_wallet ON quest_chain_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_prophecy_entries_wallet ON prophecy_entries(wallet_address);
CREATE INDEX IF NOT EXISTS idx_glitch_discoveries_wallet ON glitch_discoveries(wallet_address);
CREATE INDEX IF NOT EXISTS idx_season_progress_wallet ON season_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily_date ON leaderboard_daily(date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_weekly_week ON leaderboard_weekly(week_start);
CREATE INDEX IF NOT EXISTS idx_multipliers_wallet ON active_multipliers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_multipliers_expires ON active_multipliers(expires_at);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);

-- ============================================
-- SEED DATA: Narrative Chapters
-- ============================================

INSERT INTO narrative_chapters (chapter_number, title, unlock_level, lore_text, unlock_feature) VALUES
  (1, 'Awakening', 1, 'You sense something is wrong with the world. The numbers don''t add up. The patterns are too perfect...', NULL),
  (2, 'The Construct', 5, 'Welcome to the training program. Here, we will teach you to see the code behind the markets.', 'daily_challenges'),
  (3, 'Meet Morpheus', 10, 'I''ve been watching you, Neo. You''re the one. But you''re not ready yet. Complete these trials.', 'prophecies'),
  (4, 'The Oracle', 20, 'She can help you find the path. But remember, she can only show you the door. You must walk through it.', 'skill_tree'),
  (5, 'Agent Smith', 30, 'Mr. Anderson... We''ve been expecting you. You think you know something, but you know nothing.', 'adversarial_mode'),
  (6, 'The One', 50, 'You are The One, Neo. You can see the code now. You can change it. The Matrix bends to your will.', 'all_abilities')
ON CONFLICT (chapter_number) DO NOTHING;

-- ============================================
-- SEED DATA: Glitches
-- ============================================

INSERT INTO glitches (name, description, trigger_type, trigger_condition, reward_xp, reward_badge, reward_badge_rarity, rarity) VALUES
  ('Witching Hour', 'Discover by swapping between 3:00 AM and 4:00 AM', 'time', '{"hour_start": 3, "hour_end": 4}', 500, 'Night Owl', 'rare', 'rare'),
  ('Centennial', 'Complete your 100th swap', 'count', '{"action": "swap", "count": 100}', 1000, 'Centurion', 'epic', 'epic'),
  ('Perfect Round', 'Swap exactly $100.00', 'amount', '{"exact_amount": 100}', 200, NULL, NULL, 'common'),
  ('Lucky Seven', 'Maintain a 7-day streak', 'streak', '{"days": 7}', 350, 'Week Warrior', 'rare', 'rare'),
  ('Month Master', 'Maintain a 30-day streak', 'streak', '{"days": 30}', 1000, 'Dedication', 'epic', 'epic'),
  ('Déjà Vu', 'Make the same swap 3 times in a row', 'pattern', '{"repeat_count": 3}', 250, 'Déjà Vu', 'rare', 'rare'),
  ('The Architect', 'Reach level 25', 'count', '{"level": 25}', 750, 'Architect', 'legendary', 'legendary')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Quest Chains
-- ============================================

INSERT INTO quest_chains (name, description, theme, steps, final_reward_xp, final_reward_badge, final_reward_badge_rarity) VALUES
  (
    'Follow the White Rabbit',
    'Begin your journey into the Matrix. Complete these trials to prove your worth.',
    'matrix',
    '[
      {"step": 1, "name": "First Contact", "description": "Complete your first swap", "type": "swap_count", "target": 1},
      {"step": 2, "name": "Quick Learner", "description": "Complete 3 swaps in 24 hours", "type": "swap_count_timed", "target": 3, "time_limit_hours": 24},
      {"step": 3, "name": "Explorer", "description": "Trade a token you have never traded before", "type": "new_token", "target": 1},
      {"step": 4, "name": "Consistent", "description": "Maintain a 3-day streak", "type": "streak", "target": 3},
      {"step": 5, "name": "Believer", "description": "Reach 1000 total XP", "type": "total_xp", "target": 1000}
    ]',
    500,
    'Neo',
    'legendary'
  ),
  (
    'The Operator Training',
    'Learn to read the code. Master the tools of the resistance.',
    'matrix',
    '[
      {"step": 1, "name": "Volume I", "description": "Trade $50 in volume", "type": "volume", "target": 50},
      {"step": 2, "name": "Volume II", "description": "Trade $200 in volume", "type": "volume", "target": 200},
      {"step": 3, "name": "Volume III", "description": "Trade $500 in volume", "type": "volume", "target": 500}
    ]',
    300,
    'Operator',
    'epic'
  ),
  (
    'Streak Protocol',
    'Prove your dedication. The Matrix rewards consistency.',
    'matrix',
    '[
      {"step": 1, "name": "Day 1", "description": "Start your streak", "type": "streak", "target": 1},
      {"step": 2, "name": "Week 1", "description": "Maintain a 7-day streak", "type": "streak", "target": 7},
      {"step": 3, "name": "Fortnight", "description": "Maintain a 14-day streak", "type": "streak", "target": 14},
      {"step": 4, "name": "The Grind", "description": "Maintain a 30-day streak", "type": "streak", "target": 30}
    ]',
    1000,
    'Unwavering',
    'legendary'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Season 1
-- ============================================

INSERT INTO seasons (name, description, theme, start_date, end_date, is_active, reward_track) VALUES
  (
    'Season 1: The Awakening',
    'The first season of the Matrix Protocol. Wake up, Neo.',
    'The Awakening',
    '2026-01-01 00:00:00+00',
    '2026-03-31 23:59:59+00',
    true,
    '[
      {"tier": 1, "xp_required": 0, "reward_type": "title", "reward_value": "Sleeper"},
      {"tier": 2, "xp_required": 100, "reward_type": "xp", "reward_value": 50},
      {"tier": 3, "xp_required": 250, "reward_type": "multiplier", "reward_value": 1.1, "duration_hours": 24},
      {"tier": 4, "xp_required": 500, "reward_type": "badge", "reward_value": "Awakened", "rarity": "common"},
      {"tier": 5, "xp_required": 1000, "reward_type": "xp", "reward_value": 200},
      {"tier": 10, "xp_required": 2500, "reward_type": "badge", "reward_value": "Red Pill", "rarity": "rare"},
      {"tier": 15, "xp_required": 5000, "reward_type": "multiplier", "reward_value": 1.25, "duration_hours": 48},
      {"tier": 20, "xp_required": 10000, "reward_type": "badge", "reward_value": "Operator Elite", "rarity": "epic"},
      {"tier": 25, "xp_required": 17500, "reward_type": "xp", "reward_value": 1000},
      {"tier": 30, "xp_required": 25000, "reward_type": "badge", "reward_value": "The One", "rarity": "legendary"}
    ]'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: Sample Missions (expanded)
-- ============================================

INSERT INTO missions (name, description, type, difficulty, points, reset_cycle) VALUES
  ('First Swap', 'Complete your first token swap on Jupiter', 'swap', 'easy', 50, 'none'),
  ('Volume Hunter', 'Complete $100 in total swap volume', 'volume', 'medium', 100, 'weekly'),
  ('Week Warrior', 'Swap for 7 consecutive days', 'streak', 'hard', 200, 'none'),
  ('Price Watcher', 'Buy SOL when price is below $100', 'price', 'medium', 75, 'none'),
  ('Route Master', 'Use Jupiter optimal routing for 5 swaps', 'routing', 'legendary', 300, 'monthly'),
  ('Daily Trader', 'Complete 3 swaps today', 'swap', 'easy', 30, 'daily'),
  ('Big Spender', 'Swap at least $500 in a single transaction', 'volume', 'hard', 150, 'none'),
  ('Token Explorer', 'Trade 5 different tokens', 'swap', 'medium', 75, 'weekly'),
  ('Limit Order Pro', 'Set up a limit order on Jupiter', 'limit_order', 'medium', 100, 'none'),
  ('DCA Starter', 'Start a DCA position', 'dca', 'easy', 75, 'none')
ON CONFLICT DO NOTHING;
