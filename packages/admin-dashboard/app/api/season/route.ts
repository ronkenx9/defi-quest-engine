import { NextRequest, NextResponse } from 'next/server';

import {
    getCurrentSeason,
    getSeasonProgress,
    claimSeasonReward,
} from '@/lib/gamification/seasons';

export const dynamic = 'force-dynamic';

// GET /api/season?wallet=optional - Get current season and user progress
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        const season = await getCurrentSeason();

        let userProgress = null;
        if (walletAddress && season) {
            userProgress = await getSeasonProgress(walletAddress);
        }

        return NextResponse.json({
            success: true,
            season,
            userProgress,
        });
    } catch (error) {
        console.error('[Season API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/season - Claim a season reward
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, tier } = body;

        // Validate inputs
        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        const tierNum = parseInt(String(tier));
        if (isNaN(tierNum) || tierNum < 1) {
            return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
        }

        // Claim reward
        const result = await claimSeasonReward(walletAddress, tierNum);

        if (!result) {
            return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            reward: result,
        });
    } catch (error) {
        console.error('[Season API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
