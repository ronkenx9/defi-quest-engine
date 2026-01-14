import { NextRequest, NextResponse } from 'next/server';

import {
    getActiveChains,
    getChainProgress,
    getAllChains,
} from '@/lib/gamification/quest-chains';

export const dynamic = 'force-dynamic';

// GET /api/quests?wallet=optional - Get all quest chains or user's active chains
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');
        const showAll = searchParams.get('all') === 'true'; // Get all available chains

        if (showAll) {
            // Get all available quest chains
            const chains = await getAllChains();

            // If wallet provided, also get progress
            let progress = null;
            if (walletAddress) {
                const activeChains = await getActiveChains(walletAddress);
                progress = activeChains;
            }

            return NextResponse.json({
                success: true,
                chains,
                progress,
            });
        }

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // Get user's active chains with progress
        const activeChains = await getActiveChains(walletAddress);

        return NextResponse.json({
            success: true,
            activeChains,
        });
    } catch (error) {
        console.error('[Quests API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
