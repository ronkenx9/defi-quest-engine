import { NextRequest, NextResponse } from 'next/server';

import {
    getSkillProgress,
    addSkillXP,
    getUnlockedPerks,
} from '@/lib/gamification/skill-tree';

export const dynamic = 'force-dynamic';

// GET /api/skills?wallet=required - Get user's skill progress across all tracks
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        const skills = await getSkillProgress(walletAddress);

        // Add perks for each skill
        const skillsWithPerks = skills.map(skill => ({
            ...skill,
            perks: getUnlockedPerks(skill.skill_type, skill.level),
        }));

        return NextResponse.json({
            success: true,
            skills: skillsWithPerks,
        });
    } catch (error) {
        console.error('[Skills API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
