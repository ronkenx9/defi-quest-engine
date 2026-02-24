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
        // Handle both UUID prophecy_id and string market_id (for Polymarket)
        const marketId = prophecyId.startsWith('poly_') ? prophecyId.replace('poly_', '') : prophecyId;

        // Check if prophecy_id is a valid UUID (our internal prophecy) or a Polymarket ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(prophecyId);

        const insertData: Record<string, unknown> = {
            wallet_address: walletAddress,
            prediction: prediction,
            staked_xp: stakeXP,
            potential_win: potentialWin,
            result: 'pending',
            xp_change: 0,
            source: isUUID ? 'mission' : 'polymarket'
        };

        // If it's a UUID prophecy_id from our system, use it directly
        // Otherwise use market_id for Polymarket
        if (isUUID) {
            insertData.prophecy_id = prophecyId;
        } else {
            insertData.market_id = marketId;
        }

        const { data, error } = await supabase
            .from('prophecy_entries')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // Rollback XP deduction (best effort)
            await supabase
                .from('user_stats')
                .update({ total_points: userStats.total_points })
                .eq('wallet_address', walletAddress);

            console.error('Prophecy entry insert error:', error);
            // Return specific DB error to help debugging
            return NextResponse.json({
                error: 'Failed to insert entry',
                details: error.message,
                code: error.code
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, entry: data }, { status: 200 });

    } catch (error: any) {
        console.error('Stake API Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}
