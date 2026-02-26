import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/profile/update
 * 
 * Updates the username for a given wallet address in the user_stats table.
 */
export async function POST(request: NextRequest) {
    try {
        const { walletAddress, username } = await request.json();

        if (!walletAddress || !username) {
            return NextResponse.json(
                { error: 'walletAddress and username are required' },
                { status: 400 }
            );
        }

        // Update username in user_stats
        const { error: updateError } = await supabase
            .from('user_stats')
            .update({ username: username.trim() })
            .ilike('wallet_address', walletAddress);

        if (updateError) {
            console.error('[ProfileUpdate] Supabase update error:', updateError);
            return NextResponse.json(
                { error: 'Database update failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            username: username.trim(),
            message: 'Profile updated successfully',
        });
    } catch (error) {
        console.error('[ProfileUpdate] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
