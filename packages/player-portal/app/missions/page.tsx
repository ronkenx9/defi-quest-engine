'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, ArrowRight, Flame, Filter } from 'lucide-react';
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
    const filterColors: Record<string, string> = {
        all: 'var(--cyan)',
        easy: '#4ade80',
        medium: 'var(--cyan)',
        hard: '#f97316',
        legendary: 'var(--magenta)',
    };

    return (
        <div className="min-h-screen crt-overlay">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-2 text-[var(--cyan)] text-[10px] font-mono tracking-[0.3em] uppercase mb-3">
                        <Target className="w-3.5 h-3.5" />
                        Mission Control
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">
                        <span className="text-white">Active </span>
                        <span className="text-gradient-cyan">Missions</span>
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm">
                        Complete missions to earn XP and collectible on-chain NFT badges.
                    </p>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-8 flex-wrap animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    {filters.map((f) => {
                        const isActive = filter === f;
                        const color = filterColors[f];
                        return (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className="px-4 py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200"
                                style={{
                                    background: isActive ? color + '18' : 'var(--void-card)',
                                    border: `1px solid ${isActive ? color + '40' : 'var(--border)'}`,
                                    color: isActive ? color : 'var(--text-muted)',
                                    boxShadow: isActive ? `0 0 12px ${color}15` : 'none',
                                }}
                            >
                                {f}
                            </button>
                        );
                    })}
                </div>

                {/* Mission grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-48 rounded-xl bg-[var(--void-card)] border border-[var(--border)] animate-pulse"
                            />
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
                    <div className="text-center py-20 rounded-xl border border-[var(--border)] bg-[var(--void-card)]">
                        <Target className="w-12 h-12 text-[var(--cyan)] mx-auto mb-4 opacity-30" />
                        <p className="text-[var(--text-muted)]">
                            No {filter !== 'all' ? filter : ''} missions available.
                        </p>
                    </div>
                )}

                {/* Bottom stats bar */}
                <div className="mt-12 p-5 rounded-xl border border-[var(--border)] bg-[var(--void-card)] animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-black text-gradient-cyan">{missions.length}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-1">Active Missions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-[var(--gold)]">
                                {missions.reduce((sum: number, m: Mission) => sum + ((m as any).reward?.points || (m as any).points || 0), 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-1">Total XP Available</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-[var(--magenta)]">
                                {missions.filter((m: Mission) => (m.difficulty ?? '').toLowerCase() === 'legendary').length}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-1">Legendary Quests</div>
                        </div>
                        <div>
                            <div className="text-2xl font-black text-[#4ade80]">
                                {missions.filter((m: Mission) => (m as any).resetCycle === 'daily').length}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-1">Daily Missions</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
