'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Target, Trophy, Plug } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import XPProgressBar from '@/components/player/XPProgressBar';
import MissionCard from '@/components/player/MissionCard';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface Mission {
    id: string;
    name: string;
    description: string;
    type: string;
    difficulty: string;
    points: number;
    is_active: boolean;
}

interface UserStats {
    wallet_address: string;
    total_points: number;
    current_streak: number;
    level: number;
    missions_completed: number;
}

export default function PlayerPortal() {
    const { walletAddress } = useWallet();
    const [userStats, setUserStats] = useState<UserStats | null>(null);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch user stats from Supabase
    const fetchUserStats = useCallback(async (address: string) => {
        const { data, error } = await supabase
            .from('user_stats')
            .select('*')
            .eq('wallet_address', address)
            .single();

        if (error && error.code !== 'PGRST116') {
            // Error other than "not found" - silently ignore
        }

        if (data) {
            setUserStats(data);
        } else {
            // Create default stats for new user
            setUserStats({
                wallet_address: address,
                total_points: 0,
                current_streak: 0,
                level: 1,
                missions_completed: 0,
            });
        }
    }, []);

    // Fetch active missions
    const fetchMissions = useCallback(async () => {
        const { data, error } = await supabase
            .from('missions')
            .select('*')
            .eq('is_active', true)
            .order('points', { ascending: true })
            .limit(6);

        if (!error) {
            setMissions(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    useEffect(() => {
        if (walletAddress) {
            fetchUserStats(walletAddress);
        } else {
            setUserStats(null);
        }
    }, [walletAddress, fetchUserStats]);

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-4 font-mono">
                        // OPERATOR CONSOLE
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        <span className="text-white">WELCOME TO </span>
                        <span className="text-[#4ade80]" style={{ textShadow: '0 0 30px rgba(74, 222, 128, 0.5)' }}>
                            THE MATRIX
                        </span>
                    </h1>
                    <p className="text-gray-400 max-w-xl mx-auto">
                        Complete missions. Earn XP. Collect NFT badges. Escape the simulation.
                    </p>
                </div>

                {/* Stats Section */}
                {walletAddress && userStats && (
                    <div className="mb-12">
                        <XPProgressBar
                            currentXP={userStats.total_points}
                            level={userStats.level}
                            streak={userStats.current_streak}
                            missionsCompleted={userStats.missions_completed}
                        />
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <Link
                        href="/play/swap"
                        className="group p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a] hover:border-[#4ade80]/50 transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                    >
                        <Zap className="w-6 h-6 text-[#4ade80] mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">Swap Protocol</h3>
                        <p className="text-sm text-gray-400">Execute Jupiter swaps and earn XP</p>
                    </Link>

                    <Link
                        href="/play/missions"
                        className="group p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a] hover:border-[#4ade80]/50 transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                    >
                        <Target className="w-6 h-6 text-[#4ade80] mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">Active Missions</h3>
                        <p className="text-sm text-gray-400">View and track your quests</p>
                    </Link>

                    <Link
                        href="/play/badges"
                        className="group p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a] hover:border-[#4ade80]/50 transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                    >
                        <Trophy className="w-6 h-6 text-[#4ade80] mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">Badge Collection</h3>
                        <p className="text-sm text-gray-400">Your Metaplex NFT achievements</p>
                    </Link>
                </div>

                {/* Active Missions */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">
                            <span className="text-[#4ade80]">//</span> ACTIVE MISSIONS
                        </h2>
                        <Link
                            href="/play/missions"
                            className="text-sm text-[#4ade80] hover:underline"
                        >
                            View All →
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-40 rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : missions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {missions.map((mission) => (
                                <MissionCard
                                    key={mission.id}
                                    mission={mission}
                                    progress={0}
                                    walletConnected={!!walletAddress}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No active missions available.</p>
                            <p className="text-sm mt-2">Check back later or create missions in the admin panel.</p>
                        </div>
                    )}
                </div>

                {/* Connect prompt if not connected */}
                {!walletAddress && (
                    <div className="text-center py-12 border border-dashed border-[#4ade80]/30 rounded-xl bg-[#4ade80]/5">
                        <Plug className="w-10 h-10 text-[#4ade80] mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">Connect to Jack In</h3>
                        <p className="text-gray-400 mb-4">
                            Connect your Solana wallet to start earning XP and collecting badges.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
