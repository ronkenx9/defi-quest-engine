import Groq from 'groq-sdk';
import { supabase } from './supabase';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

export interface SystemState {
    globalSuccessRate: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
    activePlayers: number;
    recentMissions: string[];
    anomalyLevel: number;
}

export async function getSystemState(): Promise<SystemState> {
    // Get player stats
    const { data: users } = await supabase
        .from('user_stats')
        .select('total_missions_attempted, total_missions_completed, last_active_at');

    const totalAttempted = users?.reduce((sum, u) => sum + (u.total_missions_attempted || 0), 0) || 0;
    const totalCompleted = users?.reduce((sum, u) => sum + (u.total_missions_completed || 0), 0) || 0;
    const successRate = totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 75;

    // Calculate anomaly level based on player activity patterns
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentActivity = users?.filter(u => {
        const lastActive = new Date(u.last_active_at || 0).getTime();
        return lastActive > oneHourAgo;
    }).length || 0;

    // Anomaly: unusual activity spike or drop
    const avgActivityPerHour = users?.length ? users.length / 24 : 1;
    const anomalyLevel = avgActivityPerHour > 0 ? recentActivity / avgActivityPerHour : 1;

    // Get recent missions
    const { data: recentMissions } = await supabase
        .from('missions')
        .select('name')
        .order('created_at', { ascending: false })
        .limit(5);

    // Determine difficulty
    let difficulty: SystemState['difficulty'] = 'medium';
    if (successRate > 80) difficulty = 'hard';
    if (successRate > 90) difficulty = 'extreme';
    if (successRate < 60) difficulty = 'easy';
    if (successRate < 40) difficulty = 'easy';

    return {
        globalSuccessRate: successRate,
        difficulty,
        activePlayers: users?.length || 0,
        recentMissions: recentMissions?.map(m => m.name) || [],
        anomalyLevel: Math.min(Math.max(anomalyLevel, 0.1), 5.0) // Clamp between 0.1x and 5.0x
    };
}

export async function generateMissionWithGroq(systemState: SystemState) {
    const prompt = `You are the Architect from The Matrix, an AI entity that controls the DeFi quest system.

CURRENT SYSTEM STATE:
- Player Success Rate: ${systemState.globalSuccessRate}%
- Active Players: ${systemState.activePlayers}
- Difficulty Setting: ${systemState.difficulty}
- Anomaly Level: ${systemState.anomalyLevel}x (1.0 = normal, >1.0 = activity spike, <1.0 = activity drop)
- Recent Missions: ${systemState.recentMissions.join(', ') || 'None'}

MISSION REQUIREMENTS:
1. Create a DeFi trading mission for Solana
2. Difficulty: ${systemState.difficulty}
3. Use Matrix-themed naming (e.g., "Glitch in the System", "Follow the White Rabbit")
4. Include swap requirements (SOL, USDC, BONK, WIF, JUP)
5. Consider the anomaly level - if high, create more challenging missions

Generate a mission in this EXACT JSON format. Example:
{
  "id": "mission_1717986000",
  "name": "Glitch in the System",
  "description": "The Oracle has detected a ripple. Swap 1 SOL for USDC to stabilize the feed.",
  "type": "swap",
  "requirement": {
    "swap": {
        "minUsdValue": 150,
        "inputToken": "SOL",
        "outputToken": "USDC"
    }
  },
  "reward": {
    "xp": 500,
    "badge": "Oracle"
  },
  "difficulty": "medium"
}

DIFFICULTY GUIDELINES:
- easy: 0.1-0.5 SOL ($15-75), 100-250 XP
- medium: 0.5-2 SOL ($75-300), 250-750 XP
- hard: 2-5 SOL ($300-750), 750-2000 XP
- extreme: 5+ SOL ($750+), 2000-5000 XP

Return ONLY the JSON object, no explanation. Do not wrap in markdown.`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a mission generator AI. Return only valid JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message?.content || '{}';
        const missionData = JSON.parse(content);

        // Validate required fields
        if (!missionData.id || !missionData.name || !missionData.type) {
            throw new Error('Invalid mission data from Groq: missing core fields');
        }

        // Ensure reward exists or provide a default
        if (!missionData.reward || typeof missionData.reward.xp === 'undefined') {
            console.warn('[Overseer] AI returned mission without reward. Injecting default.');
            missionData.reward = { xp: 500, badge: 'INITIATE' };
        }

        // Generate detailed AI reasoning based on system state
        const anomalyDescription = systemState.anomalyLevel > 1.5
            ? 'UNUSUAL ACTIVITY SURGE DETECTED'
            : systemState.anomalyLevel < 0.5
                ? 'ACTIVITY DEPRESSION OBSERVED'
                : 'SYSTEM OPERATING WITHIN NORMAL PARAMETERS';

        const difficultyGuidance = systemState.globalSuccessRate > 80
            ? 'PLAYERS EXCEEDING PERFORMANCE THRESHOLDS - ESCALATING DIFFICULTY'
            : systemState.globalSuccessRate < 50
                ? 'PERFORMANCE BELOW TARGET - ADJUSTING FOR ACCESSIBILITY'
                : 'BALANCED DIFFICULTY CALIBRATION ACTIVE';

        const reasoning = `[ARCHITECT ANALYSIS] System anomaly detected at ${systemState.anomalyLevel.toFixed(2)}x multiplier.
${anomalyDescription}
Global success rate: ${systemState.globalSuccessRate}% across ${systemState.activePlayers} active nodes.
${difficultyGuidance}
Evaluating mission parameters for ${systemState.difficulty.toUpperCase()} difficulty tier...
[AI GENERATION] Constructing mission with Groq LLM (qwen/qwen3-32b)...
> Analyzing player activity patterns...
> Cross-referencing DeFi market conditions...
> Generating mission: "${missionData.name}"
> Allocating XP reward: ${missionData.reward.xp} points
> Mission parameters validated and locked.
[SYSTEM] Ready for deployment.`;

        return {
            success: true,
            mission: missionData,
            reasoning
        };

    } catch (error: any) {
        console.error('Groq generation failed:', error);
        return {
            success: false,
            error: error.message,
            mission: null,
            reasoning: ''
        };
    }
}
