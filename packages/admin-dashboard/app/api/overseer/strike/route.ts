import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/logger';
import { generateMissionWithGroq, getSystemState } from '@/lib/groq-overseer';

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
        console.log('[Overseer Strike] Initializing Groq mission generation...');

        let body;
        try {
            const rawBody = await request.text();
            body = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
            body = {};
        }

        // ✅ CRITICAL: Validate input
        if (!body || Object.keys(body).length === 0) {
            return Response.json({
                success: false,
                error: 'Empty request body'
            }, { status: 400 });
        }

        // Get current system state using our new Groq service
        const systemState = await getSystemState();

        console.log('[Overseer] System State:', systemState);

        // Generate mission with Groq AI (Qwen-2.5-32b)
        const result = await generateMissionWithGroq(systemState);

        if (!result.success || !result.mission) {
            return Response.json({
                success: false,
                error: result.error || 'Failed to generate mission'
            }, { status: 500 });
        }

        // Save to database
        const mission = result.mission;
        const { data: savedMission, error: dbError } = await supabase
            .from('missions')
            .insert({
                mission_id: mission.id, // Custom string ID goes to mission_id column
                name: mission.name,
                description: mission.description,
                type: mission.type,
                requirement: mission.requirement || mission.requirements || {},
                points: mission.reward?.xp || 500, // Safe access with fallback
                is_active: true,
                difficulty: mission.difficulty,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (dbError) {
            console.error('[Overseer] Database error:', dbError);
            throw new Error(`Database error: ${dbError.message}`);
        }

        console.log('[Overseer] Mission created:', savedMission.id);

        return Response.json({
            success: true,
            mission: savedMission,
            systemState: {
                globalSuccessRate: systemState.globalSuccessRate,
                difficulty: systemState.difficulty,
                activePlayers: systemState.activePlayers,
                anomalyLevel: systemState.anomalyLevel
            },
            reasoning: result.reasoning
        });

    } catch (error: any) {
        logError('[Overseer Strike] Fatal error:', error as Error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Mission generation failed',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
