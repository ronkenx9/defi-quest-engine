-- Guilds System Migration
-- Creates tables for guild functionality

-- Guilds table
CREATE TABLE IF NOT EXISTS guilds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    leader_wallet VARCHAR(44) NOT NULL,
    total_xp BIGINT DEFAULT 0,
    member_count INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guild members junction table
CREATE TABLE IF NOT EXISTS guild_members (
    guild_id UUID REFERENCES guilds(id) ON DELETE CASCADE,
    wallet_address VARCHAR(44) NOT NULL,
    role VARCHAR(20) DEFAULT 'member', -- leader, officer, member
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    xp_contributed BIGINT DEFAULT 0,
    PRIMARY KEY (guild_id, wallet_address)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guild_members_wallet ON guild_members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_guilds_total_xp ON guilds(total_xp DESC);

-- Enable RLS
ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

-- Guilds policies: public read, authenticated write
CREATE POLICY "guilds_public_read" ON guilds 
    FOR SELECT USING (true);

CREATE POLICY "guilds_authenticated_insert" ON guilds 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "guilds_leader_update" ON guilds 
    FOR UPDATE USING (leader_wallet = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Guild members policies
CREATE POLICY "guild_members_public_read" ON guild_members 
    FOR SELECT USING (true);

CREATE POLICY "guild_members_authenticated_insert" ON guild_members 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "guild_members_self_delete" ON guild_members 
    FOR DELETE USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Function to update guild stats when XP is claimed
CREATE OR REPLACE FUNCTION update_guild_xp()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the xp_contributed for the member
    UPDATE guild_members 
    SET xp_contributed = xp_contributed + NEW.xp_earned
    WHERE wallet_address = NEW.wallet_address;
    
    -- Update the guild's total XP
    UPDATE guilds g
    SET total_xp = (
        SELECT COALESCE(SUM(xp_contributed), 0)
        FROM guild_members gm
        WHERE gm.guild_id = g.id
    )
    WHERE g.id IN (
        SELECT guild_id FROM guild_members WHERE wallet_address = NEW.wallet_address
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
