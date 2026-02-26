/**
 * Glitch System
 * Hidden/secret missions triggered by on-chain patterns
 */

import { supabase } from '../supabase';

export type GlitchTriggerType = 'time' | 'count' | 'amount' | 'pattern' | 'streak';

export interface Glitch {
    id: string;
    name: string;
    description: string;
    trigger_type: GlitchTriggerType;
    trigger_condition: Record<string, unknown>;
    reward_xp: number;
    reward_badge: string | null;
    reward_badge_rarity: string | null;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface GlitchDiscovery {
    glitch: Glitch;
    discovered_at: string;
    xp_awarded: number;
}

export interface ActionContext {
    timestamp: Date;
    swapCount: number;
    amount: number;
    streakDays: number;
    sameSwapCount?: number;
    level?: number;
}

/**
 * Check all glitch triggers for a given action
 */
export async function checkGlitchTriggers(
    walletAddress: string,
    context: ActionContext
): Promise<Glitch[]> {


    // Get all active glitches
    const { data: glitches } = await supabase
        .from('glitches')
        .select('*')
        .eq('is_active', true);

    if (!glitches) return [];

    // Get already discovered glitches
    const { data: discoveries } = await supabase
        .from('glitch_discoveries')
        .select('glitch_id')
        .ilike('wallet_address', walletAddress);

    const discoveredIds = new Set(discoveries?.map(d => d.glitch_id) || []);

    const triggered: Glitch[] = [];

    for (const glitch of glitches) {
        // Skip already discovered
        if (discoveredIds.has(glitch.id)) continue;

        const condition = glitch.trigger_condition as Record<string, unknown>;

        let isTriggered = false;

        switch (glitch.trigger_type) {
            case 'time':
                const hour = context.timestamp.getHours();
                const hourStart = condition.hour_start as number;
                const hourEnd = condition.hour_end as number;
                isTriggered = hour >= hourStart && hour < hourEnd;
                break;

            case 'count':
                if (condition.action === 'swap') {
                    isTriggered = context.swapCount === (condition.count as number);
                } else if (condition.level) {
                    isTriggered = (context.level || 1) >= (condition.level as number);
                }
                break;

            case 'amount':
                if (condition.exact_amount) {
                    isTriggered = Math.abs(context.amount - (condition.exact_amount as number)) < 0.01;
                }
                break;

            case 'streak':
                isTriggered = context.streakDays >= (condition.days as number);
                break;

            case 'pattern':
                if (condition.repeat_count) {
                    isTriggered = (context.sameSwapCount || 0) >= (condition.repeat_count as number);
                }
                break;
        }

        if (isTriggered) {
            triggered.push(glitch);
        }
    }

    return triggered;
}

/**
 * Discover a glitch and award rewards
 */
export async function discoverGlitch(
    walletAddress: string,
    glitchId: string
): Promise<GlitchDiscovery | null> {


    // Get glitch details
    const { data: glitch } = await supabase
        .from('glitches')
        .select('*')
        .eq('id', glitchId)
        .single();

    if (!glitch) return null;

    // Check if already discovered
    const { data: existing } = await supabase
        .from('glitch_discoveries')
        .select('id')
        .ilike('wallet_address', walletAddress)
        .eq('glitch_id', glitchId)
        .single();

    if (existing) return null;

    // Get confirmed wallet address from stats to ensure consistency
    const { data: stats } = await supabase
        .from('user_stats')
        .select('wallet_address, total_points')
        .ilike('wallet_address', walletAddress)
        .single();

    const confirmedWalletAddress = stats?.wallet_address || walletAddress;
    const currentXP = stats?.total_points || 0;

    // Record discovery
    await supabase.from('glitch_discoveries').insert({
        wallet_address: confirmedWalletAddress,
        glitch_id: glitchId,
        xp_awarded: glitch.reward_xp,
    });

    // Update discovery count
    await supabase
        .from('glitches')
        .update({ discovery_count: (glitch.discovery_count || 0) + 1 })
        .eq('id', glitchId);

    // Award XP (using stats fetched at beginning of function)
    const newPoints = currentXP + glitch.reward_xp;

    await supabase
        .from('user_stats')
        .upsert({
            wallet_address: confirmedWalletAddress,
            total_points: newPoints,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address' });

    // Award badge if specified
    if (glitch.reward_badge) {
        await supabase.from('user_badges').insert({
            wallet_address: walletAddress,
            name: glitch.reward_badge,
            description: glitch.description,
            rarity: glitch.reward_badge_rarity || 'rare',
            source: 'glitch',
        });
    }

    // Log activity
    await supabase.from('activity_log').insert({
        wallet_address: walletAddress,
        action: 'glitch_discovered',
        details: {
            glitch_name: glitch.name,
            xp_awarded: glitch.reward_xp,
            badge: glitch.reward_badge,
        },
    });

    return {
        glitch,
        discovered_at: new Date().toISOString(),
        xp_awarded: glitch.reward_xp,
    };
}

/**
 * Get all discovered glitches for a wallet
 */
export async function getDiscoveredGlitches(walletAddress: string): Promise<GlitchDiscovery[]> {


    const { data, error } = await supabase
        .from('glitch_discoveries')
        .select(`
            discovered_at,
            xp_awarded,
            glitches (*)
        `)
        .ilike('wallet_address', walletAddress)
        .order('discovered_at', { ascending: false });

    if (error || !data) return [];

    return data.map(d => ({
        glitch: d.glitches as unknown as Glitch,
        discovered_at: d.discovered_at,
        xp_awarded: d.xp_awarded,
    }));
}

/**
 * Get all glitches (for admin view)
 */
export async function getAllGlitches(): Promise<Glitch[]> {


    const { data, error } = await supabase
        .from('glitches')
        .select('*')
        .order('rarity', { ascending: true });

    if (error || !data) return [];
    return data;
}

/**
 * Get glitch discovery stats
 */
export async function getGlitchStats(walletAddress: string): Promise<{
    discovered: number;
    total: number;
    xpFromGlitches: number;
}> {


    const { count: total } = await supabase
        .from('glitches')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    const { data: discoveries } = await supabase
        .from('glitch_discoveries')
        .select('xp_awarded')
        .ilike('wallet_address', walletAddress);

    const discovered = discoveries?.length || 0;
    const xpFromGlitches = discoveries?.reduce((sum, d) => sum + d.xp_awarded, 0) || 0;

    return {
        discovered,
        total: total || 0,
        xpFromGlitches,
    };
}
