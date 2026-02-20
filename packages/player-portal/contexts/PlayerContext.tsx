'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { useProgram } from './ProgramContext';
import { supabase } from '@/lib/supabase';
import { QuestEngine, Mission, MissionProgress, MissionStatus, PlayerProfileNFT } from '@defi-quest/core';

interface UserStats {
    wallet_address: string;
    total_points: number;
    current_streak: number;
    level: number;
    total_missions_completed: number;
    profile_nft_address?: string;
}

interface PlayerContextType {
    userStats: UserStats | null;
    loading: boolean;
    engine: QuestEngine | null;
    missions: Mission[];
    userProgress: MissionProgress[];
    refreshStats: () => Promise<void>;
    startMission: (missionId: string) => Promise<void>;
    claimReward: (missionId: string) => Promise<void>;
    getMissionProgress: (missionId: string) => MissionProgress | undefined;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { walletAddress } = useWallet();
    const { program, connection } = useProgram();
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [engine, setEngine] = useState<QuestEngine | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [userProgress, setUserProgress] = useState<MissionProgress[]>([]);

    // Initialize Quest Engine + fetch missions from Supabase
    useEffect(() => {
        const questEngine = new QuestEngine({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            solanaRpcUrl: connection.rpcEndpoint,
            network: 'mainnet-beta',
        });

        const init = async () => {
            try {
                // Initialize the engine (may have hardcoded missions)
                await questEngine.initialize().catch(() => { });
                setEngine(questEngine);

                const engineMissions = questEngine.getMissions() || [];

                // Also fetch missions directly from Supabase (Overseer AI + admin-created)
                const { data: dbMissions, error } = await supabase
                    .from('missions')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Failed to fetch missions from Supabase:', error.message);
                }

                // Map DB rows to the Mission type the frontend expects
                const mappedDbMissions: Mission[] = (dbMissions ?? []).map((m: any) => ({
                    id: m.id,
                    name: m.name ?? 'Unknown Mission',
                    description: m.description ?? '',
                    type: m.type ?? 'swap',
                    difficulty: m.difficulty ?? 'easy',
                    points: m.points ?? 0,
                    reward: m.reward ?? { type: 'xp', points: m.points ?? 0 },
                    resetCycle: m.reset_cycle ?? 'none',
                    isActive: m.is_active ?? true,
                    requirement: m.requirement ?? {},
                    status: m.is_active ? MissionStatus.ACTIVE : MissionStatus.LOCKED,
                    createdAt: m.created_at ? new Date(m.created_at) : new Date(),
                    updatedAt: m.updated_at ? new Date(m.updated_at) : new Date(),
                }));

                // Merge: DB missions take priority, engine missions fill gaps
                const seenIds = new Set(mappedDbMissions.map((m: Mission) => m.id));
                const merged = [
                    ...mappedDbMissions,
                    ...engineMissions.filter((m: Mission) => !seenIds.has(m.id)),
                ];

                setMissions(merged);
            } catch (err) {
                console.error('PlayerContext init error:', err);
            } finally {
                setLoading(false);
            }
        };

        init();

        return () => questEngine.destroy();
    }, [connection]);

    const fetchUserStats = useCallback(async (address: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_stats')
                .select('*')
                .eq('wallet_address', address)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user stats:', error);
            }

            if (data) {
                setUserStats(data);
            } else {
                let profileAddress = null;
                try {
                    console.log('Minting new player profile NFT...');
                    const profileNFT = new PlayerProfileNFT(connection.rpcEndpoint);

                    // Note: In browser, we might need a different signer setup for UMI 
                    // This uses a generated signer for the asset, but auth needs wallet adapter
                    // For the sake of the hackathon flow, we log it and simulate if it fails due to auth
                    const pubkey = await profileNFT.mintProfile(address, 'Player');
                    profileAddress = pubkey.toString();
                    console.log('Minted profile NFT:', profileAddress);
                } catch (nftError) {
                    console.error('Failed to mint profile NFT on connect:', nftError);
                }

                const newUserStats = {
                    wallet_address: address,
                    total_points: 0,
                    current_streak: 0,
                    level: 1,
                    total_missions_completed: 0,
                    profile_nft_address: profileAddress || undefined,
                };

                // Save to supabase
                const { error: insertError } = await supabase
                    .from('user_stats')
                    .insert(newUserStats);

                if (insertError) console.error('Error saving new user stats:', insertError);

                setUserStats(newUserStats);
            }

            if (engine) {
                setUserProgress(engine.getUserProgress(address));
            }
        } finally {
            setLoading(false);
        }
    }, [engine]);

    const refreshStats = useCallback(async () => {
        if (walletAddress) {
            await fetchUserStats(walletAddress);
        }
    }, [walletAddress, fetchUserStats]);

    const startMission = async (missionId: string) => {
        if (!engine || !walletAddress) return;
        try {
            await engine.startMission(missionId);
            await refreshStats();
        } catch (err) {
            console.error('Failed to start mission:', err);
        }
    };

    const claimReward = async (missionId: string) => {
        if (!engine || !walletAddress) return;
        try {
            await engine.claimReward(missionId);
            await refreshStats();
        } catch (err) {
            console.error('Failed to claim reward:', err);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            fetchUserStats(walletAddress);
        } else {
            setUserStats(null);
            setUserProgress([]);
            setLoading(false);
        }
    }, [walletAddress, fetchUserStats]);

    // Set up real-time listener for user stats
    useEffect(() => {
        if (!walletAddress) return;

        const channel = supabase
            .channel(`public:user_stats:wallet_address=eq.${walletAddress}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'user_stats',
                    filter: `wallet_address=eq.${walletAddress}`
                },
                (payload) => {
                    console.log('Real-time update received:', payload);
                    setUserStats(payload.new as UserStats);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [walletAddress]);

    const getMissionProgress = useCallback((missionId: string) => {
        return userProgress.find(p => p.missionId === missionId);
    }, [userProgress]);

    return (
        <PlayerContext.Provider value={{
            userStats,
            loading,
            engine,
            missions,
            userProgress,
            refreshStats,
            startMission,
            claimReward,
            getMissionProgress
        }}>
            {children}
        </PlayerContext.Provider>
    );
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
}
