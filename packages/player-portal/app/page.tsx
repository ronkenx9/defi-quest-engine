'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Target, Trophy, Plug, Eye } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import XPProgressBar from '@/components/player/XPProgressBar';
import MissionCard from '@/components/player/MissionCard';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { supabase } from '@/lib/supabase';

import { Mission } from '@defi-quest/core';
// UserStats and Mission are now typed from contexts and core

export default function PlayerPortal() {
    const { walletAddress, connect, connecting } = useWallet();
    const { userStats, loading: contextLoading, missions: allMissions, getMissionProgress, startMission } = usePlayer();

    const missions = allMissions.slice(0, 6);
    const loading = contextLoading;

    // fetchMissions is now handled by the QuestEngine in PlayerContext

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
                    <p className="text-gray-400 max-w-xl mx-auto mb-8">
                        Complete missions. Earn XP. Collect NFT badges. Escape the simulation.
                    </p>

                    {/* The System Observer Cue */}
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#4ade80]/20 bg-[#4ade80]/5 text-xs font-mono font-bold tracking-widest text-[#4ade80] animate-pulse relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[#4ade80]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Eye className="w-4 h-4" />
                        THE SYSTEM IS WATCHING
                        <span className="w-1.5 h-4 bg-[#4ade80] animate-[ping_1s_infinite]"></span>
                    </div>
                </div>

                {/* Stats Section */}
                {walletAddress && userStats && (
                    <div className="mb-12">
                        <XPProgressBar
                            currentXP={userStats.total_points}
                            level={userStats.level}
                            streak={userStats.current_streak}
                            missionsCompleted={userStats.total_missions_completed}
                        />
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <Link
                        href="/swap"
                        className="group p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a] hover:border-[#4ade80]/50 transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                    >
                        <Zap className="w-6 h-6 text-[#4ade80] mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">Swap Protocol</h3>
                        <p className="text-sm text-gray-400">Execute Jupiter swaps and earn XP</p>
                    </Link>

                    <Link
                        href="/missions"
                        className="group p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a] hover:border-[#4ade80]/50 transition-all hover:shadow-[0_0_30px_rgba(74,222,128,0.15)]"
                    >
                        <Target className="w-6 h-6 text-[#4ade80] mb-2" />
                        <h3 className="text-lg font-bold text-white mb-1">Active Missions</h3>
                        <p className="text-sm text-gray-400">View and track your quests</p>
                    </Link>

                    <Link
                        href="/badges"
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
                            href="/missions"
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
                            {missions.map((mission) => {
                                const progressData = getMissionProgress(mission.id);
                                const percent = progressData ? progressData.progressPercent : 0;
                                return (
                                    <MissionCard
                                        key={mission.id}
                                        mission={mission as any}
                                        progress={percent}
                                        walletConnected={!!walletAddress}
                                        onStart={() => startMission(mission.id)}
                                    />
                                );
                            })}
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
                    <div className="max-w-2xl mx-auto mt-16 text-center p-8 lg:p-12 rounded-3xl bg-gradient-to-b from-[#22c55e]/10 to-[#10b981]/5 border border-[#22c55e]/20 relative overflow-hidden group">
                        {/* Background glowing effects */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#22c55e]/20 blur-[100px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#3b82f6] p-[2px] mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-shadow duration-500">
                                <div className="w-full h-full bg-[#050507] rounded-full flex items-center justify-center">
                                    <span className="text-3xl">🪐</span>
                                </div>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                                Enter the Matrix via <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] to-[#3b82f6]">Jupiter Mobile</span>
                            </h3>

                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                The ultimate Solana deep-link experience. Seamlessly authenticate, trade, and earn XP directly from your mobile device.
                            </p>

                            <button
                                onClick={connect}
                                disabled={connecting}
                                className="relative overflow-hidden w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-[#22c55e] via-[#10b981] to-[#3b82f6] text-white font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 group/btn"
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover/btn:translate-x-full transition-transform duration-700 -skew-x-12 -ml-8" />
                                <span className="relative flex items-center justify-center gap-2">
                                    {connecting ? 'Establishing Connection...' : 'Connect Jupiter Mobile'}
                                </span>
                            </button>

                            <button
                                onClick={connect}
                                className="mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors underline decoration-dotted underline-offset-4"
                            >
                                Looking for browser wallets?
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
