/**
 * Skill Tree System
 * Four progression tracks: Swapper, Holder, Explorer, Oracle
 */

import { createClient } from '@supabase/supabase-js';


function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export type SkillType = 'swapper' | 'holder' | 'explorer' | 'oracle';

export interface SkillProgress {
    skill_type: SkillType;
    xp: number;
    level: number;
}

export interface SkillPerk {
    level: number;
    name: string;
    description: string;
    value?: number;
}

// XP thresholds for each level (exponential curve)
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000];

// Perks unlocked at each level per skill
const SKILL_PERKS: Record<SkillType, SkillPerk[]> = {
    swapper: [
        { level: 1, name: 'Initiate', description: 'Begin your journey' },
        { level: 3, name: 'Quick Hands', description: '+5% XP from swaps', value: 0.05 },
        { level: 5, name: 'Trader', description: '+10% XP from swaps', value: 0.10 },
        { level: 7, name: 'Speed Demon', description: '+15% XP from swaps', value: 0.15 },
        { level: 10, name: 'Swap Master', description: '+25% XP from swaps', value: 0.25 },
    ],
    holder: [
        { level: 1, name: 'Hodler', description: 'Begin your patience journey' },
        { level: 3, name: 'Diamond Hands', description: '+5% XP from holds', value: 0.05 },
        { level: 5, name: 'Long Term', description: '+10% XP from holds', value: 0.10 },
        { level: 7, name: 'Stalwart', description: '+15% XP from holds', value: 0.15 },
        { level: 10, name: 'Immovable', description: '+25% XP from holds', value: 0.25 },
    ],
    explorer: [
        { level: 1, name: 'Curious', description: 'Begin exploring' },
        { level: 3, name: 'Adventurer', description: '+5% XP from new tokens', value: 0.05 },
        { level: 5, name: 'Pathfinder', description: '+10% XP from new tokens', value: 0.10 },
        { level: 7, name: 'Pioneer', description: '+15% XP from new tokens', value: 0.15 },
        { level: 10, name: 'Discoverer', description: '+25% XP from new tokens', value: 0.25 },
    ],
    oracle: [
        { level: 1, name: 'Seer', description: 'Begin predicting' },
        { level: 3, name: 'Foresight', description: '+0.1x prophecy multiplier', value: 0.1 },
        { level: 5, name: 'Visionary', description: '+0.2x prophecy multiplier', value: 0.2 },
        { level: 7, name: 'Prophet', description: '+0.3x prophecy multiplier', value: 0.3 },
        { level: 10, name: 'Oracle', description: '+0.5x prophecy multiplier', value: 0.5 },
    ],
};

/**
 * Calculate level from XP
 */
export function getSkillLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

/**
 * Get XP required for next level
 */
export function getXPForNextLevel(currentLevel: number): number {
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
        return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
    }
    return LEVEL_THRESHOLDS[currentLevel];
}

/**
 * Get unlocked perks for a skill at a given level
 */
export function getUnlockedPerks(skill: SkillType, level: number): SkillPerk[] {
    return SKILL_PERKS[skill].filter(perk => perk.level <= level);
}

/**
 * Get total bonus multiplier from skill perks
 */
export function getSkillBonus(skill: SkillType, level: number): number {
    const perks = getUnlockedPerks(skill, level);
    const highestPerk = perks.filter(p => p.value).sort((a, b) => (b.value || 0) - (a.value || 0))[0];
    return highestPerk?.value || 0;
}

/**
 * Fetch all skill progress for a wallet
 */
export async function getSkillProgress(walletAddress: string): Promise<SkillProgress[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('skill_progress')
        .select('skill_type, xp, level')
        .eq('wallet_address', walletAddress);

    if (error) return [];

    // Ensure all skills exist
    const skills: SkillType[] = ['swapper', 'holder', 'explorer', 'oracle'];
    const result: SkillProgress[] = skills.map(skill => {
        const existing = data?.find(d => d.skill_type === skill);
        return existing || { skill_type: skill, xp: 0, level: 1 };
    });

    return result;
}

/**
 * Add XP to a specific skill track
 */
export async function addSkillXP(
    walletAddress: string,
    skill: SkillType,
    amount: number
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
    const supabase = getSupabase();

    // Get current progress
    const { data: current } = await supabase
        .from('skill_progress')
        .select('xp, level')
        .eq('wallet_address', walletAddress)
        .eq('skill_type', skill)
        .single();

    const oldXP = current?.xp || 0;
    const oldLevel = current?.level || 1;
    const newXP = oldXP + amount;
    const newLevel = getSkillLevel(newXP);
    const leveledUp = newLevel > oldLevel;

    // Upsert progress
    await supabase
        .from('skill_progress')
        .upsert({
            wallet_address: walletAddress,
            skill_type: skill,
            xp: newXP,
            level: newLevel,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address,skill_type' });

    return { newXP, newLevel, leveledUp };
}

/**
 * Get total skill bonus from all skills for XP calculation
 */
export async function getTotalSkillBonus(walletAddress: string, actionType: SkillType): Promise<number> {
    const progress = await getSkillProgress(walletAddress);
    const skillProgress = progress.find(p => p.skill_type === actionType);

    if (!skillProgress) return 0;

    return getSkillBonus(actionType, skillProgress.level);
}
