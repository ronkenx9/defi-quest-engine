import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshPredictions() {
    console.log('🤖 Overseer: Purging outdated prediction missions...');

    // 1. Delete old prediction missions
    const { data: missions, error: fetchError } = await supabase
        .from('missions')
        .select('id')
        .eq('type', 'prediction');

    if (fetchError) {
        console.error('Failed to fetch old missions:', fetchError);
        return;
    }

    if (missions && missions.length > 0) {
        const ids = missions.map(m => m.id);
        const { error: deleteError } = await supabase
            .from('missions')
            .delete()
            .in('id', ids);

        if (deleteError) {
            console.error('Failed to delete old missions:', deleteError);
            return;
        }
        console.log(`✅ Purged ${missions.length} old prediction missions.`);
    } else {
        console.log('No old prediction missions found to delete.');
    }

    // 2. We will generate new ones via the batch-generate endpoint using a POST request
    console.log('🤖 Overseer: Now use the Admin Dashboard UI to generate a fresh batch of Prediction missions!');
}

refreshPredictions();
