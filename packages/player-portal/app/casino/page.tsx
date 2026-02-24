'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Dices, Trophy, Flame, History, AlertTriangle } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { DoubleOrNothingModal } from '@/components/casino/DoubleOrNothingModal';
import { BadgeForgeComponent as BadgeForge } from '@/components/casino/BadgeForge';
import { BadgeRouletteComponent as BadgeRoulette } from '@/components/casino/BadgeRoulette';
import { BadgeGrid } from '@/components/casino/BadgeCard';
import PlayerNavbar from '@/components/player/PlayerNavbar';

export default function CasinoPage() {
    const { walletAddress } = useWallet();
    const { userStats } = usePlayer();
    const [showDoubleOrNothing, setShowDoubleOrNothing] = useState(false);

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono relative overflow-hidden">
            <PlayerNavbar />

            {/* Matrix Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}>
            </div>

            <div className="max-w-[1600px] mx-auto relative z-10 space-y-8 p-4 md:p-8 xl:p-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-green-900/50 pb-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 animate-pulse">
                            THE CASINO
                        </h1>
                        <p className="text-green-400/60 mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                            HIGH STAKES GAMIFICATION PROTOCOL
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
                            <div className="text-xl font-bold font-mono">
                                {userStats?.total_points?.toLocaleString() || '0'} <span className="text-xs">XP</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Casino Grid: Top Section (Games) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 mb-16">

                    {/* Left Panel: Badge Roulette */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass-card border border-green-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden group min-h-[500px] flex flex-col"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 font-bold tracking-widest text-[10px] text-green-500 font-mono">GAME_01</div>
                        <h2 className="text-2xl font-bold tracking-[0.2em] mb-8 text-white drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] uppercase">
                            Badge Roulette
                        </h2>
                        <div className="flex-1 flex items-center justify-center">
                            <BadgeRoulette />
                        </div>
                    </motion.div>

                    {/* Right Panel: Double or Nothing & Activity */}
                    <div className="space-y-8 xl:space-y-12 flex flex-col">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-card border border-green-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden group flex-1"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-50 font-bold tracking-widest text-[10px] text-green-500 font-mono">GAME_02</div>
                            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                            <div className="relative z-10 h-full flex flex-col">
                                <h2 className="text-2xl font-bold tracking-[0.2em] mb-4 text-white drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] uppercase">
                                    Double or Nothing
                                </h2>

                                <div className="flex items-center gap-3 mb-6">
                                    <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-red-500/30 animate-pulse">
                                        HIGH RISK
                                    </Badge>
                                    <span className="text-xs text-green-500/60 font-mono">WIN RATE: 48.5%</span>
                                </div>

                                <p className="text-green-400/60 max-w-md mb-auto text-sm md:text-base leading-relaxed">
                                    Risk your hard-earned XP for a chance to double it instantly.
                                    Provably fair on-chain randomness executes the contract.
                                </p>

                                <div className="mt-8 flex justify-center lg:justify-start">
                                    <button
                                        onClick={() => setShowDoubleOrNothing(true)}
                                        className="w-full md:w-auto px-12 py-5 bg-green-600 hover:bg-green-500 text-black font-black tracking-widest text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105 flex items-center justify-center gap-3 font-mono rounded-lg"
                                    >
                                        <Dices className="w-6 h-6" />
                                        PLAY NOW
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* Recent Winners Ticker */}
                        <div className="bg-black/60 border border-green-500/20 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2 tracking-widest">
                                <History className="w-4 h-4" /> LIVE ACTIVITY LOG
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between text-sm border-b border-green-900/30 pb-3 last:border-0 last:pb-0">
                                        <span className="text-green-300 font-mono">0x...{1000 + i}</span>
                                        <span className="text-yellow-400 font-bold flex items-center gap-2">
                                            +{(i * 2500).toLocaleString()} XP
                                            <Flame className="w-4 h-4 text-orange-500" />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Full Width Forge scroll view */}
                <div className="w-full relative z-0 mt-8 mb-20">
                    <div className="absolute -top-12 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent opacity-50" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="w-full bg-black/80 border border-green-900/50 rounded-2xl p-6 md:p-8 xl:p-12 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md"
                    >
                        <h2 className="text-3xl md:text-4xl font-black tracking-[0.3em] mb-12 text-center text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] uppercase">
                            THE FORGE
                        </h2>

                        <div className="max-w-7xl mx-auto">
                            <BadgeForge />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Modals */}
            <DoubleOrNothingModal
                isOpen={showDoubleOrNothing}
                onClose={() => setShowDoubleOrNothing(false)}
                initialWager={100}
                walletAddress={walletAddress || 'Guest'}
                onComplete={() => { }}
            />
        </div>
    );
}

function Badge({ children, className, variant }: any) {
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${className}`}>
            {children}
        </span>
    );
}
