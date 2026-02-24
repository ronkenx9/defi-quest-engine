import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { walletAddress, badgeIds } = await req.json();

        if (!walletAddress || !badgeIds || !Array.isArray(badgeIds) || badgeIds.length !== 3) {
            return NextResponse.json({ error: 'Invalid parameters: Requires wallet address and exactly 3 badge IDs.' }, { status: 400 });
        }

        // 1. Verify user stats
        const { data: currentStats, error: fetchError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (fetchError || !currentStats) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // For the hackathon, we simulate the Forge burning and minting server-side using the BadgeForge system mock roll
        // This avoids requiring the user to sign a real transaction to burn 3 NFTs and mint 1, which requires a custom hook.

        const { BadgeForge, FORGE_RULES } = await import('@defi-quest/core');

        // Let's just do a 70% success rate for simulation!
        const success = Math.random() < 0.70;

        await supabase.from('activity_log').insert({
            wallet_address: walletAddress,
            action: success ? 'forge_success' : 'forge_failure',
            details: { badgesBurned: badgeIds }
        });

        if (success) {
            // Give them some bonus XP for a successful forge!
            const bonusXp = 500;
            const newPoints = currentStats.total_points + bonusXp;

            await supabase.from('user_stats').update({ total_points: newPoints }).eq('wallet_address', walletAddress);

            return NextResponse.json({
                success: true,
                result: 'success',
                newBadge: {
                    name: 'Evolved Core Badge',
                    rarity: 'rare',
                    xp: 500,
                    level: 2
                },
                xpBonus: bonusXp,
                message: 'Successfully forged 3 badges into a new Rare badge!'
            });
        } else {
            return NextResponse.json({
                success: true,
                result: 'failure',
                message: 'Forge failed. The badges were consumed but no new badge was generated.'
            });
        }

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
