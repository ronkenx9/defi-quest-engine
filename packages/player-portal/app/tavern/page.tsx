'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { User, ShieldAlert, Cpu, Lock, Unlock, Wine, MessageSquare, Skull, Info } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { hasBadge } from '@/lib/badgeStorage';

export default function TavernPage() {
    const { walletAddress, connect, connecting } = useWallet();

    // Check if user has the Red Pill badge (earned on onboarding)
    const hasClearance = useMemo(() => {
        if (!walletAddress) return false;
        return hasBadge(walletAddress, 'red_pill');
    }, [walletAddress]);

    if (!walletAddress) {
        return (
            <div className="min-h-screen bg-[#050507]">
                <PlayerNavbar />
                <main className="flex items-center justify-center min-h-[80vh]">
                    <div className="p-8 max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0"></div>
                        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-widest font-display">THE TAVERN</h1>
                        <p className="text-gray-400 mb-8 text-sm">
                            This sector is strictly off-limits to unauthenticated drifters. Establish a secure link to proceed.
                        </p>
                        <button
                            onClick={connect}
                            disabled={connecting}
                            className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-bold tracking-widest transition-all cursor-pointer"
                        >
                            {connecting ? 'INITIALIZING PROTOCOL...' : 'CONNECT WALLET'}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!hasClearance) {
        return (
            <div className="min-h-screen bg-[#050507] overflow-hidden">
                <PlayerNavbar />


                <main className="max-w-4xl mx-auto px-4 py-20 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                        <div className="w-full md:w-1/2 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-widest">
                                <Lock className="w-3 h-3" /> RESTRICTED ACCESS
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight leading-tight">
                                YOU SHALL <br />
                                <span className="text-red-500">NOT PASS</span>
                            </h1>

                            <div className="p-4 rounded-xl bg-black/40 border border-red-500/10 space-y-2">
                                <div className="text-xs text-gray-500 uppercase tracking-widest font-mono">Blockchain Scan Results</div>
                                <div className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                                    <span className="text-gray-400">Target Protocol</span>
                                    <span className="text-blue-400 font-mono">Metaplex Core Program</span>
                                </div>
                                <div className="flex items-center justify-between text-sm border-b border-white/5 py-2">
                                    <span className="text-gray-400">Required Asset</span>
                                    <span className="text-white font-bold">The Red Pill Badge</span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-2">
                                    <span className="text-gray-400">Plugin Attribute Check</span>
                                    <span className="text-red-400 font-bold px-2 py-0.5 bg-red-500/10 rounded">Status: Onboarding Complete</span>
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-red-500/30 pl-4 italic">
                                "The bouncer at the door doesn't care about your wallet balance. He scans your Core NFT plugins. No badge? No drinks."
                            </p>

                            <Link href="/suit-up" className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest transition-colors border border-white/10">
                                <Cpu className="w-4 h-4" /> Complete Onboarding to Earn Badge
                            </Link>
                        </div>

                        <div className="w-full md:w-1/2 flex justify-center">
                            <div className="relative">
                                {/* Stylized Bouncer */}
                                <div className="w-64 h-80 bg-gradient-to-b from-[#1a1a1a] to-black rounded-t-full border-t-2 border-x-2 border-red-500/20 flex flex-col items-center justify-start pt-12 relative overflow-hidden shadow-[0_-20px_50px_rgba(239,68,68,0.1)]">
                                    <div className="w-full h-1 bg-red-500/50 shadow-[0_0_20px_#ef4444] absolute top-24 animate-pulse"></div>
                                    <Skull className="w-24 h-24 text-red-500/50 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                    <div className="text-red-500 font-mono text-center tracking-widest">
                                        <div className="text-xs opacity-50 mb-1">SCANNING...</div>
                                        <div className="font-bold text-lg animate-pulse">ACCESS DENIED</div>
                                    </div>

                                    {/* Laser scan lines */}
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LCAwLCAwLCAwLjEpIi8+PC9zdmc+')] mix-blend-overlay opacity-30"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507]">
            <PlayerNavbar />



            <main className="max-w-6xl mx-auto px-4 py-8 relative">
                {/* Smoky Background */}
                <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-purple-900/10 via-blue-900/5 to-transparent blur-[100px] pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 relative z-10 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                            <Wine className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-widest font-display mb-1 flex items-center gap-2">
                                THE TAVERN <Unlock className="w-5 h-5 text-[#4ade80]" />
                            </h1>
                            <p className="text-[#4ade80] text-sm font-mono tracking-widest">METAPLEX CORE ATTRIBUTE DETECTED: [RANK: SPECIALIST]</p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <span className="text-xs text-gray-500 uppercase tracking-widest">Connected as</span>
                        <div className="px-4 py-2 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/20 text-[#4ade80] font-mono text-sm shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                            {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                    <div className="col-span-2 space-y-6">
                        {/* Elite Chat Terminal */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden backdrop-blur-md">
                            <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10">
                                <h3 className="text-sm font-bold text-white tracking-[0.2em] flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-blue-400" />
                                    ELITE OPERATOR COMMS
                                </h3>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                                </div>
                            </div>

                            <div className="h-[400px] p-6 space-y-6 overflow-y-auto no-scrollbar font-mono text-sm">
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded shrink-0 bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">N</div>
                                    <div>
                                        <div className="text-gray-500 text-xs mb-1">Neo_01 • 14:02 UTC</div>
                                        <div className="text-gray-300">Just forged the Void Crown. The protocol royalties are savage but worth it.</div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded shrink-0 bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">M</div>
                                    <div>
                                        <div className="text-gray-500 text-xs mb-1">Morpheus • 14:05 UTC</div>
                                        <div className="text-gray-300">Wait until you see what the new Jupiter Triggers do. Limit orders executed on-chain.</div>
                                    </div>
                                </div>

                                <div className="flex gap-4 flex-row-reverse text-right">
                                    <div className="w-8 h-8 rounded shrink-0 bg-[#4ade80]/20 text-[#4ade80] flex items-center justify-center font-bold">U</div>
                                    <div>
                                        <div className="text-gray-500 text-xs mb-1">You • 14:08 UTC</div>
                                        <div className="text-[#4ade80]">{'> '} Just gained access. The Metaplex Core gatekeeper works flawlessly.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-white/5 border-t border-white/10 relative">
                                <input
                                    type="text"
                                    placeholder="Execute comms protocol..."
                                    className="w-full bg-black/50 border border-white/10 rounded-lg py-3 px-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
                                />
                                <button className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-400 uppercase tracking-widest text-xs font-bold hover:text-white transition-colors">Submit</button>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-1 space-y-6">
                        {/* Status Card */}
                        <div className="p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-transparent">
                            <h3 className="text-sm font-bold text-white tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-purple-500/20 pb-4">
                                <User className="w-4 h-4 text-purple-400" />
                                DOSSIER
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                    <span className="text-gray-500">Security Clearance</span>
                                    <span className="text-[#4ade80] font-bold">Lvl 4: Specialist</span>
                                </div>
                                <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                    <span className="text-gray-500">Last Upload</span>
                                    <span className="text-gray-300">2 mins ago</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Tavern Credits</span>
                                    <span className="text-yellow-500 font-bold font-mono">2,450 </span>
                                </div>
                            </div>

                            <button className="w-full mt-6 py-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold tracking-widest hover:bg-purple-500/20 transition-all uppercase">
                                Purchase Neural Drink
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
