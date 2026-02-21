import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const MISSION_TEMPLATES: Record<string, { names: string[]; baseXp: number; descriptions: string[] }> = {
    swap: {
        names: ['Liquidity Directive', 'Token Swarm', 'Arbitrage Hunt', 'Protocol Shift', 'DeFi Recon', 'Market Pulse'],
        baseXp: 250,
        descriptions: [
            'Execute a swap through Jupiter to earn XP rewards.',
            'Navigate the token markets with precision.',
            'Hunt for the best routes across Solana DEXs.',
        ],
    },
    streak: {
        names: ['Streak Persistence Protocol', 'Daily Operations', 'Consistency Check', 'Habit Loop', 'Endurance Test'],
        baseXp: 400,
        descriptions: [
            'Maintain your daily trading streak to earn bonus XP.',
            'Consistency is power — return each day to extend your streak.',
            'The machine rewards discipline. Do not break the chain.',
        ],
    },
    prediction: {
        names: ['Market Oracle Prediction', 'Future Sight Protocol', 'Price Action Foresight', 'Trend Analysis', 'Prophecy Directive'],
        baseXp: 500,
        descriptions: [
            'Stake XP on your price predictions. Win big or lose it all.',
            'Channel the Oracle — predict where the market moves next.',
            'The future is unwritten. Make your prediction count.',
        ],
    },
};

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
    easy: 0.7,
    medium: 1.0,
    hard: 1.3,
    legendary: 1.6,
};

/**
 * POST /api/overseer/batch-generate
 * 
 * Admin endpoint for controlled batch mission generation.
 * Accepts: { types: string[], difficulties: string[], count: number }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            types = ['swap', 'streak', 'prediction'],
            difficulties = ['easy', 'medium', 'hard', 'legendary'],
            count = 5
        } = body;

        // Validate
        const validTypes = types.filter((t: string) => MISSION_TEMPLATES[t]);
        if (validTypes.length === 0) {
            return NextResponse.json({ error: 'No valid mission types provided' }, { status: 400 });
        }
        const validDifficulties = difficulties.filter((d: string) => DIFFICULTY_MULTIPLIERS[d] !== undefined);
        if (validDifficulties.length === 0) {
            return NextResponse.json({ error: 'No valid difficulties provided' }, { status: 400 });
        }
        const safeCount = Math.min(Math.max(1, count), 50); // 1-50 range

        const supabase = createClient(supabaseUrl, supabaseKey);
        const generated: any[] = [];

        for (let i = 0; i < safeCount; i++) {
            const type = validTypes[Math.floor(Math.random() * validTypes.length)];
            const difficulty = validDifficulties[Math.floor(Math.random() * validDifficulties.length)];
            const template = MISSION_TEMPLATES[type];
            const name = template.names[Math.floor(Math.random() * template.names.length)];
            const desc = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
            const multiplier = DIFFICULTY_MULTIPLIERS[difficulty];
            const xp = Math.floor(template.baseXp * multiplier * (Math.random() * 0.4 + 0.8));

            const missionData = {
                mission_id: `admin_batch_${Date.now()}_${i}`,
                name: `${name} [#${Math.floor(Math.random() * 9999)}]`,
                description: desc,
                type,
                difficulty,
                points: xp,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('missions').insert([missionData]);
            if (!error) {
                generated.push(missionData);
            }
        }

        return NextResponse.json({
            success: true,
            generated: generated.length,
            requested: safeCount,
            missions: generated,
        });
    } catch (error) {
        console.error('[Batch Generate] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
