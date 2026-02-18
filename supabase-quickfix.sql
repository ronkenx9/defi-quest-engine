-- Quick fix: Drop user_stats specifically and recreate
-- Run this in Supabase SQL Editor

DROP TABLE IF EXISTS user_stats CASCADE;

CREATE TABLE user_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL,
    total_xp BIGINT NOT NULL DEFAULT 0,
    total_missions_completed BIGINT NOT NULL DEFAULT 0,
    total_missions_started BIGINT NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_points BIGINT NOT NULL DEFAULT 0,
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT 'user_stats recreated successfully' as result;
