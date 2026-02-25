
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from admin-dashboard as it likely has the service role key
dotenv.config({ path: path.resolve(process.cwd(), 'packages/admin-dashboard/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpdate() {
    const wallet = 'B4P3enKbE7b8SktEenEgf3sQb134AmHzMoZ4ua57uE3W';
    console.log(`Testing update for wallet: ${wallet}`);

    // 1. Check current state
    const { data: initial } = await supabase.from('user_stats').select('total_points').eq('wallet_address', wallet).single();
    console.log('Initial points:', initial?.total_points);

    // 2. Try to update
    const { data, error } = await supabase
        .from('user_stats')
        .update({ total_points: 9999 })
        .eq('wallet_address', wallet)
        .select();

    if (error) {
        console.error('Update error:', error);
    } else {
        console.log('Update result:', data);
    }

    // 3. Final check
    const { data: final } = await supabase.from('user_stats').select('total_points').eq('wallet_address', wallet).single();
    console.log('Final points:', final?.total_points);
}

testUpdate();
