import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

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
        if (types.length === 0 || difficulties.length === 0) {
            return NextResponse.json({ error: 'Missing types or difficulties' }, { status: 400 });
        }
        const safeCount = Math.min(Math.max(1, count), 10); // Keep batch size small for LLM

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Market State
        const livePrices = await fetchTokenPrices();
        const marketState = PREDICTION_TOKENS.reduce((acc, token) => {
            acc[token.symbol] = {
                price: livePrices ? livePrices[token.symbol] : 0,
                trend: Math.random() > 0.5 ? 'pumping' : 'bleeding' // Mock trend for now
            };
            return acc;
        }, {} as Record<string, any>);

        // 2. Fetch Player State (pick a random active player to target the batch, or a generic aggregate if none exist)
        const { data: users } = await supabase.from('user_stats').select('*').limit(50);
        let playerState = {
            current_streak: 4,
            prediction_win_rate: "65%",
            last_active: "2h ago",
            top_swap_pair: "SOL→USDC",
            completed_missions_today: 2,
            xp: 4500
        };

        if (users && users.length > 0) {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            playerState = {
                current_streak: randomUser.current_streak || Math.floor(Math.random() * 5),
                prediction_win_rate: "50%", // Mocked for now
                last_active: "1h ago",
                top_swap_pair: "SOL→USDC",
                completed_missions_today: randomUser.missions_completed_today || 0,
                xp: randomUser.total_xp || 0
            };
        }

        // 3. Fetch Batch History (last 3 missions)
        const { data: recentMissions } = await supabase
            .from('missions')
            .select('id, name, type')
            .order('created_at', { ascending: false })
            .limit(3);
        const batchHistory = recentMissions ? recentMissions.map(m => m.id) : [];

        // 4. Construct Master Prompt
        const systemPrompt = `
You are OVERSEER, a cold, analytical, deterministic AI running a decentralized prediction/swap market.
Generate exactly ${safeCount} missions in pure JSON format matching the requested types and difficulties.

OVERSEER_CONTEXT_INJECTION
MARKET_STATE:
${JSON.stringify(marketState, null, 2)}

PLAYER_STATE:
${JSON.stringify(playerState, null, 2)}

BATCH_HISTORY (last 3 missions):
${JSON.stringify(batchHistory)}

OVERSEER GENERATION ORDER:
1. Read MARKET_STATE.
2. Read PLAYER_STATE.
3. Generate mission connecting market to player arc.
4. Write flavor text LAST.

OVERSEER VOICE - UPGRADED RULES:
- CHALLENGER MODE (streak > 3): Respect mixed with escalation. "Six days. The chain doesn't lie..."
- RESURRECTOR MODE (inactive/broken streak): Cold. Factual. "72 hours offline. The market moved..."
- PRESSURE MODE (losing predictions): Analytical. Adversarial. "Your last three predictions were wrong..."

HARD CONSTRAINTS:
- No horizons over 24h.
- No duplicate pairs or titles in this batch.
- Batch must contain varying difficulties (EASY, MEDIUM, HARD).
- Voice must be max 2 sentences, citing specific tokens and prices. NEVER use generic hype phrases.

MISSION TYPES:

[SWAP]
EASY (1.2x | 250 XP): 24h window. "Swap at least $10 of SOL -> USDC using Jupiter."
MEDIUM (1.75x | 500 XP): 12h window. "Execute JUP -> BONK swap worth $50."
HARD (3.0x | 1000 XP): 6h window. Multi-hop or exact slippage.
Format: #INPUT_OUTPUT_TIER (e.g. #SOL_USDC_EASY)

[STREAK]
EASY (1.5x | 300 XP): 3 day streak, 1 grace day.
MEDIUM (2.0x | 750 XP): 5 day streak, no grace.
HARD (3.0x | 2000 XP): 7 day streak, no grace.
LEGENDARY (10x | 15000 XP): 30 day streak.
Format: #STREAK_3D_EASY

[PREDICTION]
EASY (1.2x | 500 XP): 15m-1h window. Directional.
MEDIUM (1.75x | 800 XP): 2h-6h. Directional + magnitude.
HARD (3.0x | 1500 XP): 12h-24h. Holding for consecutive minutes.
Format: #TOKEN_CONDITION_TIMEFRAME (e.g. #JUP_BREAKOUT_1HR)

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "missions": [
    {
      "mission_id": "string (e.g. prophecy_1234)",
      "name": "string (the hashtag title)",
      "description": "string (Condition + \n\n[OVERSEER] Flavor text)",
      "type": "swap|streak|prediction",
      "difficulty": "easy|medium|hard|legendary",
      "points": number,
      "multiplier": number,
      "timeframeHours": number,
      "conditionType": "string (e.g. price_above, swap_pair)",
      "conditionValue": any (object containing target details)
    }
  ]
}

Requested Batch Specs:
Types: ${types.join(', ')}
Difficulties: ${difficulties.join(', ')}
Total Count: ${safeCount}
`;

        // 5. Call Groq
        console.log('[Batch Generate] Sending prompt to Groq (llama-3.3-70b-versatile)...');

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
        });

        const llmResponse = chatCompletion.choices[0]?.message?.content || "";
        console.log('[Batch Generate] Received Groq response', llmResponse);

        let parsedMissions: { missions: any[] } = { missions: [] };
        try {
            parsedMissions = JSON.parse(llmResponse);
        } catch (e) {
            console.error('[Batch Generate] JSON parse failed on LLM response', e);
            return NextResponse.json({ error: 'LLM generated invalid JSON' }, { status: 500 });
        }

        // 6. Save to Supabase
        const generated = [];
        for (const m of parsedMissions.missions) {
            const missionData = {
                mission_id: m.mission_id || `mission_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
                name: m.name,
                description: m.description,
                type: m.type,
                difficulty: m.difficulty,
                points: m.points,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Store condition specifics in a jsonb column if we have one, otherwise ignore or map
                // requirement: m.conditionValue <-- map if requirement column exists
            };

            const { error, data } = await supabase.from('missions').insert([missionData]).select();
            if (!error && data) {
                generated.push(data[0]);
            } else {
                console.error('[Batch Generate] Insert failed for mission', m.name, error);
            }
        }

        return NextResponse.json({
            success: true,
            generated: generated.length,
            requested: safeCount,
            missions: generated,
            reasoning: "Generated natively via Groq (llama-3.3-70b).",
        });

    } catch (error) {
        console.error('[Batch Generate] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
