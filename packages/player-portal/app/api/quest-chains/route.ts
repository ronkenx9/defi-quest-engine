import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/quest-chains - List all quest chains with progress
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        // Get all quest chains
        const { data: chains, error: chainsError } = await supabase
            .from('quest_chains')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (chainsError) throw chainsError;

        // Get missions for each chain
        const { data: missions, error: missionsError } = await supabase
            .from('missions')
            .select('id, title, chain_id, chain_order, xp_reward')
            .not('chain_id', 'is', null)
            .order('chain_order', { ascending: true });

        if (missionsError) throw missionsError;

        // Get user's progress if wallet provided
        let progress: Record<string, { current_step: number; completed: boolean }> = {};
        if (walletAddress) {
            const { data: progressData } = await supabase
                .from('chain_progress')
                .select('chain_id, current_step, completed')
                .eq('wallet_address', walletAddress);

            if (progressData) {
                progressData.forEach(p => {
                    progress[p.chain_id] = {
                        current_step: p.current_step,
                        completed: p.completed,
                    };
                });
            }
        }

        // Combine data
        const chainsWithMissions = chains?.map(chain => ({
            ...chain,
            missions: missions?.filter(m => m.chain_id === chain.id) || [],
            progress: progress[chain.id] || { current_step: 0, completed: false },
        }));

        return NextResponse.json({ chains: chainsWithMissions });
    } catch (error) {
        console.error('Error fetching quest chains:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quest chains' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
