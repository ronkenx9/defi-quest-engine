/**
 * Quest Chain System
 * Multi-step narrative quests with progressive rewards
 */

import { createClient } from '@supabase/supabase-js';


function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export interface QuestStep {
    step: number;
    name: string;
    description: string;
    type: 'swap_count' | 'swap_count_timed' | 'volume' | 'streak' | 'new_token' | 'total_xp';
    target: number;
    time_limit_hours?: number;
}

export interface QuestChain {
    id: string;
    name: string;
    description: string;
    theme: string;
    steps: QuestStep[];
    final_reward_xp: number;
    final_reward_badge: string | null;
    final_reward_badge_rarity: string | null;
    is_active: boolean;
}

export interface QuestChainProgress {
    chain_id: string;
    chain: QuestChain;
    current_step: number;
    step_progress: Record<string, number>;
    status: 'active' | 'completed';
    started_at: string;
    completed_at: string | null;
}

/**
 * Get all active quest chains
 */
export async function getActiveQuestChains(): Promise<QuestChain[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('quest_chains')
        .select('*')
        .eq('is_active', true);

    if (error) return [];
    return data || [];
}

/**
 * Get user's progress on all chains
 */
export async function getUserChainProgress(walletAddress: string): Promise<QuestChainProgress[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('quest_chain_progress')
        .select(`
            chain_id,
            current_step,
            step_progress,
            status,
            started_at,
            completed_at,
            quest_chains (*)
        `)
        .eq('wallet_address', walletAddress);

    if (error || !data) return [];

    return data.map(d => ({
        chain_id: d.chain_id,
        chain: d.quest_chains as unknown as QuestChain,
        current_step: d.current_step,
        step_progress: d.step_progress as Record<string, number>,
        status: d.status as 'active' | 'completed',
        started_at: d.started_at,
        completed_at: d.completed_at,
    }));
}

/**
 * Start a quest chain
 */
export async function startQuestChain(walletAddress: string, chainId: string): Promise<boolean> {
    const supabase = getSupabase();

    const { error } = await supabase.from('quest_chain_progress').insert({
        wallet_address: walletAddress,
        chain_id: chainId,
        current_step: 0,
        step_progress: {},
        status: 'active',
    });

    return !error;
}

/**
 * Update progress on a chain step
 */
export async function updateChainProgress(
    walletAddress: string,
    chainId: string,
    stepKey: string,
    value: number
): Promise<{ stepCompleted: boolean; chainCompleted: boolean }> {
    const supabase = getSupabase();

    // Get current progress
    const { data: progress } = await supabase
        .from('quest_chain_progress')
        .select('current_step, step_progress')
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .single();

    if (!progress) return { stepCompleted: false, chainCompleted: false };

    // Get chain details
    const { data: chain } = await supabase
        .from('quest_chains')
        .select('steps')
        .eq('id', chainId)
        .single();

    if (!chain) return { stepCompleted: false, chainCompleted: false };

    const steps = chain.steps as QuestStep[];
    const currentStepIndex = progress.current_step;
    const currentStep = steps[currentStepIndex];

    if (!currentStep) return { stepCompleted: false, chainCompleted: false };

    // Update step progress
    const newProgress = { ...progress.step_progress, [stepKey]: value };

    // Check if step is completed
    const stepCompleted = value >= currentStep.target;
    const nextStep = stepCompleted ? currentStepIndex + 1 : currentStepIndex;
    const chainCompleted = stepCompleted && nextStep >= steps.length;

    await supabase
        .from('quest_chain_progress')
        .update({
            step_progress: newProgress,
            current_step: nextStep,
            status: chainCompleted ? 'completed' : 'active',
            completed_at: chainCompleted ? new Date().toISOString() : null,
        })
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId);

    return { stepCompleted, chainCompleted };
}

/**
 * Complete a chain and award rewards
 */
export async function completeQuestChain(
    walletAddress: string,
    chainId: string
): Promise<{ xpAwarded: number; badgeAwarded: string | null }> {
    const supabase = getSupabase();

    // Get chain details
    const { data: chain } = await supabase
        .from('quest_chains')
        .select('final_reward_xp, final_reward_badge, final_reward_badge_rarity')
        .eq('id', chainId)
        .single();

    if (!chain) return { xpAwarded: 0, badgeAwarded: null };

    // Award XP
    const { data: stats } = await supabase
        .from('user_stats')
        .select('total_points')
        .eq('wallet_address', walletAddress)
        .single();

    const newPoints = (stats?.total_points || 0) + chain.final_reward_xp;

    await supabase
        .from('user_stats')
        .upsert({
            wallet_address: walletAddress,
            total_points: newPoints,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address' });

    // Award badge if specified
    if (chain.final_reward_badge) {
        await supabase.from('user_badges').insert({
            wallet_address: walletAddress,
            name: chain.final_reward_badge,
            description: `Earned by completing quest chain`,
            rarity: chain.final_reward_badge_rarity || 'rare',
            source: 'chain',
        });
    }

    return {
        xpAwarded: chain.final_reward_xp,
        badgeAwarded: chain.final_reward_badge,
    };
}

/**
 * Get all quest chains (including inactive for admin)
 */
export async function getAllChains(): Promise<QuestChain[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('quest_chains')
        .select('*')
        .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
}

/**
 * Get active chains for a user (alias for getUserChainProgress)
 */
export async function getActiveChains(walletAddress: string): Promise<QuestChainProgress[]> {
    return getUserChainProgress(walletAddress);
}

/**
 * Get chain progress for a specific chain
 */
export async function getChainProgress(walletAddress: string, chainId: string): Promise<QuestChainProgress | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('quest_chain_progress')
        .select(`
            chain_id,
            current_step,
            step_progress,
            status,
            started_at,
            completed_at,
            quest_chains (*)
        `)
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .single();

    if (error || !data) return null;

    return {
        chain_id: data.chain_id,
        chain: data.quest_chains as unknown as QuestChain,
        current_step: data.current_step,
        step_progress: data.step_progress as Record<string, number>,
        status: data.status as 'active' | 'completed',
        started_at: data.started_at,
        completed_at: data.completed_at,
    };
}

/**
 * Check if wallet can start a chain (not already started/completed)
 */
export async function canStartChain(walletAddress: string, chainId: string): Promise<boolean> {
    const supabase = getSupabase();

    const { data } = await supabase
        .from('quest_chain_progress')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('chain_id', chainId)
        .single();

    return !data;
}
