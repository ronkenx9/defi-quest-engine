/**
 * Leaderboard System
 * Cached rankings for daily, weekly, and all-time periods
 */

import { createClient } from '@supabase/supabase-js';


function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'alltime';

export interface LeaderboardEntry {
    wallet_address: string;
    xp: number;
    rank: number;
}

export interface UserRank {
    rank: number;
    xp: number;
    totalParticipants: number;
    percentile: number;
    nearbyEntries: LeaderboardEntry[];
}

/**
 * Get leaderboard for a specific period
 */
export async function getLeaderboard(
    period: LeaderboardPeriod,
    limit: number = 100
): Promise<LeaderboardEntry[]> {
    const supabase = getSupabase();

    let tableName: string;
    let dateFilter: Record<string, unknown> = {};

    switch (period) {
        case 'daily':
            tableName = 'leaderboard_daily';
            dateFilter = { date: new Date().toISOString().split('T')[0] };
            break;
        case 'weekly':
            tableName = 'leaderboard_weekly';
            const weekStart = getWeekStart(new Date());
            dateFilter = { week_start: weekStart.toISOString().split('T')[0] };
            break;
        case 'alltime':
        default:
            tableName = 'leaderboard_alltime';
            break;
    }

    let query = supabase
        .from(tableName)
        .select('wallet_address, xp, rank')
        .order('rank', { ascending: true })
        .limit(limit);

    if (Object.keys(dateFilter).length > 0) {
        const [key, value] = Object.entries(dateFilter)[0];
        query = query.eq(key, value);
    }

    const { data, error } = await query;

    if (error) return [];
    return data || [];
}

/**
 * Get a user's rank and nearby entries
 */
export async function getUserRank(
    walletAddress: string,
    period: LeaderboardPeriod
): Promise<UserRank | null> {
    const supabase = getSupabase();

    let tableName: string;
    let dateFilter: Record<string, unknown> = {};

    switch (period) {
        case 'daily':
            tableName = 'leaderboard_daily';
            dateFilter = { date: new Date().toISOString().split('T')[0] };
            break;
        case 'weekly':
            tableName = 'leaderboard_weekly';
            const weekStart = getWeekStart(new Date());
            dateFilter = { week_start: weekStart.toISOString().split('T')[0] };
            break;
        case 'alltime':
        default:
            tableName = 'leaderboard_alltime';
            break;
    }

    // Get user's entry
    let userQuery = supabase
        .from(tableName)
        .select('wallet_address, xp, rank')
        .eq('wallet_address', walletAddress);

    if (Object.keys(dateFilter).length > 0) {
        const [key, value] = Object.entries(dateFilter)[0];
        userQuery = userQuery.eq(key, value);
    }

    const { data: userData } = await userQuery.single();

    if (!userData) return null;

    // Get total count
    let countQuery = supabase.from(tableName).select('*', { count: 'exact', head: true });
    if (Object.keys(dateFilter).length > 0) {
        const [key, value] = Object.entries(dateFilter)[0];
        countQuery = countQuery.eq(key, value);
    }
    const { count } = await countQuery;
    const totalParticipants = count || 0;

    // Get nearby entries (2 above, 2 below)
    const userRank = userData.rank || 1;
    const nearbyRanks = [userRank - 2, userRank - 1, userRank, userRank + 1, userRank + 2].filter(r => r > 0);

    let nearbyQuery = supabase
        .from(tableName)
        .select('wallet_address, xp, rank')
        .in('rank', nearbyRanks)
        .order('rank', { ascending: true });

    if (Object.keys(dateFilter).length > 0) {
        const [key, value] = Object.entries(dateFilter)[0];
        nearbyQuery = nearbyQuery.eq(key, value);
    }

    const { data: nearbyData } = await nearbyQuery;

    const percentile = totalParticipants > 0
        ? Math.round((1 - (userRank / totalParticipants)) * 100)
        : 0;

    return {
        rank: userRank,
        xp: userData.xp,
        totalParticipants,
        percentile,
        nearbyEntries: nearbyData || [],
    };
}

/**
 * Update all-time leaderboard for a wallet
 */
export async function updateLeaderboardEntry(walletAddress: string, xp: number): Promise<void> {
    const supabase = getSupabase();

    // Upsert all-time entry
    await supabase.from('leaderboard_alltime').upsert({
        wallet_address: walletAddress,
        xp,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' });

    // Upsert daily entry
    const today = new Date().toISOString().split('T')[0];
    await supabase.from('leaderboard_daily').upsert({
        wallet_address: walletAddress,
        xp,
        date: today,
    }, { onConflict: 'wallet_address,date' });

    // Upsert weekly entry
    const weekStart = getWeekStart(new Date()).toISOString().split('T')[0];
    await supabase.from('leaderboard_weekly').upsert({
        wallet_address: walletAddress,
        xp,
        week_start: weekStart,
    }, { onConflict: 'wallet_address,week_start' });
}

/**
 * Recalculate ranks for a leaderboard (run periodically)
 */
export async function recalculateRanks(period: LeaderboardPeriod): Promise<void> {
    const supabase = getSupabase();

    let tableName: string;
    let dateFilter: Record<string, unknown> = {};

    switch (period) {
        case 'daily':
            tableName = 'leaderboard_daily';
            dateFilter = { date: new Date().toISOString().split('T')[0] };
            break;
        case 'weekly':
            tableName = 'leaderboard_weekly';
            const weekStart = getWeekStart(new Date());
            dateFilter = { week_start: weekStart.toISOString().split('T')[0] };
            break;
        case 'alltime':
        default:
            tableName = 'leaderboard_alltime';
            break;
    }

    // Get all entries sorted by XP desc
    let query = supabase.from(tableName).select('wallet_address, xp').order('xp', { ascending: false });
    if (Object.keys(dateFilter).length > 0) {
        const [key, value] = Object.entries(dateFilter)[0];
        query = query.eq(key, value);
    }

    const { data: entries } = await query;

    if (!entries) return;

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
        let updateQuery = supabase
            .from(tableName)
            .update({ rank: i + 1 })
            .eq('wallet_address', entries[i].wallet_address);

        if (Object.keys(dateFilter).length > 0) {
            const [key, value] = Object.entries(dateFilter)[0];
            updateQuery = updateQuery.eq(key, value);
        }

        await updateQuery;
    }
}

/**
 * Helper: Get start of current week (Monday)
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
