/**
 * Supabase Service Layer
 * Typed CRUD operations for the admin dashboard
 */

import { supabase } from './supabase';
import { logError } from './logger';

// ============================================
// Types
// ============================================

export interface Mission {
    id: string;
    name: string;
    description: string;
    type: 'swap' | 'volume' | 'streak' | 'price' | 'routing' | 'limit_order' | 'dca';
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
    points: number;
    reset_cycle: 'none' | 'daily' | 'weekly' | 'monthly';
    requirement: Record<string, unknown>;
    is_active: boolean;
    completions: number;
    created_at: string;
    updated_at: string;
}

export interface CreateMissionInput {
    name: string;
    description?: string;
    type: Mission['type'];
    difficulty: Mission['difficulty'];
    points: number;
    reset_cycle?: Mission['reset_cycle'];
    requirement?: Record<string, unknown>;
    is_active?: boolean;
}

export interface UpdateMissionInput extends Partial<CreateMissionInput> {
    completions?: number;
}

export interface DashboardStats {
    totalUsers: number;
    activeQuests: number;
    volumeTraded: number;
    avgStreak: number;
}

export interface ActivityLogEntry {
    id: string;
    wallet_address: string;
    action: string;
    mission_id: string | null;
    details: Record<string, unknown>;
    created_at: string;
    mission?: Pick<Mission, 'name'> | null;
}

// ============================================
// Mission Services
// ============================================

/**
 * Fetch all missions
 */
export async function getMissions(): Promise<Mission[]> {
    const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        logError('Error fetching missions:');
        throw error;
    }

    return data || [];
}

/**
 * Create a new mission
 */
export async function createMission(input: CreateMissionInput): Promise<Mission> {
    const { data, error } = await supabase
        .from('missions')
        .insert([{
            name: input.name,
            description: input.description || '',
            type: input.type,
            difficulty: input.difficulty,
            points: input.points,
            reset_cycle: input.reset_cycle || 'none',
            requirement: input.requirement || {},
            is_active: input.is_active ?? true,
        }])
        .select()
        .single();

    if (error) {
        logError('Error creating mission:');
        throw error;
    }

    return data;
}

/**
 * Update an existing mission
 */
export async function updateMission(id: string, input: UpdateMissionInput): Promise<Mission> {
    const { data, error } = await supabase
        .from('missions')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        logError('Error updating mission:');
        throw error;
    }

    return data;
}

/**
 * Toggle mission active status
 */
export async function toggleMission(id: string): Promise<Mission> {
    // First get current status
    const { data: current, error: fetchError } = await supabase
        .from('missions')
        .select('is_active')
        .eq('id', id)
        .single();

    if (fetchError) {
        logError('Error fetching mission:');
        throw fetchError;
    }

    // Toggle it
    const { data, error } = await supabase
        .from('missions')
        .update({
            is_active: !current.is_active,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        logError('Error toggling mission:');
        throw error;
    }

    return data;
}

/**
 * Delete a mission
 */
export async function deleteMission(id: string): Promise<void> {
    const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);

    if (error) {
        logError('Error deleting mission:');
        throw error;
    }
}

// ============================================
// Dashboard Stats Services
// ============================================

/**
 * Get aggregated stats for the dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    // Get unique users count
    const { count: userCount, error: userError } = await supabase
        .from('user_stats')
        .select('*', { count: 'exact', head: true });

    if (userError) {
        logError('Error fetching user count:');
    }

    // Get active quests count
    const { count: activeCount, error: activeError } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    if (activeError) {
        logError('Error fetching active quests:');
    }

    // Get total volume (sum of user points as proxy for now)
    const { data: volumeData, error: volumeError } = await supabase
        .from('user_stats')
        .select('total_points');

    if (volumeError) {
        logError('Error fetching volume:');
    }

    const totalPoints = volumeData?.reduce((sum, u) => sum + (u.total_points || 0), 0) || 0;

    // Get average streak
    const { data: streakData, error: streakError } = await supabase
        .from('user_stats')
        .select('current_streak');

    if (streakError) {
        logError('Error fetching streaks:');
    }

    const avgStreak = streakData && streakData.length > 0
        ? streakData.reduce((sum, u) => sum + (u.current_streak || 0), 0) / streakData.length
        : 0;

    return {
        totalUsers: userCount || 0,
        activeQuests: activeCount || 0,
        volumeTraded: totalPoints * 100, // Convert points to estimated volume
        avgStreak: Math.round(avgStreak * 10) / 10,
    };
}

/**
 * Get recent activity for the dashboard feed
 */
export async function getRecentActivity(limit: number = 10): Promise<ActivityLogEntry[]> {
    const { data, error } = await supabase
        .from('activity_log')
        .select(`
            *,
            mission:missions(name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        logError('Error fetching activity:');
        throw error;
    }

    return data || [];
}

// ============================================
// Custom Hook for Missions
// ============================================

import { useState, useEffect, useCallback } from 'react';

export function useMissions() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchMissions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMissions();
            setMissions(data);
            setError(null);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    const handleToggle = async (id: string) => {
        try {
            const updated = await toggleMission(id);
            setMissions(prev => prev.map(m => m.id === id ? updated : m));
        } catch (err) {
            logError('Failed to toggle mission:');
            throw err;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteMission(id);
            setMissions(prev => prev.filter(m => m.id !== id));
        } catch (err) {
            logError('Failed to delete mission:');
            throw err;
        }
    };

    const handleCreate = async (input: CreateMissionInput) => {
        try {
            const created = await createMission(input);
            setMissions(prev => [created, ...prev]);
            return created;
        } catch (err) {
            logError('Failed to create mission:');
            throw err;
        }
    };

    return {
        missions,
        loading,
        error,
        refetch: fetchMissions,
        toggleMission: handleToggle,
        deleteMission: handleDelete,
        createMission: handleCreate,
    };
}

/**
 * Hook for dashboard stats
 */
export function useDashboardStats() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                setLoading(true);
                const data = await getDashboardStats();
                setStats(data);
                setError(null);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return { stats, loading, error };
}

/**
 * Hook for recent activity
 */
export function useRecentActivity(limit: number = 10) {
    const [activity, setActivity] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetch() {
            try {
                setLoading(true);
                const data = await getRecentActivity(limit);
                setActivity(data);
                setError(null);
            } catch (err) {
                setError(err as Error);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [limit]);

    return { activity, loading, error };
}
