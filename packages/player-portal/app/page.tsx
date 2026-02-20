'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Zap, Target, Trophy, Plug, Gamepad2, ChevronRight, ArrowRight, Star, Flame, Shield } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import XPProgressBar from '@/components/player/XPProgressBar';
import MissionCard from '@/components/player/MissionCard';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';

import { Mission } from '@defi-quest/core';

export default function PlayerPortal() {
    const { walletAddress, connect, connecting } = useWallet();
    const { userStats, loading: contextLoading, missions: allMissions, getMissionProgress, startMission } = usePlayer();

    const missions = allMissions.slice(0, 6);
    const loading = contextLoading;

    return (
        <div className="min-h-screen crt-overlay">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {/* ═════════════════════════════════════
                    HERO SECTION
                    ═════════════════════════════════════ */}
                <section className="relative mb-16 py-12 md:py-16 overflow-hidden">
                    {/* Background grid */}
                    <div className="absolute inset-0 grid-bg opacity-50"></div>
                    {/* Glow effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--cyan)] rounded-full blur-[200px] opacity-[0.04] pointer-events-none"></div>

                    <div className="relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--cyan)]/20 bg-[var(--cyan-dim)] text-[var(--cyan)] text-[10px] font-mono font-bold tracking-[0.25em] uppercase mb-6 animate-fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse"></span>
                            Protocol Active — Mainnet Beta
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            <span className="text-white">EARN.</span>
                            <span className="text-gradient-cyan"> TRADE.</span>
                            <br className="md:hidden" />
                            <span className="text-gradient-magenta"> CONQUER.</span>
                        </h1>

                        <p className="text-[var(--text-muted)] text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            Complete DeFi missions on Solana. Earn XP. Collect on-chain NFT badges.
                            <br className="hidden sm:block" />
                            Powered by Jupiter & Metaplex Core.
                        </p>

                        {!walletAddress && (
                            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                                <button
                                    onClick={connect}
                                    disabled={connecting}
                                    className="group relative px-8 py-3.5 rounded-xl bg-gradient-to-r from-[var(--cyan)] via-[#00d4e0] to-[var(--cyan)] text-[var(--void)] font-['Orbitron'] font-bold text-sm tracking-widest uppercase overflow-hidden transition-all disabled:opacity-50 hover:shadow-[var(--glow-cyan)] hover:scale-[1.02]"
                                >
                                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -ml-8" />
                                    <span className="relative flex items-center gap-2">
                                        {connecting ? 'Connecting...' : 'Begin Quest'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ═════════════════════════════════════
                    PLAYER STATS (if connected)
                    ═════════════════════════════════════ */}
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

                {/* ═════════════════════════════════════
                    QUICK ACTIONS — 3-Column Grid
                    ═════════════════════════════════════ */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14 stagger-children">
                    <Link
                        href="/swap"
                        className="group relative p-6 rounded-xl bg-[var(--void-card)] border border-[var(--border)] hover:border-[var(--cyan)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,240,255,0.08)] overflow-hidden animate-slide-up"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--cyan)] rounded-full blur-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"></div>
                        <Zap className="w-7 h-7 text-[var(--cyan)] mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--cyan)] transition-colors">Swap Protocol</h3>
                        <p className="text-sm text-[var(--text-muted)]">Execute Jupiter swaps and earn XP</p>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/missions"
                        className="group relative p-6 rounded-xl bg-[var(--void-card)] border border-[var(--border)] hover:border-[var(--magenta)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,45,120,0.08)] overflow-hidden animate-slide-up"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--magenta)] rounded-full blur-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"></div>
                        <Target className="w-7 h-7 text-[var(--magenta)] mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--magenta)] transition-colors">Active Missions</h3>
                        <p className="text-sm text-[var(--text-muted)]">View and track your quests</p>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>

                    <Link
                        href="/badges"
                        className="group relative p-6 rounded-xl bg-[var(--void-card)] border border-[var(--border)] hover:border-[var(--gold)]/30 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,200,68,0.08)] overflow-hidden animate-slide-up"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--gold)] rounded-full blur-[60px] opacity-[0.04] group-hover:opacity-[0.08] transition-opacity"></div>
                        <Trophy className="w-7 h-7 text-[var(--gold)] mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--gold)] transition-colors">Badge Collection</h3>
                        <p className="text-sm text-[var(--text-muted)]">Metaplex Core NFT achievements</p>
                        <ChevronRight className="absolute bottom-6 right-6 w-5 h-5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                </section>

                {/* ═════════════════════════════════════
                    ACTIVE MISSIONS GRID
                    ═════════════════════════════════════ */}
                <section className="mb-14">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white">
                                Active <span className="text-gradient-cyan">Missions</span>
                            </h2>
                            <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">// querying on-chain mission data</p>
                        </div>
                        <Link
                            href="/missions"
                            className="flex items-center gap-1 text-sm text-[var(--cyan)] hover:text-white transition-colors font-semibold"
                        >
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-44 rounded-xl bg-[var(--void-card)] border border-[var(--border)] animate-pulse"
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
                        <div className="text-center py-16 rounded-xl border border-[var(--border)] bg-[var(--void-card)]">
                            <Target className="w-10 h-10 text-[var(--cyan)] mx-auto mb-4 opacity-40" />
                            <p className="text-[var(--text-muted)] text-sm">No active missions available.</p>
                            <p className="text-[var(--text-muted)] text-xs mt-1">Check back later or create missions in the admin panel.</p>
                        </div>
                    )}
                </section>

                {/* ═════════════════════════════════════
                    CONNECT CTA (if not connected)
                    ═════════════════════════════════════ */}
                {!walletAddress && (
                    <section className="max-w-2xl mx-auto mt-8 mb-16 text-center animate-fade-in">
                        <div className="relative p-8 md:p-12 rounded-2xl bg-gradient-to-b from-[var(--void-card)] to-[var(--void)] border border-[var(--border)] overflow-hidden group">
                            {/* Background glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[var(--cyan)] rounded-full blur-[120px] opacity-[0.06] group-hover:opacity-[0.1] transition-opacity pointer-events-none"></div>

                            <div className="relative z-10">
                                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--cyan)] to-[var(--magenta)] p-[2px] shadow-lg group-hover:shadow-[var(--glow-cyan)] transition-shadow">
                                    <div className="w-full h-full bg-[var(--void)] rounded-2xl flex items-center justify-center">
                                        <Gamepad2 className="w-7 h-7 text-[var(--cyan)]" />
                                    </div>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-black mb-3 text-white">
                                    Ready to <span className="text-gradient-cyan">Play</span>?
                                </h3>

                                <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto text-sm leading-relaxed">
                                    Connect your Solana wallet to start earning XP, unlocking NFT badges, and climbing the leaderboard.
                                </p>

                                <button
                                    onClick={connect}
                                    disabled={connecting}
                                    className="group/btn relative w-full max-w-sm mx-auto py-3.5 rounded-xl bg-gradient-to-r from-[var(--cyan)] via-[#00d4e0] to-[var(--magenta)] text-white font-['Orbitron'] font-bold text-sm tracking-widest uppercase overflow-hidden transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] disabled:opacity-50"
                                >
                                    <div className="absolute inset-0 bg-white/15 group-hover/btn:translate-x-full transition-transform duration-700 -skew-x-12 -ml-8" />
                                    <span className="relative flex items-center justify-center gap-2">
                                        {connecting ? 'Connecting...' : 'Connect Wallet'}
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
