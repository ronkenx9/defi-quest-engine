/**
 * Multiplier System
 * Manages streak bonuses, season events, referral bonuses, and skill multipliers
 */

import { createClient } from '@supabase/supabase-js';
import { getTotalSkillBonus, SkillType } from './skill-tree';


function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export type MultiplierType = 'streak' | 'season' | 'event' | 'referral' | 'skill';

export interface ActiveMultiplier {
    multiplier_type: MultiplierType;
    multiplier_value: number;
    source: string;
    expires_at: string | null;
}

// Streak multiplier thresholds
const STREAK_MULTIPLIERS: Record<number, number> = {
    3: 1.1,   // 3-day streak = 1.1x
    7: 1.25,  // 7-day streak = 1.25x
    14: 1.5,  // 14-day streak = 1.5x
    30: 2.0,  // 30-day streak = 2x
    60: 2.5,  // 60-day streak = 2.5x
    100: 3.0, // 100-day streak = 3x
};

/**
 * Get streak multiplier based on current streak
 */
export function getStreakMultiplier(streakDays: number): number {
    let multiplier = 1.0;
    for (const [days, mult] of Object.entries(STREAK_MULTIPLIERS)) {
        if (streakDays >= parseInt(days)) {
            multiplier = mult;
        }
    }
    return multiplier;
}

/**
 * Get all active multipliers for a wallet
 */
export async function getActiveMultipliers(walletAddress: string): Promise<ActiveMultiplier[]> {
    const supabase = getSupabase();

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('active_multipliers')
        .select('multiplier_type, multiplier_value, source, expires_at')
        .eq('wallet_address', walletAddress)
        .or(`expires_at.is.null,expires_at.gt.${now}`);

    if (error) return [];
    return data || [];
}

/**
 * Calculate final XP with all multipliers applied
 */
export async function calculateFinalXP(
    baseXP: number,
    walletAddress: string,
    actionType?: SkillType
): Promise<{ finalXP: number; multipliers: ActiveMultiplier[]; totalMultiplier: number }> {
    const supabase = getSupabase();

    // Get user stats for streak
    const { data: stats } = await supabase
        .from('user_stats')
        .select('current_streak')
        .eq('wallet_address', walletAddress)
        .single();

    const streakDays = stats?.current_streak || 0;
    const streakMultiplier = getStreakMultiplier(streakDays);

    // Get active multipliers from DB
    const activeMultipliers = await getActiveMultipliers(walletAddress);

    // Get skill bonus if action type provided
    let skillBonus = 0;
    if (actionType) {
        skillBonus = await getTotalSkillBonus(walletAddress, actionType);
    }

    // Calculate total multiplier
    let totalMultiplier = streakMultiplier;

    for (const mult of activeMultipliers) {
        if (mult.multiplier_type === 'season' || mult.multiplier_type === 'event') {
            totalMultiplier *= mult.multiplier_value;
        } else if (mult.multiplier_type === 'referral') {
            totalMultiplier += mult.multiplier_value - 1; // Additive
        }
    }

    // Add skill bonus (additive)
    totalMultiplier += skillBonus;

    const finalXP = Math.floor(baseXP * totalMultiplier);

    // Build multiplier list for display
    const displayMultipliers: ActiveMultiplier[] = [
        ...activeMultipliers,
    ];

    if (streakDays >= 3) {
        displayMultipliers.push({
            multiplier_type: 'streak',
            multiplier_value: streakMultiplier,
            source: `${streakDays}-day streak`,
            expires_at: null,
        });
    }

    if (skillBonus > 0 && actionType) {
        displayMultipliers.push({
            multiplier_type: 'skill',
            multiplier_value: 1 + skillBonus,
            source: `${actionType} skill bonus`,
            expires_at: null,
        });
    }

    return { finalXP, multipliers: displayMultipliers, totalMultiplier };
}

/**
 * Grant a temporary multiplier to a wallet
 */
export async function grantMultiplier(
    walletAddress: string,
    type: MultiplierType,
    value: number,
    source: string,
    durationHours?: number
): Promise<void> {
    const supabase = getSupabase();

    const expiresAt = durationHours
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : null;

    await supabase.from('active_multipliers').insert({
        wallet_address: walletAddress,
        multiplier_type: type,
        multiplier_value: value,
        source,
        expires_at: expiresAt,
    });
}

/**
 * Remove expired multipliers (cleanup job)
 */
export async function cleanupExpiredMultipliers(): Promise<number> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('active_multipliers')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

    if (error) return 0;
    return data?.length || 0;
}
