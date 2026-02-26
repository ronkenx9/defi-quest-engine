/**
 * Season / Battle Pass System
 * Time-limited progression tracks with tiered rewards
 */

import { supabase } from '../supabase';

export interface SeasonReward {
    tier: number;
    xp_required: number;
    reward_type: 'xp' | 'badge' | 'multiplier' | 'title';
    reward_value: string | number;
    rarity?: string;
    duration_hours?: number;
}

export interface Season {
    id: string;
    name: string;
    description: string;
    theme: string;
    start_date: string;
    end_date: string;
    reward_track: SeasonReward[];
    is_active: boolean;
}

export interface SeasonProgress {
    season_id: string;
    season?: Season;
    season_xp: number;
    current_tier: number;
    claimed_tiers: number[];
}

/**
 * Get current active season
 */
export async function getCurrentSeason(): Promise<Season | null> {

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

    if (error || !data) return null;

    return {
        ...data,
        reward_track: data.reward_track as SeasonReward[],
    };
}

/**
 * Get user's season progress
 */
export async function getSeasonProgress(
    walletAddress: string,
    seasonId?: string
): Promise<SeasonProgress | null> {


    // Get current season if not specified
    let targetSeasonId = seasonId;
    if (!targetSeasonId) {
        const season = await getCurrentSeason();
        if (!season) return null;
        targetSeasonId = season.id;
    }

    const { data, error } = await supabase
        .from('season_progress')
        .select(`
            season_id,
            season_xp,
            current_tier,
            claimed_tiers,
            seasons (*)
        `)
        .ilike('wallet_address', walletAddress)
        .eq('season_id', targetSeasonId)
        .single();

    if (error || !data) {
        // Return default progress
        return {
            season_id: targetSeasonId,
            season_xp: 0,
            current_tier: 0,
            claimed_tiers: [],
        };
    }

    return {
        season_id: data.season_id,
        season: data.seasons as unknown as Season,
        season_xp: data.season_xp,
        current_tier: data.current_tier,
        claimed_tiers: data.claimed_tiers || [],
    };
}

/**
 * Add XP to season progress
 */
export async function addSeasonXP(
    walletAddress: string,
    xpAmount: number
): Promise<{ newTier: number; tiersUnlocked: number[] }> {


    const season = await getCurrentSeason();
    if (!season) return { newTier: 0, tiersUnlocked: [] };

    // Get current progress
    const progress = await getSeasonProgress(walletAddress, season.id);
    if (!progress) return { newTier: 0, tiersUnlocked: [] };

    const newXP = progress.season_xp + xpAmount;

    // Calculate new tier
    const rewardTrack = season.reward_track.sort((a, b) => b.tier - a.tier);
    let newTier = 0;
    for (const reward of rewardTrack) {
        if (newXP >= reward.xp_required) {
            newTier = reward.tier;
            break;
        }
    }

    // Find newly unlocked tiers
    const tiersUnlocked: number[] = [];
    for (const reward of season.reward_track) {
        if (newXP >= reward.xp_required && !progress.claimed_tiers.includes(reward.tier)) {
            if (progress.season_xp < reward.xp_required || progress.current_tier < reward.tier) {
                tiersUnlocked.push(reward.tier);
            }
        }
    }

    // Use the confirmed address from the progress or request
    const confirmedWalletAddress = progress.season_id ? walletAddress : walletAddress; // Placeholder, better if we fetch specific casing

    // Upsert progress
    await supabase.from('season_progress').upsert({
        wallet_address: confirmedWalletAddress,
        season_id: season.id,
        season_xp: newXP,
        current_tier: newTier,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address,season_id' });

    return { newTier, tiersUnlocked };
}

/**
 * Claim a season reward
 */
export async function claimSeasonReward(
    walletAddress: string,
    tier: number
): Promise<{ success: boolean; reward?: SeasonReward; error?: string }> {


    const season = await getCurrentSeason();
    if (!season) return { success: false, error: 'No active season' };

    const progress = await getSeasonProgress(walletAddress, season.id);
    if (!progress) return { success: false, error: 'No progress found' };

    // Check if already claimed
    if (progress.claimed_tiers.includes(tier)) {
        return { success: false, error: 'Already claimed' };
    }

    // Find reward for tier
    const reward = season.reward_track.find(r => r.tier === tier);
    if (!reward) return { success: false, error: 'Tier not found' };

    // Check if eligible
    if (progress.season_xp < reward.xp_required) {
        return { success: false, error: 'Not enough XP for this tier' };
    }

    // Grant reward
    switch (reward.reward_type) {
        case 'xp':
            const { data: stats } = await supabase
                .from('user_stats')
                .select('wallet_address, total_points')
                .ilike('wallet_address', walletAddress)
                .single();

            const confirmedWalletAddress = stats?.wallet_address || walletAddress;

            await supabase.from('user_stats').upsert({
                wallet_address: confirmedWalletAddress,
                total_points: (stats?.total_points || 0) + (reward.reward_value as number),
                updated_at: new Date().toISOString(),
            }, { onConflict: 'wallet_address' });
            break;

        case 'badge':
            await supabase.from('user_badges').insert({
                wallet_address: walletAddress,
                name: reward.reward_value as string,
                description: `Season ${season.name} - Tier ${tier} reward`,
                rarity: reward.rarity || 'rare',
                source: 'season',
            });
            break;

        case 'multiplier':
            await supabase.from('active_multipliers').insert({
                wallet_address: walletAddress,
                multiplier_type: 'season',
                multiplier_value: reward.reward_value as number,
                source: `${season.name} Tier ${tier}`,
                expires_at: reward.duration_hours
                    ? new Date(Date.now() + reward.duration_hours * 60 * 60 * 1000).toISOString()
                    : null,
            });
            break;

        case 'title':
            // Titles are stored as special badges
            await supabase.from('user_badges').insert({
                wallet_address: walletAddress,
                name: `Title: ${reward.reward_value}`,
                description: `Earned title from ${season.name}`,
                rarity: 'common',
                source: 'season',
            });
            break;
    }

    // Mark as claimed
    const newClaimedTiers = [...progress.claimed_tiers, tier];
    await supabase
        .from('season_progress')
        .update({ claimed_tiers: newClaimedTiers })
        .ilike('wallet_address', walletAddress)
        .eq('season_id', season.id);

    // Log activity
    await supabase.from('activity_log').insert({
        wallet_address: walletAddress,
        action: 'season_reward_claimed',
        details: {
            season: season.name,
            tier,
            reward_type: reward.reward_type,
            reward_value: reward.reward_value,
        },
    });

    return { success: true, reward };
}

/**
 * Get season time remaining
 */
export async function getSeasonTimeRemaining(): Promise<{
    days: number;
    hours: number;
    minutes: number;
} | null> {
    const season = await getCurrentSeason();
    if (!season) return null;

    const endDate = new Date(season.end_date);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes };
}
