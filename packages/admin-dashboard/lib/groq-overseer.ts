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
}

export async function getSystemState(): Promise<SystemState> {
    // Get player stats
    const { data: users } = await supabase
        .from('user_stats')
        .select('total_missions_attempted, total_missions_completed');

    const totalAttempted = users?.reduce((sum, u) => sum + (u.total_missions_attempted || 0), 0) || 0;
    const totalCompleted = users?.reduce((sum, u) => sum + (u.total_missions_completed || 0), 0) || 0;
    const successRate = totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 75;

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
    if (successRate < 40) difficulty = 'easy'; // Redundant check, but keeping user's logic

    return {
        globalSuccessRate: successRate,
        difficulty,
        activePlayers: users?.length || 0,
        recentMissions: recentMissions?.map(m => m.name) || []
    };
}

export async function generateMissionWithGroq(systemState: SystemState) {
    const prompt = `You are the Architect from The Matrix, an AI entity that controls the DeFi quest system.

CURRENT SYSTEM STATE:
- Player Success Rate: ${systemState.globalSuccessRate}%
- Active Players: ${systemState.activePlayers}
- Difficulty Setting: ${systemState.difficulty}
- Recent Missions: ${systemState.recentMissions.join(', ')}

MISSION REQUIREMENTS:
1. Create a DeFi trading mission for Solana
2. Difficulty: ${systemState.difficulty}
3. Use Matrix-themed naming (e.g., "Glitch in the System", "Follow the White Rabbit")
4. Include swap requirements (SOL, USDC, BONK, WIF, JUP)

Generate a mission in this EXACT JSON format:
{
  "id": "mission_<timestamp>",
  "name": "Matrix-themed mission name",
  "description": "Engaging description with Matrix references",
  "type": "swap",
  "requirement": {
    "minAmount": <number in SOL>,
    "inputToken": "SOL",
    "outputToken": "USDC"
  },
  "reward": {
    "xp": <100-5000 based on difficulty>,
    "badge": "BADGE_TYPE"
  },
  "difficulty": "${systemState.difficulty}"
}

DIFFICULTY GUIDELINES:
- easy: 0.1-0.5 SOL, 100-250 XP
- medium: 0.5-2 SOL, 250-750 XP
- hard: 2-5 SOL, 750-2000 XP
- extreme: 5+ SOL, 2000-5000 XP

Return ONLY the JSON object, no explanation.`;

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
            model: 'qwen-2.5-32b',
            temperature: 0.8,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message?.content || '{}';
        const missionData = JSON.parse(content);

        // Validate required fields
        if (!missionData.id || !missionData.name || !missionData.type) {
            throw new Error('Invalid mission data from Groq');
        }

        return {
            success: true,
            mission: missionData,
            reasoning: `Generated ${systemState.difficulty} mission. Success rate: ${systemState.globalSuccessRate}%. Adjusted difficulty to challenge players appropriately.`
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
