import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Overseer AI Personalities ──────────────────────────────────────────────
const PERSONALITIES = [
    { name: 'The Architect', tone: 'calculating, technical, methodical' },
    { name: 'Agent Smith', tone: 'aggressive, relentless, superior' },
    { name: 'The Oracle', tone: 'mysterious, prophetic, cryptic' },
];

// ─── Mission flavour banks per type ─────────────────────────────────────────
const TYPE_CONTEXT: Record<string, { domain: string; verbs: string[]; objectives: string[] }> = {
    swap: {
        domain: 'token swap / DEX liquidity',
        verbs: ['Execute', 'Route', 'Arbitrage', 'Rebalance', 'Channel'],
        objectives: ['swap tokens via Jupiter', 'navigate DEX routes', 'exchange assets across protocols', 'rebalance portfolio allocation'],
    },
    streak: {
        domain: 'daily consistency / habit formation',
        verbs: ['Maintain', 'Persist', 'Sustain', 'Endure', 'Fortify'],
        objectives: ['maintain daily activity', 'extend your streak', 'prove operational consistency', 'log in consecutively'],
    },
    prediction: {
        domain: 'price prophecy / market forecasting',
        verbs: ['Predict', 'Foresee', 'Prophesy', 'Channel', 'Divine'],
        objectives: ['stake XP on a price prediction', 'forecast token movements', 'channel the Oracle\'s foresight', 'predict where the market moves'],
    },
};

const DIFFICULTY_XP: Record<string, { multiplier: number; adjective: string }> = {
    easy: { multiplier: 0.7, adjective: 'routine' },
    medium: { multiplier: 1.0, adjective: 'standard' },
    hard: { multiplier: 1.3, adjective: 'challenging' },
    legendary: { multiplier: 1.6, adjective: 'anomalous' },
};

const BASE_XP: Record<string, number> = {
    swap: 250,
    streak: 400,
    prediction: 500,
};

/**
 * Generate a single AI-flavoured mission.
 * 
 * Uses the Overseer personality + type context to produce
 * a unique, narrative-driven mission name and description.
 */
function generateAIMission(
    type: string,
    difficulty: string,
    personality: typeof PERSONALITIES[0],
    systemState: { anomalyLevel: number; activePlayers: number }
) {
    const ctx = TYPE_CONTEXT[type] || TYPE_CONTEXT.swap;
    const diff = DIFFICULTY_XP[difficulty] || DIFFICULTY_XP.medium;
    const verb = ctx.verbs[Math.floor(Math.random() * ctx.verbs.length)];
    const obj = ctx.objectives[Math.floor(Math.random() * ctx.objectives.length)];

    // AI-generated name: [Verb] + thematic noun
    const thematicNouns: Record<string, string[]> = {
        swap: ['Directive', 'Convergence', 'Recon Protocol', 'Flux Sequence', 'Cascade', 'Vector'],
        streak: ['Persistence Loop', 'Endurance Chain', 'Daily Cipher', 'Clock Protocol', 'Continuity Arc'],
        prediction: ['Oracle Decree', 'Prophecy Signal', 'Foresight Matrix', 'Temporal Wager', 'Future Sight'],
    };
    const nouns = thematicNouns[type] || thematicNouns.swap;
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const missionName = `${verb} ${noun}`;

    // AI-generated description using personality tone
    const descriptions: Record<string, string[]> = {
        'The Architect': [
            `The system requires precision. ${obj} at ${diff.adjective} parameters. The Architect is watching.`,
            `Structural analysis indicates an optimal window. ${obj} — the matrix demands it.`,
            `Calculated directive: ${obj}. Difficulty calibrated to ${difficulty}. Execute with precision.`,
        ],
        'Agent Smith': [
            `You think you can handle this? ${obj}. Prove you're not just another anomaly.`,
            `The system has flagged a ${diff.adjective} objective: ${obj}. Fail, and you'll be purged.`,
            `Don't waste my time. ${obj} at ${difficulty} intensity. The matrix has no room for weakness.`,
        ],
        'The Oracle': [
            `I've seen what happens next. ${obj}… but the outcome depends on you.`,
            `The path is ${diff.adjective}, but not impossible. ${obj}. The signs are clear.`,
            `A vision came to me: ${obj}. Whether you succeed… that part is still unwritten.`,
        ],
    };

    const descPool = descriptions[personality.name] || descriptions['The Architect'];
    const description = descPool[Math.floor(Math.random() * descPool.length)];

    // XP calculation with anomaly level
    const xpReward = Math.floor(
        (BASE_XP[type] || 250) * diff.multiplier * systemState.anomalyLevel * (Math.random() * 0.4 + 0.8)
    );

    // AI reasoning trace
    const reasoning = [
        `[${personality.name}] Analyzing ${systemState.activePlayers} operators…`,
        `Anomaly level: ${systemState.anomalyLevel.toFixed(2)}x — ${diff.adjective} conditions detected`,
        `Mission domain: ${ctx.domain}`,
        `Generating ${difficulty.toUpperCase()} ${type} directive…`,
        `"${missionName}" locked. Reward: ${xpReward} XP.`,
    ].join('\n');

    return {
        missionId: `overseer_${personality.name.replace(/\s/g, '_').toLowerCase()}_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
        name: missionName,
        description,
        type,
        difficulty,
        xp: xpReward,
        personality: personality.name,
        reasoning,
    };
}

/**
 * POST /api/overseer/batch-generate
 * 
 * AI-powered batch mission generation.
 * The Overseer AI generates each mission using personality-driven
 * narratives, constrained to the admin's selected types & difficulties.
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
        const validTypes = types.filter((t: string) => TYPE_CONTEXT[t]);
        if (validTypes.length === 0) {
            return NextResponse.json({ error: 'No valid mission types provided' }, { status: 400 });
        }
        const validDifficulties = difficulties.filter((d: string) => DIFFICULTY_XP[d]);
        if (validDifficulties.length === 0) {
            return NextResponse.json({ error: 'No valid difficulties provided' }, { status: 400 });
        }
        const safeCount = Math.min(Math.max(1, count), 50);

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Pull live system state (same as overseer/strike)
        const { data: users } = await supabase
            .from('user_stats')
            .select('total_missions_attempted, total_missions_completed');

        const totalAttempted = users?.reduce((sum, u) => sum + (u.total_missions_attempted || 0), 0) || 0;
        const totalCompleted = users?.reduce((sum, u) => sum + (u.total_missions_completed || 0), 0) || 0;
        const globalSuccessRate = totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 50;

        let anomalyLevel = 1.0;
        if (globalSuccessRate > 75) anomalyLevel = 1.5;
        else if (globalSuccessRate > 50) anomalyLevel = 1.2;
        else if (globalSuccessRate < 25) anomalyLevel = 0.7;

        const systemState = { anomalyLevel, activePlayers: users?.length || 0 };

        // Generate each mission via the AI Overseer
        const generated: any[] = [];
        const allReasoning: string[] = [];

        for (let i = 0; i < safeCount; i++) {
            const type = validTypes[Math.floor(Math.random() * validTypes.length)];
            const difficulty = validDifficulties[Math.floor(Math.random() * validDifficulties.length)];
            const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

            const mission = generateAIMission(type, difficulty, personality, systemState);

            const missionData = {
                mission_id: mission.missionId,
                name: mission.name,
                description: mission.description,
                type: mission.type,
                difficulty: mission.difficulty,
                points: mission.xp,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('missions').insert([missionData]);
            if (!error) {
                generated.push({ ...missionData, personality: mission.personality });
                allReasoning.push(mission.reasoning);
            }
        }

        return NextResponse.json({
            success: true,
            generated: generated.length,
            requested: safeCount,
            missions: generated,
            reasoning: allReasoning.join('\n\n'),
            systemState: {
                globalSuccessRate,
                anomalyLevel,
                activePlayers: systemState.activePlayers,
            },
        });
    } catch (error) {
        console.error('[Batch Generate] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
