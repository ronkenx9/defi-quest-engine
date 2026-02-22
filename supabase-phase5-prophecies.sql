-- Phase 5: Tiered Prophecies & Dynamic Odds Migration
-- Run this script in your Supabase SQL Editor

-- 1. Add 'type' to distinguish between short-window Feed (Tier 1) and complex Missions (Tier 2)
ALTER TABLE prophecies ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'mission';
-- 2. Add pool tracking columns for Dynamic Odds
ALTER TABLE prophecies ADD COLUMN IF NOT EXISTS total_yes_pool INTEGER DEFAULT 0;
ALTER TABLE prophecies ADD COLUMN IF NOT EXISTS total_no_pool INTEGER DEFAULT 0;

-- 3. Replace fixed win_multiplier with dynamic odds logic where potential_win is calculated on resolution.
-- We can keep win_multiplier for base display, but for 'feed' type, it will be ignored on resolution.

-- 4. Seed Data for Tier 1: Oracle Feed (Short window 15m - 1h)
INSERT INTO prophecies (title, description, condition_type, condition_value, deadline, min_stake, max_stake, win_multiplier, status, type)
VALUES 
(
    'JUP_MOMENTUM_SCALPER', 
    'Short window oracle feed. Will JUP/USD cross $0.85 in the next 15 minutes?', 
    'price_above', 
    '{"threshold": 0.85}', 
    (now() + interval '15 minutes'), 
    10, 
    5000, 
    1.0, 
    'active',
    'feed'
),
(
    'BONK_DUMP_WARNING', 
    'Short window oracle feed. Will BONK/USD drop below $0.000015 before the hour ends?', 
    'price_below', 
    '{"threshold": 0.000015}', 
    (now() + interval '1 hour'), 
    10, 
    5000, 
    1.0, 
    'active',
    'feed'
);

-- Note: The existing rows will have type = 'mission' due to the DEFAULT constraint, which is correct for Tier 2.
