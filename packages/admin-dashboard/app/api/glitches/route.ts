import { NextRequest, NextResponse } from 'next/server';

import {
    getDiscoveredGlitches,
    getAllGlitches,
} from '@/lib/gamification/glitches';

export const dynamic = 'force-dynamic';

// GET /api/glitches?wallet=optional - Get all glitches (admin) or user's discovered glitches
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');
        const showAll = searchParams.get('all') === 'true'; // Admin flag

        if (showAll) {
            // Admin: get all glitches
            const glitches = await getAllGlitches();
            return NextResponse.json({
                success: true,
                glitches,
            });
        }

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        // User: get discovered glitches only
        const discoveries = await getDiscoveredGlitches(walletAddress);

        return NextResponse.json({
            success: true,
            discoveries,
        });
    } catch (error) {
        console.error('[Glitches API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
