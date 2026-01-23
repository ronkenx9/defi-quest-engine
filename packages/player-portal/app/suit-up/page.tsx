'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Shield, Sword, Box, Award, ChevronRight, Zap, Trophy, Star } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';

export default function SuitUpPage() {
    const { walletAddress } = useWallet();
    const { userStats, loading } = usePlayer();
    const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'nfts'>('stats');

    if (!walletAddress) {
        return (
            <div className="min-h-screen">
                <PlayerNavbar />
                <main className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="p-8 rounded-2xl border border-[#4ade80]/20 bg-[#0a0f0a] border-dashed">
                        <User className="w-16 h-16 text-[#4ade80]/30 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-4 text-white">CONNECTION REQUIRED</h2>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            You must jack into the matrix to access your operator profile and equipment.
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-8 py-3 rounded-xl bg-[#4ade80] text-black font-bold hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all"
                        >
                            Back to Console
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507]">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    {/* Avatar Frame */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-[#0a0f0a] border-2 border-[#4ade80]/50 flex items-center justify-center overflow-hidden">
                            <User className="w-16 h-16 md:w-20 md:h-20 text-[#4ade80]" />
                            {/* Scanning Line Animation */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-[#4ade80] opacity-50 shadow-[0_0_10px_#4ade80] animate-scan"></div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#4ade80] text-black text-xs font-bold whitespace-nowrap">
                            LVL {userStats?.level || 1} OPERATOR
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </h1>
                        <p className="text-[#4ade80] font-mono text-sm mb-4 tracking-widest">
                            // IDENTITY_VERIFIED // ACCESS_GRANTED
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                <span className="text-gray-300">{userStats?.total_points.toLocaleString()} XP</span>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                                <Star className="w-4 h-4 text-purple-500" />
                                <span className="text-gray-300">Rank: #124</span>
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-[#4ade80]" />
                                <span className="text-gray-300">{userStats?.total_missions_completed} Missions</span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:block w-px h-24 bg-white/10 mx-8"></div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-center">
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Accessories</div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 text-center">
                            <div className="text-2xl font-bold text-white mb-1">0</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">NFT Badges</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'stats' ? 'text-[#4ade80]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        STATS
                        {activeTab === 'stats' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4ade80] shadow-[0_0_10px_#4ade80]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'inventory' ? 'text-[#4ade80]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        INVENTORY
                        {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4ade80] shadow-[0_0_10px_#4ade80]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('nfts')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'nfts' ? 'text-[#4ade80]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        COLLECTION
                        {activeTab === 'nfts' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4ade80] shadow-[0_0_10px_#4ade80]"></div>}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'stats' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">DEFENSE</h3>
                                        <Shield className="w-5 h-5 text-[#4ade80] opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">0 <span className="text-xs text-gray-500">INITIATED</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[10%] h-full bg-[#4ade80]"></div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">OFFENSE</h3>
                                        <Sword className="w-5 h-5 text-[#4ade80] opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">0 <span className="text-xs text-gray-500">INITIATED</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[15%] h-full bg-[#4ade80]"></div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">LUCK</h3>
                                        <Star className="w-5 h-5 text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">5 <span className="text-xs text-gray-400">BASE</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[5%] h-full bg-yellow-500"></div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">HACKING</h3>
                                        <Zap className="w-5 h-5 text-[#4ade80] opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">0 <span className="text-xs text-gray-500">INITIATED</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[12%] h-full bg-[#4ade80]"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'inventory' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-white/30 transition-all relative overflow-hidden">
                                        <Box className="w-8 h-8 text-white/20 group-hover:text-white/40 group-hover:scale-110 transition-all" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute bottom-2 left-2 text-[8px] font-bold text-gray-500 tracking-widest">SLOT_{i}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'nfts' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-12 rounded-2xl bg-white/5 border border-white/10 border-dashed flex flex-col items-center justify-center text-center">
                                    <Award className="w-12 h-12 text-gray-600 mb-4" />
                                    <h4 className="text-lg font-bold text-gray-400 mb-2">No NFT Badges Yet</h4>
                                    <p className="text-sm text-gray-600 max-w-xs">
                                        Complete special season missions or guild challenges to mint your achievement badges.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Equipment Area */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#4ade80]/10 to-transparent border border-[#4ade80]/20">
                            <h3 className="text-sm font-bold tracking-[0.2em] mb-6 text-white flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-[#4ade80]" />
                                ACTIVE EFFECTS
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-[#4ade80]/10">
                                    <div>
                                        <div className="text-xs font-bold text-[#4ade80] mb-1">STREAK_BONUS</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Passive Multiplier</div>
                                    </div>
                                    <div className="text-[#4ade80] font-bold">1.2x</div>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 animate-pulse">
                                    <div className="text-xs font-bold text-gray-500 mb-1">EMPTY_SLOT</div>
                                    <div className="text-[10px] text-gray-700 uppercase tracking-wider">No Augment Active</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-bold tracking-[0.2em] mb-4 text-white">UPCOMING REWARDS</h3>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#4ade80]/20 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-[#4ade80]" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-300">Level 10 Badge</div>
                                        <div className="text-[10px] text-[#4ade80] uppercase tracking-wider">Locked</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 4s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
