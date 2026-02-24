import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { walletAddress, amount, action } = await req.json();

        if (!walletAddress || !action || amount === undefined) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const { data: currentStats, error: fetchError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (fetchError || !currentStats) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'start') {
            // Deduct initial wager from balance
            if (currentStats.total_points < amount) {
                return NextResponse.json({ error: 'Not enough XP' }, { status: 400 });
            }
            const newPoints = currentStats.total_points - amount;

            await supabase.from('user_stats').update({ total_points: newPoints }).eq('wallet_address', walletAddress);

            await supabase.from('activity_log').insert({
                wallet_address: walletAddress,
                action: 'double_or_nothing_start',
                details: { wager: amount }
            });

            return NextResponse.json({ success: true, newBalance: newPoints });

        } else if (action === 'risk') {
            // 50% chance to double
            const won = Math.random() < 0.50;

            if (won) {
                return NextResponse.json({ success: true, won: true, newWager: amount * 2 });
            } else {
                await supabase.from('activity_log').insert({
                    wallet_address: walletAddress,
                    action: 'double_or_nothing_loss',
                    details: { lostAmount: amount }
                });
                return NextResponse.json({ success: true, won: false, newWager: 0 });
            }

        } else if (action === 'claim') {
            // Add won amount back to balance
            const newPoints = currentStats.total_points + amount;

            await supabase.from('user_stats').update({ total_points: newPoints }).eq('wallet_address', walletAddress);

            await supabase.from('activity_log').insert({
                wallet_address: walletAddress,
                action: 'double_or_nothing_claim',
                details: { claimedAmount: amount }
            });

            return NextResponse.json({ success: true, newBalance: newPoints });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
