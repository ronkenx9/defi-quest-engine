-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Add market_id column for Polymarket string IDs (nullable)
ALTER TABLE prophecy_entries ADD COLUMN IF NOT EXISTS market_id TEXT;

-- Add source column to track origin
ALTER TABLE prophecy_entries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'polymarket' CHECK (source IN ('polymarket', 'mission'));

-- Create index for market lookups
CREATE INDEX IF NOT EXISTS idx_prophecy_entries_market ON prophecy_entries(market_id) WHERE market_id IS NOT NULL;

-- Allow service role full access for cron jobs
GRANT ALL ON TABLE prophecy_entries TO service_role;

-- Grant execute on cron functions
GRANT EXECUTE ON FUNCTION cron.schedule TO service_role;
GRANT EXECUTE ON FUNCTION cron.unschedule TO service_role;

-- Schedule the resolution job to run every hour (commented - requires Vercel URL)
-- SELECT cron.schedule(
--     'resolve-polymarket-markets',
--     '0 * * * *',
--     $$
--     SELECT
--         net.http_post(
--             url:='https://your-app.vercel.app/api/prophecy/resolve',
--             headers:='{"Content-Type": "application/json"}'::jsonb
--         ) AS request_id;
--     $$
-- );
