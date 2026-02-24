import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SPIN_COST = 100;

export async function POST(req: Request) {
    try {
        const { walletAddress } = await req.json();

        if (!walletAddress) {
            return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
        }

        // 1. Get current stats
        const { data: currentStats, error: fetchError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('wallet_address', walletAddress)
            .single();

        if (fetchError || !currentStats) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (currentStats.total_points < SPIN_COST) {
            return NextResponse.json({ error: 'Not enough XP to spin' }, { status: 400 });
        }

        // 2. Calculate spin result
        const rand = Math.random() * 100;
        let reward = 0;
        let tier = 'NULL';
        let color = '#ef4444'; // Red for nothing

        if (rand < 1) { // 1% chance for Jackpot
            reward = 5000;
            tier = 'JACKPOT';
            color = '#fbbf24'; // yellow-400
        } else if (rand < 5) { // 4% chance for Legendary
            reward = 2500;
            tier = 'LEGENDARY';
            color = '#f43f5e'; // rose-500
        } else if (rand < 15) { // 10% chance for Epic
            reward = 1000;
            tier = 'EPIC';
            color = '#c084fc'; // purple-400
        } else if (rand < 35) { // 20% chance for Rare
            reward = Math.floor(Math.random() * (500 - 200 + 1)) + 200;
            tier = 'RARE';
            color = '#60a5fa'; // blue-400
        } else if (rand < 65) { // 30% chance for Common
            reward = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
            tier = 'COMMON';
            color = '#4ade80'; // green-400
        } else {
            // 35% chance for nothing
            reward = 0;
            tier = 'NULL_VOID';
            color = '#ef4444'; // red-500
        }

        const xpChange = reward - SPIN_COST;
        const newPoints = currentStats.total_points + xpChange;

        // 3. Deduct/Award XP
        const { error: updateError } = await supabase.from('user_stats').update({
            total_points: Math.max(0, newPoints),
        }).eq('wallet_address', walletAddress);

        if (updateError) {
            throw updateError;
        }

        // 4. Log activity
        await supabase.from('activity_log').insert({
            wallet_address: walletAddress,
            action: 'casino_spin',
            details: {
                cost: SPIN_COST,
                reward: reward,
                tier: tier,
                net_change: xpChange
            }
        });

        return NextResponse.json({
            success: true,
            reward,
            tier,
            color,
            xpChange,
            newBalance: Math.max(0, newPoints)
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
    }
}
