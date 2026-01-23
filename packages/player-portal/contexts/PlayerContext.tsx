'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContext';
import { supabase } from '@/lib/supabase';

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
    refreshStats: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
    const { walletAddress } = useWallet();
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);

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
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshStats = useCallback(async () => {
        if (walletAddress) {
            await fetchUserStats(walletAddress);
        }
    }, [walletAddress, fetchUserStats]);

    useEffect(() => {
        if (walletAddress) {
            fetchUserStats(walletAddress);
        } else {
            setUserStats(null);
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

    return (
        <PlayerContext.Provider value={{ userStats, loading, refreshStats }}>
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
