import { NextRequest, NextResponse } from 'next/server';

import {
    getNarrativeState,
    checkNarrativeUnlocks,
} from '@/lib/gamification/narrative';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET /api/narrative?wallet=required - Get user's narrative state and unlocked chapters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get user level
        const { data: stats } = await supabase
            .from('user_stats')
            .select('level')
            .eq('wallet_address', walletAddress)
            .single();

        const userLevel = stats?.level || 1;
        const narrativeState = await getNarrativeState(walletAddress, userLevel);

        return NextResponse.json({
            success: true,
            ...narrativeState,
        });
    } catch (error) {
        console.error('[Narrative API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/narrative - Check for new narrative unlocks (typically called after level up)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, level } = body;

        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        const levelNum = parseInt(String(level));
        if (isNaN(levelNum) || levelNum < 1) {
            return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
        }

        const newChapters = await checkNarrativeUnlocks(walletAddress, levelNum);

        return NextResponse.json({
            success: true,
            newChapters: newChapters.map(c => ({
                chapter_number: c.chapter_number,
                title: c.title,
            })),
        });
    } catch (error) {
        console.error('[Narrative API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
