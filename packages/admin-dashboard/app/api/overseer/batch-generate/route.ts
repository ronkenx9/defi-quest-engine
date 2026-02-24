import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Read walletAddress from query params instead of body (for GET requests)
        const walletAddress = request.nextUrl.searchParams.get('walletAddress');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch live market data from Jupiter Price API
        let jupPrice = "0.80", solPrice = "150.00", bonkPrice = "0.000020", wifPrice = "1.20";
        try {
            const res = await fetch('https://api.jup.ag/price/v2?ids=JUP,SOL,BONK,WIF');
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    if (data.data.JUP?.price) jupPrice = parseFloat(data.data.JUP.price).toFixed(4);
                    if (data.data.SOL?.price) solPrice = parseFloat(data.data.SOL.price).toFixed(2);
                    if (data.data.BONK?.price) bonkPrice = parseFloat(data.data.BONK.price).toFixed(8);
                    if (data.data.WIF?.price) wifPrice = parseFloat(data.data.WIF.price).toFixed(4);
                }
            }
        } catch (e) {
            console.warn('[Overseer] Failed to fetch Jupiter prices, using fallback');
        }

        // Fetch active players
        let players = [];
        if (walletAddress) {
            const { data } = await supabase.from('user_stats').select('*').eq('wallet_address', walletAddress).single();
            if (data) players.push(data);
        } else {
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data } = await supabase.from('user_stats').select('*').gte('last_active_at', oneDayAgo);
            if (data) players = data;
        }

        if (players.length === 0) {
            return NextResponse.json({ success: true, message: 'No active players found', missions: [], count: 0 });
        }

        const allGeneratedMissions = [];

        for (const player of players) {
            const streak = player.current_streak || 0;
            const level = player.level || 1;
            const totalPoints = player.total_xp || 0;
            const lastActive = player.last_active_at || 'unknown';

            const prompt = `
MARKET_STATE:
JUP: $${jupPrice}
SOL: $${solPrice}
BONK: $${bonkPrice}
WIF: $${wifPrice}

PLAYER_STATE:
streak: ${streak} days
level: ${level}
xp: ${totalPoints}
last_active: ${lastActive}

You are Overseer. Generate exactly 3 missions as a JSON array.

Example structure:
[
  {
    "name": "Neo's Awakening",
    "description": "Take the red pill. Swap 100 USDC for JUP to begin your journey.",
    "type": "swap",
    "difficulty": "easy",
    "points": 150,
    "requirement": {
      "swap": { 
        "minUsdValue": 100, 
        "inputToken": "USDC", 
        "outputToken": "JUP", 
        "windowHours": 24 
      }
    },
    "is_active": true,
    "reset_cycle": "none",
    "created_by": "overseer"
  }
]

RULES:
- One easy, one medium, one hard — always
- Time windows: 1-24 hours maximum
- Swap missions: only use JUP, SOL, BONK, WIF, USDC pairs
- Prediction missions: reference the EXACT price from MARKET_STATE
- Never use phrases like "the matrix demands it"
- Reference specific prices in every description
- Output a raw JSON array only. No markdown. No text outside JSON.
`;

            let retries = 1;
            let success = false;
            let missionsForPlayer = [];

            while (retries >= 0 && !success) {
                try {
                    const groqApiKey = process.env.GROQ_API_KEY;
                    if (!groqApiKey) {
                        return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
                    }

                    const Groq = (await import('groq-sdk')).default;
                    const groq = new Groq({ apiKey: groqApiKey });

                    const chatCompletion = await groq.chat.completions.create({
                        messages: [
                            { role: 'system', content: 'You are the Overseer. Return only raw JSON arrays representing missions.' },
                            { role: 'user', content: prompt }
                        ],
                        model: 'qwen/qwen3-32b',
                        temperature: 0.7,
                        max_tokens: 1500,
                        response_format: { type: 'json_object' }
                    });

                    let responseText = chatCompletion.choices[0]?.message?.content || '[]';

                    // Parse the JSON (handle both wrapping object containing an array, or just an array)
                    let parsedData;
                    try {
                        parsedData = JSON.parse(responseText);
                    } catch (e) {
                        // Sometimes the JSON might have markdown block wrappers
                        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                        parsedData = JSON.parse(responseText);
                    }

                    // Extract array if wrapped in an object like { "missions": [] }
                    if (!Array.isArray(parsedData) && typeof parsedData === 'object') {
                        const keys = Object.keys(parsedData);
                        for (const key of keys) {
                            if (Array.isArray(parsedData[key])) {
                                parsedData = parsedData[key];
                                break;
                            }
                        }
                    }

                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        missionsForPlayer = parsedData;
                        success = true;
                    } else {
                        throw new Error('Not an array');
                    }
                } catch (e) {
                    console.error('Failed to parse Groq response', e);
                    retries--;
                    if (retries >= 0) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }

            if (!success) {
                return NextResponse.json({ error: 'Failed to generate missions after retries' }, { status: 500 });
            }

            // Map & insert to DB according to the actual Supabase schema
            for (const m of missionsForPlayer) {
                const uniqueId = `overseer_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

                let input_token = null;
                let output_token = null;
                let min_amount = null;

                if (m.requirement?.swap) {
                    input_token = m.requirement.swap.inputToken;
                    output_token = m.requirement.swap.outputToken;
                    min_amount = m.requirement.swap.minUsdValue;
                } else if (m.requirement?.prediction) {
                    input_token = m.requirement.prediction.token;
                    min_amount = m.requirement.prediction.targetPrice;
                } else if (m.requirement?.streak) {
                    min_amount = m.requirement.streak.minDailyUsdValue;
                }

                const missionData = {
                    mission_id: uniqueId,
                    name: m.name || `overseer_mission`,
                    description: m.description,
                    type: m.type || 'swap',
                    difficulty: m.difficulty || 'medium',
                    points: m.points || 500,
                    input_token,
                    output_token,
                    min_amount,
                    requirement: m.requirement || {},
                    is_active: true,
                    created_at: new Date().toISOString()
                };

                const { error, data } = await supabase.from('missions').insert([missionData]).select();
                if (data) {
                    allGeneratedMissions.push(data[0]);
                } else {
                    console.error('Failed to insert mission:', error);
                }
            }
        }

        return NextResponse.json({ success: true, count: allGeneratedMissions.length, missions: allGeneratedMissions });

    } catch (e: any) {
        console.error('Unhandled error:', e);
        return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
    }
}
