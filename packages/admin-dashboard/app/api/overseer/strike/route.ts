import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';

// Types for the response
export interface SystemState {
    globalSuccessRate: number;
    difficulty: string;
    activePlayers: number;
    anomalyLevel: number;
}

export interface GeneratedMission {
    id: string;
    name: string;
    type: string;
    difficulty: string;
    requirements: Record<string, unknown>;
    reward: {
        xp: number;
        badge?: string;
    };
    narrative?: string;
    onChainAddress?: string;
}

export const dynamic = 'force-dynamic';

// POST /api/overseer/strike - Trigger Overseer AI to generate and register a mission
export async function POST(request: NextRequest) {
    try {
        console.log('[Overseer Strike] Initializing mission generation...');

        // Get current system state from user_stats
        const { data: users, error: userError } = await supabase
            .from('user_stats')
            .select('total_missions_attempted, total_missions_completed');

        if (userError) {
            console.error('[Overseer Strike] Error fetching user stats:', userError);
        }

        const totalAttempted = users?.reduce((sum, u) => sum + (u.total_missions_attempted || 0), 0) || 0;
        const totalCompleted = users?.reduce((sum, u) => sum + (u.total_missions_completed || 0), 0) || 0;
        const globalSuccessRate = totalAttempted > 0 ? Math.round((totalCompleted / totalAttempted) * 100) : 50;

        // Determine system difficulty based on success rate
        let difficulty = 'medium';
        let anomalyLevel = 1.0;

        if (globalSuccessRate > 75) {
            difficulty = 'legendary';
            anomalyLevel = 1.5;
        } else if (globalSuccessRate > 50) {
            difficulty = 'hard';
            anomalyLevel = 1.2;
        } else if (globalSuccessRate < 25) {
            difficulty = 'easy';
            anomalyLevel = 0.7;
        }

        // Mission types
        const missionTypes = ['swap', 'volume', 'streak', 'dca', 'prediction', 'staking'];
        const selectedType = missionTypes[Math.floor(Math.random() * missionTypes.length)];

        // Generate mission based on type
        const missionTemplates: Record<string, { name: string; baseXp: number }> = {
            swap: { name: 'Liquidity Directive', baseXp: 250 },
            volume: { name: 'Volume Amplification', baseXp: 350 },
            streak: { name: 'Streak Persistence Protocol', baseXp: 400 },
            dca: { name: 'Dollar Cost Averaging Sequence', baseXp: 300 },
            prediction: { name: 'Market Oracle Prediction', baseXp: 500 },
            staking: { name: 'Stake Validation Order', baseXp: 275 },
        };

        const template = missionTemplates[selectedType];
        const missionId = `quest_${Date.now()}`;
        const xpReward = Math.floor(template.baseXp * anomalyLevel * (Math.random() * 0.5 + 0.75));

        // Generate requirements based on type
        let requirements: Record<string, unknown> = {};
        switch (selectedType) {
            case 'swap':
                requirements = { minAmount: Math.floor(10 * anomalyLevel) };
                break;
            case 'volume':
                requirements = { targetVolume: Math.floor(500 * anomalyLevel) };
                break;
            case 'streak':
                requirements = { requiredDays: Math.ceil(3 * anomalyLevel) };
                break;
            case 'dca':
                requirements = { minAmount: Math.floor(50 * anomalyLevel), intervals: 5 };
                break;
            case 'prediction':
                requirements = { minPredictionValue: Math.floor(100 * anomalyLevel), direction: Math.random() > 0.5 ? 'up' : 'down' };
                break;
            case 'staking':
                requirements = { minStakeValueUsd: Math.floor(200 * anomalyLevel), targetLst: 'JupSOL' };
                break;
        }

        // Create the mission in the database
        const { data: mission, error: missionError } = await supabase
            .from('missions')
            .insert([{
                id: missionId,
                name: template.name,
                description: `Overseer AI generated mission - ${difficulty} difficulty`,
                type: selectedType,
                difficulty: difficulty,
                points: xpReward,
                reset_cycle: 'weekly',
                requirement: requirements,
                is_active: true,
            }])
            .select()
            .single();

        if (missionError) {
            console.error('[Overseer Strike] Error creating mission:', missionError);
            // Continue anyway, we'll return what we generated
        }

        // Generate AI reasoning (simulated for demo - in production, call Ollama)
        const reasoningLines = [
            `Analyzing ${users?.length || 0} players...`,
            `Global success rate: ${globalSuccessRate}%`,
            `System anomaly level: ${anomalyLevel.toFixed(2)}x`,
            `Difficulty adjusted to: ${difficulty.toUpperCase()}`,
            `Generating ${selectedType} mission directive...`,
            `Mission locked and loaded.`,
        ];

        const reasoning = reasoningLines.join('\n');

        // Build response
        const response: {
            success: boolean;
            mission: GeneratedMission;
            systemState: SystemState;
            reasoning: string;
        } = {
            success: true,
            mission: {
                id: missionId,
                name: template.name,
                type: selectedType,
                difficulty: difficulty,
                requirements: requirements,
                reward: {
                    xp: xpReward,
                    badge: difficulty === 'legendary' ? 'Anomaly Hunter' : undefined,
                },
                onChainAddress: mission?.id || missionId,
            },
            systemState: {
                globalSuccessRate,
                difficulty,
                activePlayers: users?.length || 0,
                anomalyLevel,
            },
            reasoning: reasoning,
        };

        console.log('[Overseer Strike] Mission generated successfully:', missionId);

        return NextResponse.json(response);

    } catch (error) {
        logError('[Overseer Strike] Fatal error:', error as Error);
        return NextResponse.json(
            { error: 'Failed to generate mission', details: (error as Error).message },
            { status: 500 }
        );
    }
}
