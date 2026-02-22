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

// ─── Token Whitelist for Predictions ────────────────────────────────────────
const PREDICTION_TOKENS = [
    { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbAbdMdKkmds' },
    { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112' },
    { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
    { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYtM22BBG6b' },
];

/** Fetch live prices from Jupiter Price API */
async function fetchTokenPrices() {
    try {
        const ids = PREDICTION_TOKENS.map((t) => t.mint).join(',');
        const res = await fetch(`https://api.jup.ag/price/v2?ids=${ids}`);
        const data = await res.json();
        const priceMap: Record<string, number> = {};
        for (const token of PREDICTION_TOKENS) {
            priceMap[token.symbol] = parseFloat(data.data[token.mint]?.price || '0');
        }
        return priceMap;
    } catch (error) {
        console.error('Failed to fetch Jupiter prices', error);
        return null;
    }
}

/** Generate a strict prediction mission according to the new Oracle spec */
function generatePredictionMission(difficulty: string, livePrices: Record<string, number> | null) {
    if (!livePrices) return null; // Fallback to swap/streak if api fails

    const token = PREDICTION_TOKENS[Math.floor(Math.random() * PREDICTION_TOKENS.length)].symbol;
    const currentPrice = livePrices[token];
    if (!currentPrice) return null;

    let timeFormat = '';
    let timeframeHours = 1;
    let multiplier = 1.2;
    let title = '';
    let description = '';
    let condition = {};
    let targetPrice = 0;
    const direction = Math.random() > 0.5 ? 'above' : 'below';

    // TIER 1 (EASY): Single condition, short window (15m - 1h)
    if (difficulty === 'easy') {
        timeframeHours = (Math.floor(Math.random() * 3) + 1) * 0.25; // 15m, 30m, 45m, 60m
        const mins = timeframeHours * 60;
        timeFormat = `${mins}MIN`;
        multiplier = 1.2 + (Math.random() * 0.3); // 1.2x - 1.5x

        targetPrice = direction === 'above'
            ? currentPrice * (1 + (Math.random() * 0.02 + 0.005)) // 0.5% to 2.5% up
            : currentPrice * (1 - (Math.random() * 0.02 + 0.005));

        title = `#${token}_${direction === 'above' ? 'BREAKOUT' : 'DUMP'}_${timeFormat}`;
        description = `Will ${token} be ${direction} $${targetPrice.toFixed(4)} in ${mins} minutes? Current: $${currentPrice.toFixed(4)}.`;

        condition = {
            token,
            targetPrice: targetPrice.toFixed(4),
            direction,
            timeframeMinutes: mins
        };
    }
    // TIER 2 (MEDIUM): Directional + magnitude (1 - 6 hours)
    else if (difficulty === 'medium') {
        timeframeHours = Math.floor(Math.random() * 5) + 2; // 2h - 6h
        timeFormat = `${timeframeHours}HR`;
        multiplier = 1.75 + (Math.random() * 0.25); // 1.75x - 2x
        const percent = Math.floor(Math.random() * 5) + 3; // 3% to 7%

        targetPrice = direction === 'above'
            ? currentPrice * (1 + (percent / 100))
            : currentPrice * (1 - (percent / 100));

        title = `#${token}_${direction === 'above' ? 'PUMP' : 'BLEED'}_${timeFormat}`;
        description = `Will ${token} move ${direction === 'above' ? 'up' : 'down'} more than ${percent}% before ${timeframeHours} hours? Current: $${currentPrice.toFixed(4)}.`;

        condition = {
            token,
            targetPrice: targetPrice.toFixed(4),
            direction,
            percentMove: percent,
            timeframeHours: timeframeHours
        };
    }
    // TIER 3 (HARD/LEGENDARY): Multi-condition or long duration (6 - 24 hours max)
    else {
        timeframeHours = Math.floor(Math.random() * 12) + 12; // 12h - 24h
        timeFormat = `${timeframeHours}HR`;
        multiplier = difficulty === 'legendary' ? 5.0 : 3.0 + (Math.random() * 1.5); // 3x - 4.5x or 5x

        targetPrice = direction === 'above'
            ? currentPrice * (1 + (Math.random() * 0.10 + 0.05)) // 5 - 15% up
            : currentPrice * (1 - (Math.random() * 0.10 + 0.05));

        const holdingMins = 30;

        title = `#${token}_${direction === 'above' ? 'HOLD' : 'RESISTANCE'}_${timeFormat}`;
        description = `Will ${token} hit $${targetPrice.toFixed(4)} AND hold it for ${holdingMins} consecutive minutes within the next ${timeframeHours} hours?`;

        condition = {
            token,
            targetPrice: targetPrice.toFixed(4),
            direction,
            holdingMinutesRequired: holdingMins,
            timeframeHours: timeframeHours
        };
    }

    const xpReward = Math.floor(BASE_XP.prediction * multiplier);

    // Overseer Flavor Text per spec
    const flavors = [
        `${token} is coiling at $${currentPrice.toFixed(4)}. The network is holding its breath. Will it ${direction === 'above' ? 'break' : 'bleed to'} $${targetPrice.toFixed(4)} before the window closes?`,
        `Sensors indicate abnormal momentum. ${token} sits at $${currentPrice.toFixed(4)}. I project a shift to $${targetPrice.toFixed(4)} in the given timeframe. Prove me wrong.`,
        `The timeline is fracturing. $${currentPrice.toFixed(4)} is unstable for ${token}. Stake your XP on $${targetPrice.toFixed(4)} unfolding within the parameters.`,
        `Analyzing ${token} sentiment vs liquidity. Current node: $${currentPrice.toFixed(4)}. Probability engine expects $${targetPrice.toFixed(4)}. You have one chance to claim this bounty.`
    ];

    const flavor = flavors[Math.floor(Math.random() * flavors.length)];

    return {
        missionId: `prophecy_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
        name: title,
        description: `${description}\n\n[OVERSEER] ${flavor}`,
        type: 'prediction',
        difficulty,
        xp: xpReward,
        multiplier: parseFloat(multiplier.toFixed(2)),
        timeframeHours,
        condition,
        personality: 'The Oracle', // Hardcode or pass from parent
        reasoning: `[The Oracle] Fetched live Jupiter price for ${token}: $${currentPrice.toFixed(4)}. Generated ${timeFormat} strict prediction window.`
    };
}

/**
 * Generate a single AI-flavoured mission.
 */
function generateAIMission(
    type: string,
    difficulty: string,
    personality: typeof PERSONALITIES[0],
    systemState: { anomalyLevel: number; activePlayers: number },
    livePrices: Record<string, number> | null
) {
    if (type === 'prediction') {
        const pm = generatePredictionMission(difficulty, livePrices);
        if (pm) return pm;
        // fallback to swap if API failed
        type = 'swap';
    }

    const ctx = TYPE_CONTEXT[type] || TYPE_CONTEXT.swap;
    const diff = DIFFICULTY_XP[difficulty] || DIFFICULTY_XP.medium;
    const verb = ctx.verbs[Math.floor(Math.random() * ctx.verbs.length)];
    const obj = ctx.objectives[Math.floor(Math.random() * ctx.objectives.length)];

    const thematicNouns: Record<string, string[]> = {
        swap: ['Directive', 'Convergence', 'Recon Protocol', 'Flux Sequence', 'Cascade', 'Vector'],
        streak: ['Persistence Loop', 'Endurance Chain', 'Daily Cipher', 'Clock Protocol', 'Continuity Arc'],
    };
    const nouns = thematicNouns[type] || thematicNouns.swap;
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const missionName = `${verb} ${noun}`;

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

    const xpReward = Math.floor(
        (BASE_XP[type] || 250) * diff.multiplier * systemState.anomalyLevel * (Math.random() * 0.4 + 0.8)
    );

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

        // Fetch live Jupiter prices once for the batch
        const livePrices = await fetchTokenPrices();

        // Generate each mission via the AI Overseer
        const generated: any[] = [];
        const allReasoning: string[] = [];

        for (let i = 0; i < safeCount; i++) {
            const type = validTypes[Math.floor(Math.random() * validTypes.length)];
            const difficulty = validDifficulties[Math.floor(Math.random() * validDifficulties.length)];
            const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];

            const mission = generateAIMission(type, difficulty, personality, systemState, livePrices);

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
