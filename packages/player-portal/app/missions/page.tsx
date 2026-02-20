'use client';

import { useState } from 'react';
import { Target, ArrowRight } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import MissionCard from '@/components/player/MissionCard';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { supabase } from '@/lib/supabase';
import { Mission } from '@defi-quest/core';

export default function MissionsPage() {
    const { walletAddress } = useWallet();
    const { missions: allMissions, getMissionProgress, loading: contextLoading, startMission } = usePlayer();
    const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard' | 'legendary'>('all');

    const missions = allMissions.filter((m: Mission) => filter === 'all' || (m.difficulty ?? '').toLowerCase() === filter);
    const loading = contextLoading;

    const filters = ['all', 'easy', 'medium', 'hard', 'legendary'] as const;

    return (
        <div className="min-h-screen crt-overlay">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // MISSION CONTROL
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">ACTIVE </span>
                        <span className="text-[#4ade80]">MISSIONS</span>
                    </h1>
                    <p className="text-gray-400">
                        Complete missions to earn XP and unlock NFT badges.
                    </p>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 flex-wrap animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {filters.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                    ? 'bg-[#4ade80] text-black'
                                    : 'bg-[#0a0f0a] border border-gray-700 text-gray-400 hover:border-[#4ade80]/50'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Mission grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-48 rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : missions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
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
                    <div className="text-center py-16 text-gray-500">
                        <Target className="w-12 h-12 text-[#4ade80] mx-auto mb-4" />
                        <p>No {filter !== 'all' ? filter : ''} missions available.</p>
                    </div>
                )}

                {/* Stats summary */}
                <div className="mt-12 p-6 rounded-xl border border-[#4ade80]/10 bg-[#0a0f0a]/50 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-bold text-[#4ade80]">{missions.length}</div>
                            <div className="text-xs text-gray-500">Active Missions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#22c55e]">
                                {missions.reduce((sum: number, m: Mission) => sum + ((m as any).reward?.points || (m as any).points || 0), 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Total XP Available</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {missions.filter((m: Mission) => (m.difficulty ?? '').toLowerCase() === 'legendary').length}
                            </div>
                            <div className="text-xs text-gray-500">Legendary Quests</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-400">
                                {missions.filter((m: Mission) => (m as any).resetCycle === 'daily').length}
                            </div>
                            <div className="text-xs text-gray-500">Daily Missions</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
