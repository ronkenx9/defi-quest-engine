-- Migration to fix mission_id for Indexer compatibility
-- Run this in Supabase SQL Editor

-- Add mission_id as TEXT using DO block to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'mission_id'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN mission_id TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'wallet_address'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN wallet_address TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'status'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'current_value'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN current_value BIGINT DEFAULT 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN started_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mission_progress' AND column_name = 'claimed_at'
    ) THEN
        ALTER TABLE mission_progress ADD COLUMN claimed_at TIMESTAMPTZ;
    END IF;
END $$;

SELECT 'Migration completed successfully' as result;
