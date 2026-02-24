import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { walletAddress, prophecyId, prediction, stakeXP } = body;

        if (!walletAddress || !prophecyId || prediction === undefined || !stakeXP) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (stakeXP <= 0) {
            return NextResponse.json({ error: 'Stake must be positive' }, { status: 400 });
        }

        // Get the market to calculate potential win
        const marketResponse = await fetch('https://gamma-api.polymarket.com/markets/' + prophecyId.replace('poly_', ''));
        let winMultiplier = 1.5;
        if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            // outcomePrices can be a JSON string or array
            let prices = marketData.outcomePrices;
            if (typeof prices === 'string') {
                prices = JSON.parse(prices);
            }
            const prob = prediction ? (prices?.[0] || 0.5) : (prices?.[1] || 0.5);
            winMultiplier = 1 / parseFloat(prob);
        }
        const potentialWin = Math.floor(stakeXP * winMultiplier);

        // 1. Verify user has enough XP
        const { data: userStats, error: statsError } = await supabase
            .from('user_stats')
            .select('total_points')
            .eq('wallet_address', walletAddress)
            .single();

        if (statsError || !userStats) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (userStats.total_points < stakeXP) {
            return NextResponse.json({ error: 'Insufficient XP' }, { status: 400 });
        }

        // 2. Deduct XP from user_stats immediately
        const { error: deductError } = await supabase
            .from('user_stats')
            .update({ total_points: userStats.total_points - stakeXP })
            .eq('wallet_address', walletAddress);

        if (deductError) {
            return NextResponse.json({ error: 'Failed to deduct XP' }, { status: 500 });
        }

        // 3. Insert into prophecy_entries (matching DB schema)
        const marketId = prophecyId.replace('poly_', '');
        const { data, error } = await supabase
            .from('prophecy_entries')
            .insert({
                wallet_address: walletAddress,
                market_id: marketId,
                prediction: prediction,
                staked_xp: stakeXP,
                potential_win: potentialWin,
                result: 'pending',
                xp_change: 0,
                source: 'polymarket'
            })
            .select()
            .single();

        if (error) {
            // Rollback XP deduction (best effort)
            await supabase
                .from('user_stats')
                .update({ total_points: userStats.total_points })
                .eq('wallet_address', walletAddress);

            console.error('Prophecy entry insert error:', error);
            return NextResponse.json({ error: 'Failed to insert entry: ' + error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data }, { status: 200 });

    } catch (error) {
        console.error('Stake API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
