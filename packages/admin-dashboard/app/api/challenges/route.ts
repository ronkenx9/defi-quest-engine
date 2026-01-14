import { NextRequest, NextResponse } from 'next/server';

import {
    getTodaysChallenges,
    completeChallenge,
    getUserChallengeProgress,
} from '@/lib/gamification/daily-challenges';

export const dynamic = 'force-dynamic';

// GET /api/challenges?wallet=optional - Get today's challenges and user progress
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        const challenges = await getTodaysChallenges();

        let userProgress = null;
        if (walletAddress) {
            userProgress = await getUserChallengeProgress(walletAddress);
        }

        return NextResponse.json({
            success: true,
            challenges,
            userProgress,
        });
    } catch (error) {
        console.error('[Challenges API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/challenges - Complete a challenge
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletAddress, challengeId } = body;

        if (!walletAddress || typeof walletAddress !== 'string') {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        if (!challengeId || typeof challengeId !== 'string') {
            return NextResponse.json({ error: 'Invalid challenge ID' }, { status: 400 });
        }

        const result = await completeChallenge(walletAddress, challengeId);

        if (!result) {
            return NextResponse.json({ error: 'Failed to complete challenge' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            completion: result,
        });
    } catch (error) {
        console.error('[Challenges API] POST Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
