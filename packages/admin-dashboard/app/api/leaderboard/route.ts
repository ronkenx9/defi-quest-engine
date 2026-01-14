import { NextRequest, NextResponse } from 'next/server';

import {
    getLeaderboard,
    getUserRank
} from '@/lib/gamification/leaderboards';

export const dynamic = 'force-dynamic';

// GET /api/leaderboard?period=daily|weekly|alltime&limit=50&wallet=optional
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = (searchParams.get('period') as 'daily' | 'weekly' | 'alltime') || 'alltime';
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
        const walletAddress = searchParams.get('wallet');

        // Validate period
        if (!['daily', 'weekly', 'alltime'].includes(period)) {
            return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
        }

        // Get leaderboard
        const entries = await getLeaderboard(period, limit);

        // Get user rank if wallet provided
        let userRank = null;
        if (walletAddress) {
            userRank = await getUserRank(walletAddress, period);
        }

        return NextResponse.json({
            success: true,
            period,
            entries,
            userRank,
        });
    } catch (error) {
        console.error('[Leaderboard API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
