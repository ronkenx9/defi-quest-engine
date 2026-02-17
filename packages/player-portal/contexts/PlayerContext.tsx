'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { useProgram } from './ProgramContext';
import { supabase } from '@/lib/supabase';
import { QuestEngine, Mission, MissionProgress } from '@defi-quest/core';

interface UserStats {
    wallet_address: string;
    total_points: number;
    current_streak: number;
    level: number;
    total_missions_completed: number;
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

    // Initialize Quest Engine
    useEffect(() => {
        const questEngine = new QuestEngine({
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            solanaRpcUrl: connection.rpcEndpoint,
            network: 'devnet',
        });

        questEngine.initialize().then(() => {
            setEngine(questEngine);
            setMissions(questEngine.getMissions());
        });

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
                // Default stats for new user
                setUserStats({
                    wallet_address: address,
                    total_points: 0,
                    current_streak: 0,
                    level: 1,
                    total_missions_completed: 0,
                });
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
