-- Clean reset: Drop ALL existing tables first
-- Run this in Supabase SQL Editor

-- Force drop tables (including any existing ones)
DROP TABLE IF EXISTS mission_progress CASCADE;
DROP TABLE IF EXISTS missions CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS rewards_history CASCADE;
DROP TABLE IF EXISTS indexer_state CASCADE;
DROP TABLE IF EXISTS config CASCADE;

-- Recreate user_stats with only id as PK, wallet_address as unique
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

-- Missions table
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id TEXT UNIQUE NOT NULL,
    name TEXT,
    description TEXT,
    type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    points BIGINT NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT true,
    input_token TEXT,
    output_token TEXT,
    min_amount BIGINT,
    authority TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    signature TEXT
);

CREATE INDEX idx_missions_mission_id ON missions(mission_id);
CREATE INDEX idx_missions_type ON missions(type);
CREATE INDEX idx_missions_active ON missions(is_active);

-- User Progress table
CREATE TABLE mission_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'claimed')),
    current_value BIGINT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(wallet_address, mission_id)
);

CREATE INDEX idx_progress_wallet ON mission_progress(wallet_address);
CREATE INDEX idx_progress_mission ON mission_progress(mission_id);
CREATE INDEX idx_progress_status ON mission_progress(status);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    mission_id TEXT,
    wallet_address TEXT,
    signature TEXT NOT NULL,
    slot BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_mission ON events(mission_id);
CREATE INDEX idx_events_signature ON events(signature);

-- Rewards History table
CREATE TABLE rewards_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT NOT NULL,
    mission_id TEXT NOT NULL,
    xp_earned BIGINT NOT NULL,
    token_amount BIGINT,
    badge_type TEXT,
    claim_signature TEXT,
    claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexer State table
CREATE TABLE indexer_state (
    id TEXT PRIMARY KEY DEFAULT 'indexer',
    last_processed_slot BIGINT NOT NULL DEFAULT 0,
    last_signature TEXT,
    is_syncing BOOLEAN NOT NULL DEFAULT false,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO indexer_state (id, last_processed_slot) VALUES ('indexer', 0);

-- Config table
CREATE TABLE config (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    authority TEXT NOT NULL,
    mission_count BIGINT NOT NULL DEFAULT 0,
    total_rewards_distributed BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT 'Schema created successfully' as result;
