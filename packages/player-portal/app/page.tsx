'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Target, Trophy, Gamepad2, ChevronRight, ArrowRight, Eye } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import XPProgressBar from '@/components/player/XPProgressBar';
import MissionCard from '@/components/player/MissionCard';
import MissionActionPanel from '@/components/player/MissionActionPanel';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';

import { Mission } from '@defi-quest/core';

export default function PlayerPortal() {
    const { walletAddress, connect, connecting } = useWallet();
    const { userStats, loading: contextLoading, missions: allMissions, getMissionProgress, startMission } = usePlayer();
    const [activeMissionId, setActiveMissionId] = useState<string | null>(null);

    const missions = allMissions.slice(0, 6);
    const loading = contextLoading;

    const handleStartMission = (mission: Mission) => {
        if (activeMissionId === mission.id) {
            setActiveMissionId(null);
            return;
        }
        startMission(mission.id);
        setActiveMissionId(mission.id);
    };

    return (
        <div className="min-h-screen crt-overlay">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {/* ═════════════════════════════════════
                    HERO — "WELCOME TO THE MATRIX"
                    ═════════════════════════════════════ */}
                <section className="relative mb-16 py-12 md:py-16 overflow-hidden">
                    <div className="absolute inset-0 grid-bg opacity-50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#4ade80] rounded-full blur-[200px] opacity-[0.04] pointer-events-none"></div>

                    <div className="relative z-10 text-center">
                        <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-4 font-mono animate-fade-in">
                            // OPERATOR CONSOLE
                        </p>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <span className="text-white">WELCOME TO </span>
                            <span className="text-[#4ade80]" style={{ textShadow: '0 0 30px rgba(74, 222, 128, 0.5)' }}>
                                THE MATRIX
                            </span>
                        </h1>

                        <p className="text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            Complete missions. Earn XP. Collect NFT badges. Escape the simulation.
                        </p>

                        {/* The System Observer Cue */}
                        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-[#4ade80]/20 bg-[#4ade80]/5 text-xs font-mono font-bold tracking-widest text-[#4ade80] animate-pulse relative overflow-hidden group animate-slide-up" style={{ animationDelay: '0.3s' }}>
                            <div className="absolute inset-0 bg-[#4ade80]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Eye className="w-4 h-4" />
                            THE SYSTEM IS WATCHING
                            <span className="w-1.5 h-4 bg-[#4ade80] animate-[ping_1s_infinite]"></span>
                        </div>

                        {!walletAddress && (
                            <div className="mt-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                                <button
                                    onClick={connect}
                                    disabled={connecting}
                                    className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#4ade80] via-[#22c55e] to-[#4ade80] text-black font-['Orbitron'] font-bold text-sm tracking-widest uppercase overflow-hidden transition-all disabled:opacity-50 hover:shadow-[0_0_30px_rgba(74,222,128,0.4)] hover:scale-[1.02]"
                                >
                                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -ml-8" />
                                    <span className="relative flex items-center gap-2">
                                        {connecting ? 'Connecting...' : 'Enter The Matrix'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═══ PLAYER STATS ═══ */}
                {walletAddress && userStats && (
                    <section className="mb-12 animate-fade-in">
                        <XPProgressBar
                            currentXP={userStats.total_points}
                            level={userStats.level}
                            streak={userStats.current_streak}
                            missionsCompleted={userStats.total_missions_completed}
                        />
                    </section>
                )}

                {/* ═══ QUICK ACTIONS ═══ */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 stagger-children">
                    <Link
                        href="/swap"
                        className="group relative p-6 rounded-xl bg-[#0a0f0a] border border-[#4ade80]/10 hover:border-[#4ade80]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.08)] overflow-hidden animate-slide-up"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#4ade80] rounded-full blur-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"></div>
                        <Zap className="w-6 h-6 text-[#4ade80] mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#4ade80] transition-colors">Swap Protocol</h3>
                        <p className="text-sm text-gray-400">Execute Jupiter swaps and earn XP</p>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/missions"
                        className="group relative p-6 rounded-xl bg-[#0a0f0a] border border-[#4ade80]/10 hover:border-[#4ade80]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.08)] overflow-hidden animate-slide-up"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#4ade80] rounded-full blur-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"></div>
                        <Target className="w-6 h-6 text-[#4ade80] mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#4ade80] transition-colors">Active Missions</h3>
                        <p className="text-sm text-gray-400">View and track your quests</p>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/badges"
                        className="group relative p-6 rounded-xl bg-[#0a0f0a] border border-[#4ade80]/10 hover:border-[#4ade80]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,222,128,0.08)] overflow-hidden animate-slide-up"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#4ade80] rounded-full blur-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"></div>
                        <Trophy className="w-6 h-6 text-[#4ade80] mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#4ade80] transition-colors">Badge Collection</h3>
                        <p className="text-sm text-gray-400">Your Metaplex NFT achievements</p>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                </section>

                {/* ═══ ACTIVE MISSIONS ═══ */}
                <section className="mb-14">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">
                            <span className="text-[#4ade80]">//</span> ACTIVE MISSIONS
                        </h2>
                        <Link href="/missions" className="text-sm text-[#4ade80] hover:underline flex items-center gap-1">
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-44 rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse" />
                            ))}
                        </div>
                    ) : missions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                            {missions.map((mission) => {
                                const progressData = getMissionProgress(mission.id);
                                const percent = progressData ? progressData.progressPercent : 0;
                                return (
                                    <div key={mission.id} className="flex flex-col">
                                        <MissionCard
                                            mission={mission as any}
                                            progress={percent}
                                            walletConnected={!!walletAddress}
                                            onStart={() => handleStartMission(mission as any)}
                                        />
                                        {activeMissionId === mission.id && (
                                            <MissionActionPanel
                                                mission={mission as any}
                                                onClose={() => setActiveMissionId(null)}
                                                walletAddress={walletAddress}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16 rounded-xl border border-[#4ade80]/10 bg-[#0a0f0a]">
                            <Target className="w-10 h-10 text-[#4ade80] mx-auto mb-4 opacity-40" />
                            <p className="text-gray-500">No active missions available.</p>
                            <p className="text-gray-600 text-sm mt-1">Check back later or create missions in the admin panel.</p>
                        </div>
                    )}
                </section>

                {/* ═══ CONNECT CTA ═══ */}
                {!walletAddress && (
                    <section className="max-w-2xl mx-auto mt-8 mb-16 text-center animate-fade-in">
                        <div className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-b from-[#22c55e]/10 to-[#10b981]/5 border border-[#22c55e]/20 overflow-hidden group">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[#22c55e]/20 blur-[120px] opacity-[0.15] pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#22c55e] to-[#3b82f6] p-[2px] mb-6 mx-auto shadow-[0_0_40px_rgba(34,197,94,0.3)] group-hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] transition-shadow duration-500">
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
                            </div>
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
