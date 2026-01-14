import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';
import {
    getActiveProphecies,
    getUserProphecies,
    makePrediction,
} from '@/lib/gamification/prophecies';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET /api/prophecy?wallet=optional - Get active prophecies and user predictions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        const prophecies = await getActiveProphecies();

        let userPredictions = null;
        if (walletAddress) {
            userPredictions = await getUserProphecies(walletAddress);
        }

        return NextResponse.json({
            success: true,
            prophecies,
            userPredictions,
        });
    } catch (error) {
        console.error('[Prophecy API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/prophecy - Make a prediction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, prophecyId, prediction, stakeXP } = body;

        // Validate inputs
        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        if (!prophecyId || typeof prophecyId !== 'string') {
            return NextResponse.json({ error: 'Invalid prophecy ID' }, { status: 400 });
        }

        if (!prediction || typeof prediction !== 'string') {
            return NextResponse.json({ error: 'Invalid prediction' }, { status: 400 });
        }

        const predictionBool = prediction.toLowerCase() === 'true';

        const stake = parseInt(String(stakeXP));
        if (isNaN(stake) || stake < 10 || stake > 10000) {
            return NextResponse.json({ error: 'Stake must be between 10 and 10000 XP' }, { status: 400 });
        }

        // Check user has enough XP
        const supabase = createClient(
            supabaseUrl,
            supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data: stats } = await supabase
            .from('user_stats')
            .select('total_points')
            .eq('wallet_address', walletAddress)
            .single();

        if (!stats || stats.total_points < stake) {
            return NextResponse.json({ error: 'Insufficient XP' }, { status: 400 });
        }

        // Make prediction
        const result = await makePrediction(walletAddress, prophecyId, predictionBool, stake);

        if (!result) {
            return NextResponse.json({ error: 'Failed to make prediction' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            entry: result,
        });
    } catch (error) {
        console.error('[Prophecy API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
