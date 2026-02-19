'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Dices, Trophy, Flame, History, AlertTriangle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { DoubleOrNothingModal } from '@/components/casino/DoubleOrNothingModal';
import { BadgeForgeComponent as BadgeForge } from '@/components/casino/BadgeForge';
import { BadgeRouletteComponent as BadgeRoulette } from '@/components/casino/BadgeRoulette';
import { BadgeGrid } from '@/components/casino/BadgeCard';

export default function CasinoPage() {
    const { publicKey } = useWallet();
    const [showDoubleOrNothing, setShowDoubleOrNothing] = useState(false);

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-8 relative overflow-hidden">
            {/* Matrix Background Effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(34, 197, 94, .3) 25%, rgba(34, 197, 94, .3) 26%, transparent 27%, transparent 74%, rgba(34, 197, 94, .3) 75%, rgba(34, 197, 94, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">
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
                            <div className="text-xs text-green-400/60 uppercase">Credits</div>
                            <div className="text-xl font-bold font-mono">24,500 <span className="text-xs">XP</span></div>
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Games */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Featured Game: Double or Nothing */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="group relative bg-black/40 border border-green-500/30 rounded-xl p-6 md:p-8 hover:border-green-400/60 transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-red-500/30 animate-pulse">
                                            HIGH RISK
                                        </Badge>
                                        <span className="text-xs text-green-500/60 font-mono">WIN RATE: 48.5%</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Double or Nothing</h2>
                                    <p className="text-green-400/60 max-w-md">
                                        Risk your hard-earned XP for a chance to double it instantly.
                                        Provably fair on-chain randomness.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setShowDoubleOrNothing(true)}
                                    className="px-8 py-4 bg-green-600 hover:bg-green-500 text-black font-bold text-lg rounded-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] transition-all transform hover:scale-105 flex items-center gap-3"
                                >
                                    <Dices className="w-6 h-6" />
                                    PLAY NOW
                                </button>
                            </div>
                        </motion.div>

                        {/* Secondary Game: Badge Roulette */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <BadgeRoulette />

                            {/* Coming Soon */}
                            <div className="bg-black/40 border border-green-900/30 rounded-xl p-6 flex flex-col items-center justify-center text-center opacity-60">
                                <AlertTriangle className="w-12 h-12 text-yellow-500/50 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">Prediction Market</h3>
                                <p className="text-sm text-green-400/40">
                                    Bet on token prices. Coming Soon.
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Forge & Stats */}
                    <div className="space-y-6">
                        <BadgeForge />

                        {/* Recent Winners Ticker */}
                        <div className="bg-black/40 border border-green-500/20 rounded-xl p-4">
                            <h3 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
                                <History className="w-4 h-4" /> RECENT WINS
                            </h3>
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between text-xs border-b border-green-900/30 pb-2 last:border-0 last:pb-0">
                                        <span className="text-green-300">User...{1000 + i}</span>
                                        <span className="text-yellow-400 flex items-center gap-1">
                                            +{(i * 2500).toLocaleString()} XP
                                            <Flame className="w-3 h-3 text-orange-500" />
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modals */}
            <DoubleOrNothingModal
                isOpen={showDoubleOrNothing}
                onClose={() => setShowDoubleOrNothing(false)}
                xpEarned={24500}
                walletAddress={publicKey?.toString() || 'Guest'}
                onComplete={(finalXP) => console.log('Game Complete:', finalXP)}
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
