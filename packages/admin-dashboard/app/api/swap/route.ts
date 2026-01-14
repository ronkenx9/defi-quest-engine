import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateFinalXP } from '@/lib/gamification/multipliers';
import { addSkillXP } from '@/lib/gamification/skill-tree';
import { checkGlitchTriggers, discoverGlitch, ActionContext } from '@/lib/gamification/glitches';
import { addSeasonXP } from '@/lib/gamification/seasons';
import { checkNarrativeUnlocks } from '@/lib/gamification/narrative';
import { updateLeaderboardEntry } from '@/lib/gamification/leaderboards';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

// XP constants
const BASE_XP_PER_UNIT = 50;
const MAX_XP_PER_SWAP = 5000;
const MIN_AMOUNT = 0.001;

function isRateLimited(walletAddress: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(walletAddress);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(walletAddress, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
        return false;
    }

    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    record.count++;
    return false;
}

function sanitizeString(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

function validateAmount(amount: unknown): number | null {
    const parsed = parseFloat(String(amount));
    if (isNaN(parsed) || parsed < MIN_AMOUNT || parsed > 1000000) {
        return null;
    }
    return parsed;
}

function validateWalletAddress(address: unknown): string | null {
    if (typeof address !== 'string') return null;
    const sanitized = sanitizeString(address);
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(sanitized)) {
        return null;
    }
    return sanitized;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate inputs
        const walletAddress = validateWalletAddress(body.walletAddress);
        if (!walletAddress) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        const amount = validateAmount(body.amount);
        if (amount === null) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const inputToken = sanitizeString(String(body.inputToken || 'SOL'));
        const outputToken = sanitizeString(String(body.outputToken || 'USDC'));

        // Rate limiting
        if (isRateLimited(walletAddress)) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        const supabase = createClient(
            supabaseUrl,
            supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get current stats
        const { data: currentStats } = await supabase
            .from('user_stats')
            .select('total_points, current_streak, level, total_missions_completed')
            .eq('wallet_address', walletAddress)
            .single();

        const currentStreak = currentStats?.current_streak || 0;
        const currentLevel = currentStats?.level || 1;
        const swapCount = (currentStats?.total_missions_completed || 0) + 1;

        // Calculate base XP
        const baseXP = Math.min(Math.floor(amount * BASE_XP_PER_UNIT), MAX_XP_PER_SWAP);

        // Apply multipliers (streak, season, skills)
        const { finalXP, multipliers, totalMultiplier } = await calculateFinalXP(
            baseXP,
            walletAddress,
            'swapper'
        );

        // Award skill XP for Swapper track
        const { newLevel: newSkillLevel, leveledUp: skillLeveledUp } = await addSkillXP(
            walletAddress,
            'swapper',
            Math.floor(baseXP / 10) // 10% of base XP goes to skill
        );

        // Check for glitches
        const glitchContext: ActionContext = {
            timestamp: new Date(),
            swapCount,
            amount,
            streakDays: currentStreak,
        };

        const triggeredGlitches = await checkGlitchTriggers(walletAddress, glitchContext);
        const discoveredGlitches = [];

        for (const glitch of triggeredGlitches) {
            const discovery = await discoverGlitch(walletAddress, glitch.id);
            if (discovery) {
                discoveredGlitches.push(discovery);
            }
        }

        // Calculate total XP including glitches
        const glitchXP = discoveredGlitches.reduce((sum, d) => sum + d.xp_awarded, 0);
        const totalXP = finalXP + glitchXP;

        // Update user stats
        const newPoints = (currentStats?.total_points || 0) + totalXP;
        const newLevel = Math.max(
            Math.floor(Math.log(newPoints / 100) / Math.log(1.5)) + 1,
            currentLevel
        );
        const leveledUp = newLevel > currentLevel;

        await supabase.from('user_stats').upsert({
            wallet_address: walletAddress,
            total_points: newPoints,
            level: newLevel,
            total_missions_completed: swapCount,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address' });

        // Update leaderboard
        await updateLeaderboardEntry(walletAddress, newPoints);

        // Add season XP
        const { newTier, tiersUnlocked } = await addSeasonXP(walletAddress, totalXP);

        // Check narrative unlocks
        let newChapters: { chapter_number: number; title: string }[] = [];
        if (leveledUp) {
            const chapters = await checkNarrativeUnlocks(walletAddress, newLevel);
            newChapters = chapters.map(c => ({
                chapter_number: c.chapter_number,
                title: c.title,
            }));
        }

        // Log activity
        await supabase.from('activity_log').insert({
            wallet_address: walletAddress,
            action: 'swap_completed',
            details: {
                input_token: inputToken,
                output_token: outputToken,
                amount,
                base_xp: baseXP,
                final_xp: finalXP,
                total_multiplier: totalMultiplier,
                glitch_xp: glitchXP,
                total_xp: totalXP,
                new_level: newLevel,
            }
        });

        // Build response
        const response: Record<string, unknown> = {
            success: true,
            xpEarned: totalXP,
            baseXP,
            multiplier: totalMultiplier,
            newLevel,
            newPoints,
        };

        // Add gamification bonuses
        if (multipliers.length > 0) {
            response.multipliers = multipliers.map(m => ({
                type: m.multiplier_type,
                value: m.multiplier_value,
                source: m.source,
            }));
        }

        if (discoveredGlitches.length > 0) {
            response.glitchesDiscovered = discoveredGlitches.map(d => ({
                name: d.glitch.name,
                xp: d.xp_awarded,
                badge: d.glitch.reward_badge,
            }));
        }

        if (leveledUp) {
            response.leveledUp = true;
        }

        if (skillLeveledUp) {
            response.skillLeveledUp = { skill: 'swapper', newLevel: newSkillLevel };
        }

        if (tiersUnlocked.length > 0) {
            response.seasonTiersUnlocked = tiersUnlocked;
        }

        if (newChapters.length > 0) {
            response.narrativeUnlocks = newChapters;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[Swap API] Request failed');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
