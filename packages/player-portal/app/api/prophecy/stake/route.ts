import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Support both naming conventions: UI sends snake_case, code uses camelCase
        const walletAddress = body.wallet_address || body.walletAddress;
        const prophecyId = body.market_id || body.prophecyId;
        const prediction = body.position !== undefined ? body.position : body.prediction;
        const stakeXP = body.stake_xp || body.stakeXP;

        if (!walletAddress || !prophecyId || prediction === undefined || !stakeXP) {
            console.error("[Stake] Missing fields:", { walletAddress, prophecyId, prediction, stakeXP, body });
            return NextResponse.json({ error: "Missing required fields", received: body }, { status: 400 });
        }

        if (stakeXP <= 0) {
            return NextResponse.json({ error: 'Stake must be positive' }, { status: 400 });
        }

        // Initialize service role client
        const supabase = createClient(supabaseUrl, supabaseServiceKey!, {
            global: {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                }
            }
        });

        // Get the market to calculate potential win
        const marketResponse = await fetch('https://gamma-api.polymarket.com/markets/' + prophecyId.replace('poly_', ''));
        let winMultiplier = 1.5;
        if (marketResponse.ok) {
            const marketData = await marketResponse.json();
            let prices = marketData.outcomePrices;
            if (typeof prices === 'string') {
                prices = JSON.parse(prices);
            }
            const prob = prediction ? (prices?.[0] || 0.5) : (prices?.[1] || 0.5);
            winMultiplier = 1 / parseFloat(prob);
        }
        const potentialWin = Math.floor(stakeXP * winMultiplier);

        // 1. Verify user has enough XP
        console.log(`[Stake API] Checking XP for wallet: ${walletAddress}`);
        const { data: userStats, error: statsError } = await supabase
            .from('user_stats')
            .select('total_points')
            .eq('wallet_address', walletAddress)
            .single();

        if (statsError || !userStats) {
            console.error('[Stake API] User stats fetch failed:', statsError);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        console.log(`[Stake API] User points: ${userStats.total_points}, Required: ${stakeXP}`);

        if (userStats.total_points < stakeXP) {
            return NextResponse.json({ error: 'Insufficient XP' }, { status: 400 });
        }

        // 2. Deduct XP from user_stats immediately
        console.log(`[Stake API] Deducting ${stakeXP} XP...`);
        const { error: deductError } = await supabase
            .from('user_stats')
            .update({ total_points: userStats.total_points - stakeXP })
            .eq('wallet_address', walletAddress);

        if (deductError) {
            console.error('[Stake API] Deduction failed:', deductError);
            return NextResponse.json({ error: 'Failed to deduct XP' }, { status: 500 });
        }

        // 3. Insert into prophecy_entries (matching DB schema)
        const marketId = prophecyId.startsWith('poly_') ? prophecyId.replace('poly_', '') : prophecyId;
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
            console.error('[Stake API] Prophecy entry insert error:', error);
            await supabase
                .from('user_stats')
                .update({ total_points: userStats.total_points })
                .eq('wallet_address', walletAddress);

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
