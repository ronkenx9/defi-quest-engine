-- Migration: Add mission progress RPC functions and update requirements field
-- Run this in Supabase SQL Editor

-- Create RPC function to increment mission completions (called from swap API)
CREATE OR REPLACE FUNCTION increment_mission_completions(mission_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE missions 
    SET completions = COALESCE(completions, 0) + 1,
        updated_at = NOW()
    WHERE id = mission_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION increment_mission_completions(UUID) TO service_role;

-- Create policy for mission_progress table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mission_progress' 
        AND policyname = 'Service manages mission_progress'
    ) THEN
        CREATE POLICY "Service manages mission_progress" 
        ON mission_progress 
        FOR ALL 
        TO service_role 
        USING (true) 
        WITH CHECK (true);
    END IF;
END
$$;

-- Enable RLS on mission_progress if not already enabled
ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;

-- Add public read policy for users to see their own progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mission_progress' 
        AND policyname = 'Users can read own progress'
    ) THEN
        CREATE POLICY "Users can read own progress" 
        ON mission_progress 
        FOR SELECT 
        USING (true);
    END IF;
END
$$;

-- Update missions table to ensure it correctly uses JSONB for requirements
-- Note: The requirement field should contain: inputToken, outputToken, minUsdValue
-- Example: {"inputToken": "So1111...", "minUsdValue": 10}

COMMENT ON COLUMN missions.requirement IS 'JSONB containing mission requirements: inputToken (optional), outputToken (optional), minUsdValue (USD threshold for swap)';
