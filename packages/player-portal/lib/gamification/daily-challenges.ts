/**
 * Daily Challenges System
 * Rotating bonus missions with multiplied XP
 */

import { supabase } from '../supabase';

export interface DailyChallenge {
    id: string;
    date: string;
    slot: number;
    bonus_multiplier: number;
    mission: {
        id: string;
        name: string;
        description: string;
        type: string;
        difficulty: string;
        points: number;
    };
}

export interface ChallengeCompletion {
    challenge_id: string;
    completed_at: string;
    xp_earned: number;
}

/**
 * Get today's challenges
 */
export async function getTodaysChallenges(): Promise<DailyChallenge[]> {

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('daily_challenges')
        .select(`
            id,
            date,
            slot,
            bonus_multiplier,
            missions (
                id,
                name,
                description,
                type,
                difficulty,
                points
            )
        `)
        .eq('date', today)
        .order('slot', { ascending: true });

    if (error || !data) return [];

    return data.map(d => ({
        id: d.id,
        date: d.date,
        slot: d.slot,
        bonus_multiplier: d.bonus_multiplier,
        mission: d.missions as unknown as DailyChallenge['mission'],
    }));
}

/**
 * Get user's completed challenges for today
 */
export async function getCompletedChallenges(walletAddress: string): Promise<ChallengeCompletion[]> {

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('daily_challenge_completions')
        .select(`
            challenge_id,
            completed_at,
            xp_earned,
            daily_challenges!inner (date)
        `)
        .eq('wallet_address', walletAddress)
        .eq('daily_challenges.date', today);

    if (error || !data) return [];

    return data.map(d => ({
        challenge_id: d.challenge_id,
        completed_at: d.completed_at,
        xp_earned: d.xp_earned,
    }));
}

/**
 * Complete a daily challenge
 */
export async function completeChallenge(
    walletAddress: string,
    challengeId: string
): Promise<{ success: boolean; xpEarned: number; error?: string }> {


    // Check if already completed
    const { data: existing } = await supabase
        .from('daily_challenge_completions')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('challenge_id', challengeId)
        .single();

    if (existing) {
        return { success: false, xpEarned: 0, error: 'Already completed' };
    }

    // Get challenge details
    const { data: challenge } = await supabase
        .from('daily_challenges')
        .select(`
            bonus_multiplier,
            missions (points)
        `)
        .eq('id', challengeId)
        .single();

    if (!challenge) {
        return { success: false, xpEarned: 0, error: 'Challenge not found' };
    }

    const missions = challenge.missions as unknown as { points: number } | { points: number }[];
    const baseXP = Array.isArray(missions) ? missions[0]?.points || 0 : missions?.points || 0;
    const xpEarned = Math.floor(baseXP * challenge.bonus_multiplier);

    // Record completion
    await supabase.from('daily_challenge_completions').insert({
        wallet_address: walletAddress,
        challenge_id: challengeId,
        xp_earned: xpEarned,
    });

    // Award XP
    const { data: stats } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('wallet_address', walletAddress)
        .single();

    await supabase.from('user_stats').upsert({
        wallet_address: walletAddress,
        total_points: (stats?.total_points || 0) + xpEarned,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' });

    // Log activity
    await supabase.from('activity_log').insert({
        wallet_address: walletAddress,
        action: 'daily_challenge_completed',
        details: {
            challenge_id: challengeId,
            xp_earned: xpEarned,
            bonus_multiplier: challenge.bonus_multiplier,
        },
    });

    return { success: true, xpEarned };
}

/**
 * Generate daily challenges (run once per day via cron)
 */
export async function generateDailyChallenges(): Promise<number> {

    const today = new Date().toISOString().split('T')[0];

    // Check if already generated
    const { count } = await supabase
        .from('daily_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

    if (count && count >= 3) {
        return 0; // Already generated
    }

    // Get random active missions
    const { data: missions } = await supabase
        .from('missions')
        .select('id')
        .eq('is_active', true);

    if (!missions || missions.length < 3) {
        return 0;
    }

    // Shuffle and pick 3
    const shuffled = missions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 3);

    let created = 0;
    for (let i = 0; i < selected.length; i++) {
        const { error } = await supabase.from('daily_challenges').insert({
            date: today,
            mission_id: selected[i].id,
            bonus_multiplier: 2.0,
            slot: i + 1,
        });

        if (!error) created++;
    }

    return created;
}

/**
 * Get user's challenge progress for today (alias for getCompletedChallenges + stats)
 */
export async function getUserChallengeProgress(walletAddress: string): Promise<{
    completions: ChallengeCompletion[];
    stats: { completedToday: number; totalToday: number };
}> {
    const completions = await getCompletedChallenges(walletAddress);

    const today = new Date().toISOString().split('T')[0];

    const { count: totalToday } = await supabase
        .from('daily_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

    return {
        completions,
        stats: {
            completedToday: completions.length,
            totalToday: totalToday || 0,
        },
    };
}

/**
 * Get daily challenge streak stats
 */
export async function getDailyChallengeStats(walletAddress: string): Promise<{
    completedToday: number;
    totalToday: number;
    allTimeCompletions: number;
}> {

    const today = new Date().toISOString().split('T')[0];

    // Today's challenges
    const { count: totalToday } = await supabase
        .from('daily_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

    // Completed today
    const { count: completedToday } = await supabase
        .from('daily_challenge_completions')
        .select('*, daily_challenges!inner(date)', { count: 'exact', head: true })
        .eq('wallet_address', walletAddress)
        .eq('daily_challenges.date', today);

    // All time
    const { count: allTimeCompletions } = await supabase
        .from('daily_challenge_completions')
        .select('*', { count: 'exact', head: true })
        .eq('wallet_address', walletAddress);

    return {
        completedToday: completedToday || 0,
        totalToday: totalToday || 0,
        allTimeCompletions: allTimeCompletions || 0,
    };
}
