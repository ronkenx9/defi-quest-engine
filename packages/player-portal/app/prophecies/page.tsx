'use client';

import { useState, useEffect } from 'react';
import { Eye, Clock, TrendingUp, TrendingDown, AlertCircle, ShieldAlert, Cpu, Terminal as TerminalIcon, DollarSign, BarChart3 } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { MatrixSounds } from '@/lib/sounds';
import OracleFeedCard from '@/components/player/OracleFeedCard';

interface Prophecy {
    id: string;
    title: string;
    description: string;
    condition_type: string;
    condition_value: any;
    deadline: string;
    min_stake: number;
    max_stake: number;
    win_multiplier: number;
    status: string;
    type: string;
    total_yes_pool: number;
    total_no_pool: number;
}

interface ProphecyEntry {
    prophecy_id: string;
    prediction: boolean;
    staked_xp: number;
    potential_win: number;
    result: string;
}

export default function PropheciesPage() {
    const { walletAddress } = useWallet();
    const [prophecies, setProphecies] = useState<Prophecy[]>([]);
    const [entries, setEntries] = useState<ProphecyEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    useEffect(() => {
        const lines = [
            'SYS> INITIALIZING ORACLE NEURAL LINK...',
            'SYS> AUTHENTICATING OPERATOR SIGNATURE...',
            'SYS> DECRYPTING PROBABILITY TENSORS...',
            'SYS> SYNCING WITH THE CONSTRUCT...'
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < lines.length) {
                setTerminalLines(prev => [...prev, lines[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function fetchData() {
            if (!walletAddress) {
                setLoading(false);
                return;
            }

            setLoading(true);

            // Fetch active 'feed' prophecies
            const { data: prophecyData } = await supabase
                .from('prophecies')
                .select('*')
                .eq('type', 'feed')
                .order('deadline', { ascending: true });

            if (prophecyData) {
                setProphecies(prophecyData);
            }

            // Fetch user entries
            const { data: entryData } = await supabase
                .from('prophecy_entries')
                .select('prophecy_id, prediction, staked_xp, potential_win, result')
                .eq('wallet_address', walletAddress);

            if (entryData) {
                setEntries(entryData);
            }

            setLoading(false);
        }

        fetchData();

        // Setup realtime subscription for odds updating
        const channel = supabase.channel('prophecies_feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prophecies', filter: `type=eq.feed` }, (payload) => {
                fetchData(); // Simplest sync for now, refetch all
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prophecy_entries', filter: `wallet_address=eq.${walletAddress}` }, (payload) => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [walletAddress]);

    const handleStake = async (prophecyId: string, prediction: boolean, amount: number) => {
        if (!walletAddress) return;

        try {
            const response = await fetch('/api/prophecy/stake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    prophecyId,
                    prediction,
                    stakeXP: amount,
                }),
            });

            if (response.ok) {
                // Optimistic UI update handled by realtime subscription
            }
        } catch (err) {
            console.error('Stake failed:', err);
        }
    };

    // UI Helpers logic
    const getEntry = (prophecyId: string) => entries.find(e => e.prophecy_id === prophecyId);

    // Sort active vs upcoming
    const now = new Date().getTime();

    // A prophecy is "live" if it is the closest active prophecy to expire.
    // Prophecies are sorted ascending by deadline.
    // Let's categorize them.
    const getCardType = (p: Prophecy): 'live' | 'next' | 'locked' | 'resolved' => {
        const deadline = new Date(p.deadline).getTime();
        if (p.status === 'resolved_win' || p.status === 'resolved_lose') return 'resolved';

        // If deadline has passed but not resolved, it's locked
        if (deadline < now) return 'locked';

        // The first active prophecy with deadline > now is 'live'
        const activeUpcoming = prophecies.filter(x => new Date(x.deadline).getTime() > now && x.status === 'active');
        if (activeUpcoming.length > 0 && activeUpcoming[0].id === p.id) return 'live';

        return 'next';
    };

    return (
        <div className="min-h-screen bg-[#020502] text-[#4ade80] font-mono overflow-x-hidden relative selection:bg-[#4ade80]/30 selection:text-[#4ade80]">
            {/* Global CRT Overlay */}
            <div className="fixed inset-0 pointer-events-none z-50 mix-blend-overlay opacity-30 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>

            <PlayerNavbar />

            <main className="max-w-[1400px] mx-auto px-4 py-8 relative z-10 w-full overflow-hidden">
                {/* Oracle Terminal Header */}
                <div className="mb-12 relative max-w-5xl mx-auto">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#4ade80]/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#4ade80]/50 to-transparent" />

                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 py-8 px-6 bg-gradient-to-r from-[#4ade80]/5 via-transparent to-transparent">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-[#4ade80]/20 blur-xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                                <div className="w-16 h-16 bg-black border-2 border-[#4ade80]/40 rounded-xl flex items-center justify-center transform rotate-45 relative z-10 overflow-hidden">
                                    <div className="absolute inset-0 bg-[#4ade80]/10 animate-pulse" />
                                    <Eye className="w-8 h-8 text-[#4ade80] -rotate-45" style={{ filter: 'drop-shadow(0 0 10px #4ade80)' }} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase mb-2" style={{ textShadow: '0 0 20px rgba(74,222,128,0.5), -2px 0 red, 2px 0 cyan' }}>
                                    THE ORACLE_FEED
                                </h1>
                                <div className="flex items-center gap-3 text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] opacity-80">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                                    <span>Probabilistic Reality Processing</span>
                                </div>
                            </div>
                        </div>

                        {/* Terminal Readout */}
                        <div className="w-full md:w-96 h-28 bg-black/80 border border-[#4ade80]/20 rounded-lg p-4 overflow-hidden relative" style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}>
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#4ade80]/50" />
                            <div className="space-y-1.5 text-[10px] tracking-widest text-[#4ade80]/80 h-full flex flex-col justify-end font-mono">
                                {terminalLines.map((line, i) => (
                                    <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {!walletAddress ? (
                    <div className="relative text-center py-20 border border-dashed border-red-500/30 bg-red-500/5 rounded-3xl max-w-2xl mx-auto overflow-hidden">
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)]" />
                        <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-red-500/80 animate-pulse relative z-10" style={{ filter: 'drop-shadow(0 0 15px rgba(239,68,68,0.5))' }} />
                        <h2 className="text-2xl font-black text-white mb-2 tracking-[0.2em] relative z-10">IDENTIFICATION_REQUIRED</h2>
                        <p className="text-xs text-red-400/80 max-w-md mx-auto mb-8 uppercase tracking-widest leading-loose relative z-10">
                            Unauthorized entity detected. Oracle access denied. Engage neural link to proceed.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="flex gap-8 justify-center overflow-x-hidden py-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="w-[360px] h-[480px] flex-shrink-0 bg-[#0a0f0a] border border-[#4ade80]/10 relative overflow-hidden" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
                                <div className="absolute inset-x-0 top-0 h-1 bg-[#4ade80]/20 animate-pulse" />
                                <div className="w-full h-full bg-gradient-to-b from-[#4ade80]/5 to-transparent animate-pulse delay-75" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-1 bg-[#4ade80]/20 rounded animate-spin" />
                            </div>
                        ))}
                    </div>
                ) : prophecies.length === 0 ? (
                    <div className="relative py-32 bg-black border border-[#4ade80]/20 overflow-hidden group max-w-3xl mx-auto text-center" style={{ clipPath: 'polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)' }}>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                        <Eye className="w-20 h-20 text-[#4ade80]/30 animate-pulse mx-auto mb-6 relative z-10" />
                        <h2 className="text-3xl font-black text-white tracking-[0.3em] mb-4 relative z-10" style={{ textShadow: '0 0 20px rgba(74,222,128,0.3)' }}>SCANNING_TIMELINES</h2>
                        <p className="text-sm text-[#4ade80]/60 max-w-sm mx-auto uppercase tracking-widest relative z-10">
                            The current probability density is zero. Awaiting new event horizons.
                        </p>
                    </div>
                ) : (
                    <div className="w-full relative py-12 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {/* Feed Container */}
                        <div className="flex gap-8 overflow-x-auto pb-16 snap-x snap-mandatory hide-scrollbar justify-start lg:justify-center items-center">
                            {prophecies.map((prophecy) => {
                                const type = getCardType(prophecy);
                                if (type === 'resolved') return null; // Hide resolved from main horizontal feed to keep it clean, can move to history later

                                return (
                                    <div key={prophecy.id} className="snap-center transform transition-transform duration-500 hover:scale-[1.02]">
                                        <OracleFeedCard
                                            prophecy={prophecy}
                                            entry={getEntry(prophecy.id)}
                                            onStake={handleStake}
                                            type={type}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Dramatic Fades for infinite scroll illusion */}
                        <div className="absolute top-0 bottom-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#020502] to-transparent pointer-events-none z-20" />
                        <div className="absolute top-0 bottom-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#020502] to-transparent pointer-events-none z-20" />
                    </div>
                )}
            </main>
        </div>
    );
}
