/**
 * Prophecy System
 * Prediction-based XP staking
 */

import { createClient } from '@supabase/supabase-js';


function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export type ProphecyConditionType = 'price_above' | 'price_below' | 'volume_above' | 'custom';

export interface Prophecy {
    id: string;
    title: string;
    description: string;
    condition_type: ProphecyConditionType;
    condition_value: Record<string, unknown>;
    deadline: string;
    min_stake: number;
    max_stake: number;
    win_multiplier: number;
    status: 'active' | 'resolved_win' | 'resolved_lose' | 'cancelled';
}

export interface ProphecyEntry {
    id: string;
    prophecy_id: string;
    prophecy?: Prophecy;
    prediction: boolean;
    staked_xp: number;
    potential_win: number;
    result: 'pending' | 'won' | 'lost';
    xp_change: number;
    created_at: string;
    resolved_at: string | null;
}

/**
 * Get all active prophecies
 */
export async function getActiveProphecies(): Promise<Prophecy[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('prophecies')
        .select('*')
        .eq('status', 'active')
        .gt('deadline', new Date().toISOString())
        .order('deadline', { ascending: true });

    if (error) return [];
    return data || [];
}

/**
 * Get user's prophecy entries
 */
export async function getUserProphecies(walletAddress: string): Promise<ProphecyEntry[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('prophecy_entries')
        .select(`
            *,
            prophecies (*)
        `)
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(d => ({
        ...d,
        prophecy: d.prophecies as unknown as Prophecy,
    }));
}

/**
 * Make a prediction (stake XP)
 */
export async function makePrediction(
    walletAddress: string,
    prophecyId: string,
    prediction: boolean,
    stakeXP: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabase();

    // Get prophecy details
    let prophecy: any;
    const { data: pData } = await supabase
        .from('prophecies')
        .select('*')
        .eq('id', prophecyId)
        .eq('status', 'active')
        .single();

    if (pData) {
        prophecy = pData;
    } else {
        // Check if it's a Tier-2 prediction mission
        const { data: mData } = await supabase
            .from('missions')
            .select('*')
            .eq('id', prophecyId)
            .eq('type', 'prediction')
            .eq('is_active', true)
            .single();

        if (mData) {
            prophecy = {
                id: mData.id,
                title: mData.name,
                min_stake: 50,
                max_stake: 5000,
                win_multiplier: 1.5
            };
        }
    }

    if (!prophecy) {
        return { success: false, error: 'Prophecy not found or not active' };
    }

    // Validate stake amount
    if (stakeXP < prophecy.min_stake || stakeXP > prophecy.max_stake) {
        return { success: false, error: `Stake must be between ${prophecy.min_stake} and ${prophecy.max_stake} XP` };
    }

    // Check if already entered
    const { data: existing } = await supabase
        .from('prophecy_entries')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('prophecy_id', prophecyId)
        .single();

    if (existing) {
        return { success: false, error: 'Already entered this prophecy' };
    }

    // Check if user has enough XP
    const { data: stats } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('wallet_address', walletAddress)
        .single();

    const currentXP = stats?.total_points || 0;

    if (currentXP < stakeXP) {
        return { success: false, error: 'Not enough XP to stake' };
    }

    // Calculate potential win
    const potentialWin = Math.floor(stakeXP * prophecy.win_multiplier);

    // Deduct staked XP
    await supabase
        .from('user_stats')
        .update({
            total_points: currentXP - stakeXP,
            updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress);

    // Create entry
    await supabase.from('prophecy_entries').insert({
        wallet_address: walletAddress,
        prophecy_id: prophecyId,
        prediction,
        staked_xp: stakeXP,
        potential_win: potentialWin,
        result: 'pending',
    });

    // Log activity
    await supabase.from('activity_log').insert({
        wallet_address: walletAddress,
        action: 'prophecy_staked',
        details: {
            prophecy_title: prophecy.title,
            staked_xp: stakeXP,
            prediction,
            potential_win: potentialWin,
        },
    });

    return { success: true };
}

/**
 * Resolve a prophecy (admin/oracle function)
 */
export async function resolveProphecy(
    prophecyId: string,
    outcome: boolean
): Promise<{ resolved: number; totalXPAwarded: number }> {
    const supabase = getSupabase();

    // Get prophecy
    const { data: prophecy } = await supabase
        .from('prophecies')
        .select('*')
        .eq('id', prophecyId)
        .single();

    if (!prophecy || prophecy.status !== 'active') {
        return { resolved: 0, totalXPAwarded: 0 };
    }

    // Get all entries
    const { data: entries } = await supabase
        .from('prophecy_entries')
        .select('*')
        .eq('prophecy_id', prophecyId)
        .eq('result', 'pending');

    if (!entries || entries.length === 0) {
        return { resolved: 0, totalXPAwarded: 0 };
    }

    let totalXPAwarded = 0;

    for (const entry of entries) {
        const won = entry.prediction === outcome;
        const xpChange = won ? entry.potential_win : 0; // Lost XP already deducted

        // Update entry
        await supabase
            .from('prophecy_entries')
            .update({
                result: won ? 'won' : 'lost',
                xp_change: won ? entry.potential_win : -entry.staked_xp,
                resolved_at: new Date().toISOString(),
            })
            .eq('id', entry.id);

        // Award XP if won
        if (won) {
            const { data: stats } = await supabase
                .from('user_stats')
                .select('total_points')
                .eq('wallet_address', entry.wallet_address)
                .single();

            const newPoints = (stats?.total_points || 0) + entry.potential_win;

            await supabase
                .from('user_stats')
                .upsert({
                    wallet_address: entry.wallet_address,
                    total_points: newPoints,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'wallet_address' });

            totalXPAwarded += entry.potential_win;
        }

        // Log result
        await supabase.from('activity_log').insert({
            wallet_address: entry.wallet_address,
            action: won ? 'prophecy_won' : 'prophecy_lost',
            details: {
                prophecy_title: prophecy.title,
                xp_change: won ? entry.potential_win : -entry.staked_xp,
            },
        });
    }

    // Update prophecy status
    await supabase
        .from('prophecies')
        .update({ status: outcome ? 'resolved_win' : 'resolved_lose' })
        .eq('id', prophecyId);

    return { resolved: entries.length, totalXPAwarded };
}

/**
 * Get prophecy statistics
 */
export async function getProphecyStats(walletAddress: string): Promise<{
    totalPredictions: number;
    wins: number;
    losses: number;
    pending: number;
    netXP: number;
    winRate: number;
}> {
    const supabase = getSupabase();

    const { data: entries } = await supabase
        .from('prophecy_entries')
        .select('result, xp_change')
        .eq('wallet_address', walletAddress);

    if (!entries || entries.length === 0) {
        return { totalPredictions: 0, wins: 0, losses: 0, pending: 0, netXP: 0, winRate: 0 };
    }

    const wins = entries.filter(e => e.result === 'won').length;
    const losses = entries.filter(e => e.result === 'lost').length;
    const pending = entries.filter(e => e.result === 'pending').length;
    const netXP = entries.reduce((sum, e) => sum + (e.xp_change || 0), 0);
    const decided = wins + losses;
    const winRate = decided > 0 ? Math.round((wins / decided) * 100) : 0;

    return {
        totalPredictions: entries.length,
        wins,
        losses,
        pending,
        netXP,
        winRate,
    };
}
