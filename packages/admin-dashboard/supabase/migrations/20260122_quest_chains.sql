-- Quest Chains Migration
-- Cross-protocol quest chains for bonus XP rewards

-- Quest chains table
CREATE TABLE IF NOT EXISTS quest_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    protocols TEXT[] NOT NULL, -- ['Jupiter', 'Marinade', 'Drift']
    bonus_xp INT DEFAULT 500,
    required_missions INT DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add chain reference to missions
ALTER TABLE missions ADD COLUMN IF NOT EXISTS chain_id UUID REFERENCES quest_chains(id);
ALTER TABLE missions ADD COLUMN IF NOT EXISTS chain_order INT DEFAULT 0;

-- Track user progress on quest chains
CREATE TABLE IF NOT EXISTS chain_progress (
    wallet_address VARCHAR(44) NOT NULL,
    chain_id UUID REFERENCES quest_chains(id) ON DELETE CASCADE,
    current_step INT DEFAULT 0,
    steps_completed INT[] DEFAULT '{}', -- Array of completed mission IDs
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (wallet_address, chain_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chain_progress_wallet ON chain_progress(wallet_address);
CREATE INDEX IF NOT EXISTS idx_missions_chain ON missions(chain_id);

-- Enable RLS
ALTER TABLE quest_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_progress ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "quest_chains_public_read" ON quest_chains 
    FOR SELECT USING (is_active = true);

CREATE POLICY "chain_progress_public_read" ON chain_progress 
    FOR SELECT USING (true);

CREATE POLICY "chain_progress_user_write" ON chain_progress 
    FOR ALL USING (true);

-- Insert sample quest chains
INSERT INTO quest_chains (name, description, protocols, bonus_xp, required_missions) VALUES
    ('Solana DeFi Journey', 'Complete swaps on Jupiter, stake on Marinade, and trade on Drift for a mega bonus!', ARRAY['Jupiter', 'Marinade', 'Drift'], 1000, 3),
    ('Jupiter Mastery', 'Master all aspects of Jupiter - swaps, limit orders, and DCA', ARRAY['Jupiter'], 500, 3),
    ('Liquid Staking Quest', 'Explore liquid staking across Marinade and Jito', ARRAY['Marinade', 'Jito'], 750, 2)
ON CONFLICT DO NOTHING;
