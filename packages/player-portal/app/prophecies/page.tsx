'use client';

import { useState, useEffect } from 'react';
import { Eye, Clock, TrendingUp, TrendingDown, AlertCircle, ShieldAlert, Cpu, Terminal as TerminalIcon, DollarSign, BarChart3 } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [stakeAmount, setStakeAmount] = useState<Record<string, number>>({});
    const [prediction, setPrediction] = useState<Record<string, boolean>>({});
    const [terminalLines, setTerminalLines] = useState<string[]>([]);

    useEffect(() => {
        const lines = [
            '> INITIALIZING ORACLE LINK...',
            '> AUTHENTICATING OPERATOR...',
            '> DECRYPTING MARKET PROBABILITIES...',
            '> LOADING PROPHECIES FROM THE CONSTRUCT...'
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < lines.length) {
                setTerminalLines(prev => [...prev, lines[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 400);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        async function fetchData() {
            if (!walletAddress) {
                setLoading(false);
                return;
            }

            setLoading(true);

            // Fetch active feed prophecies
            const { data: prophecyData } = await supabase
                .from('prophecies')
                .select('*')
                .eq('status', 'active')
                .gt('deadline', new Date().toISOString());

            // Fetch active tier-2 prediction missions
            const { data: missionData } = await supabase
                .from('missions')
                .select('*')
                .eq('type', 'prediction')
                .eq('is_active', true);

            const formattedMissions = (missionData || []).map(mission => ({
                id: mission.id,
                title: mission.name,
                description: mission.description || 'Overseer Prediction Mission',
                condition_type: 'custom',
                condition_value: mission.requirement || {},
                deadline: mission.updated_at ? new Date(new Date(mission.updated_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                min_stake: 50,
                max_stake: 5000,
                win_multiplier: 1.5,
                status: 'active',
                type: 'mission'
            }));

            if (prophecyData || formattedMissions.length > 0) {
                setProphecies([...(prophecyData || []), ...formattedMissions]);
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
    }, [walletAddress]);

    const hasEntry = (prophecyId: string) => {
        return entries.some(e => e.prophecy_id === prophecyId);
    };

    const getEntry = (prophecyId: string) => {
        return entries.find(e => e.prophecy_id === prophecyId);
    };

    const getTimeRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        if (diff <= 0) return 'EXPIRED';
        const totalMinutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}H ${minutes}M`;
    };

    const handleStake = async (prophecyId: string) => {
        if (!walletAddress) return;

        const stake = stakeAmount[prophecyId] || 0;
        const pred = prediction[prophecyId] ?? true;

        if (stake <= 0) return;

        try {
            const response = await fetch('/api/prophecy/stake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    prophecyId,
                    prediction: pred,
                    stakeXP: stake,
                }),
            });

            if (response.ok) {
                const prophecy = prophecies.find(p => p.id === prophecyId);
                setEntries([...entries, {
                    prophecy_id: prophecyId,
                    prediction: pred,
                    staked_xp: stake,
                    potential_win: Math.floor(stake * (prophecy?.win_multiplier || 3)),
                    result: 'pending',
                }]);
                // Clear inputs
                setStakeAmount(prev => {
                    const next = { ...prev };
                    delete next[prophecyId];
                    return next;
                });
            }
        } catch (err) {
            console.error('Stake failed:', err);
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] text-[#4ade80] font-mono">
            <PlayerNavbar />

            <main className="max-w-4xl mx-auto px-4 py-12">
                {/* Oracle Terminal Header */}
                <div className="mb-12 border-l-2 border-[#4ade80] pl-6 py-2 bg-[#4ade80]/5 rounded-r-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-[#4ade80]/20 rounded-lg flex items-center justify-center border border-[#4ade80]/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                            <Eye className="w-6 h-6 text-[#4ade80]" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-white">THE ORACLE</h1>
                            <p className="text-[10px] uppercase tracking-[0.4em] opacity-60">Probabilistic Reality Processing</p>
                        </div>
                    </div>

                    <div className="space-y-1 text-xs opacity-80">
                        {terminalLines.map((line, i) => (
                            <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-300 fill-mode-both" style={{ animationDelay: `${i * 100}ms` }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </div>

                {!walletAddress ? (
                    <div className="text-center py-20 border border-dashed border-[#4ade80]/20 rounded-3xl">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-4 text-[#4ade80]/40" />
                        <h2 className="text-xl font-bold text-white mb-2">IDENTIFICATION REQUIRED</h2>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8">
                            Only authenticated operators can access the Oracle's prophecies.
                            The system cannot project probabilities for unknown entities.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="space-y-8">
                        {[1, 2].map(i => (
                            <div key={i} className="h-64 rounded-3xl bg-[#0a0f0a] border border-white/5 animate-pulse relative overflow-hidden">
                                <div className="absolute inset-x-0 top-0 h-1 bg-[#4ade80]/20" />
                            </div>
                        ))}
                    </div>
                ) : prophecies.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-[#4ade80]/20 rounded-3xl">
                        <TerminalIcon className="w-12 h-12 mx-auto mb-4 text-[#4ade80]/40" />
                        <h2 className="text-xl font-bold text-white mb-2">NO PROPHECIES DETECTED</h2>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto">
                            The market is currently stable. No ripples in the Construct detected.
                            Return when the timeline fractures.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <AnimatePresence mode="popLayout">
                            {prophecies.map((prophecy, index) => {
                                const entry = getEntry(prophecy.id);
                                const hasStaked = hasEntry(prophecy.id);
                                const isPriceProphecy = prophecy.condition_type === 'price_above' || prophecy.condition_type === 'price_below';

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={prophecy.id}
                                        className="relative group"
                                    >
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#4ade80]/50 to-purple-500/50 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
                                        <div className="relative p-8 rounded-3xl bg-[#0a0c10] border border-white/10 hover:border-[#4ade80]/30 transition-all">

                                            {/* Status Badge */}
                                            <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/20">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                                                <span className="text-[10px] font-bold tracking-widest text-[#4ade80]">ACTIVE</span>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-8">
                                                {/* Left: Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {isPriceProphecy ? <DollarSign className="w-4 h-4 text-[#4ade80]" /> : <BarChart3 className="w-4 h-4 text-[#4ade80]" />}
                                                        <h3 className="text-2xl font-black text-white italic lowercase tracking-tight">#{prophecy.title.replace(/\s+/g, '_')}</h3>
                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                                                        {prophecy.description}
                                                    </p>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                                            <p className="text-[10px] text-gray-500 uppercase mb-1">XP Multiplier</p>
                                                            <p className="text-xl font-black text-[#4ade80]">{prophecy.win_multiplier}x</p>
                                                        </div>
                                                        <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                                                            <p className="text-[10px] text-gray-500 uppercase mb-1">Time Horizon</p>
                                                            <p className="text-xl font-black text-white">{getTimeRemaining(prophecy.deadline)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right: Interaction */}
                                                <div className="w-full md:w-80">
                                                    {hasStaked && entry ? (
                                                        <div className="h-full flex flex-col justify-center p-6 rounded-2xl bg-[#4ade80]/5 border border-[#4ade80]/20">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-xs uppercase tracking-widest text-gray-400">Position</span>
                                                                <span className={`text-sm font-bold ${entry.prediction ? 'text-[#4ade80]' : 'text-red-400'}`}>
                                                                    {entry.prediction ? 'WILL_HAPPEN' : 'WILL_NOT_HAPPEN'}
                                                                </span>
                                                            </div>
                                                            <div className="space-y-2 mb-6 text-center">
                                                                <p className="text-[10px] text-gray-500 uppercase">Staked XP</p>
                                                                <p className="text-3xl font-black text-white">{entry.staked_xp}</p>
                                                            </div>
                                                            <div className="pt-4 border-t border-white/5 text-center">
                                                                <span className="text-[10px] font-bold py-1 px-3 rounded-full bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
                                                                    AWAITING RESOLUTION
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setPrediction({ ...prediction, [prophecy.id]: true })}
                                                                    className={`flex-1 py-4 rounded-xl border-2 font-black transition-all text-xs tracking-[0.2em] relative overflow-hidden group/btn ${prediction[prophecy.id] !== false
                                                                        ? 'bg-[#4ade80] border-[#4ade80] text-black shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                                                                        : 'border-white/10 text-gray-500 hover:border-[#4ade80]/40'
                                                                        }`}
                                                                >
                                                                    {prediction[prophecy.id] !== false && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                                                                    YES
                                                                </button>
                                                                <button
                                                                    onClick={() => setPrediction({ ...prediction, [prophecy.id]: false })}
                                                                    className={`flex-1 py-4 rounded-xl border-2 font-black transition-all text-xs tracking-[0.2em] relative overflow-hidden group/btn ${prediction[prophecy.id] === false
                                                                        ? 'bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                                                                        : 'border-white/10 text-gray-500 hover:border-red-500/40'
                                                                        }`}
                                                                >
                                                                    {prediction[prophecy.id] === false && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                                                                    NO
                                                                </button>
                                                            </div>

                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    min={prophecy.min_stake}
                                                                    max={prophecy.max_stake}
                                                                    value={stakeAmount[prophecy.id] || ''}
                                                                    onChange={(e) => setStakeAmount({
                                                                        ...stakeAmount,
                                                                        [prophecy.id]: parseInt(e.target.value) || 0
                                                                    })}
                                                                    placeholder={`${prophecy.min_stake}-${prophecy.max_stake} XP`}
                                                                    className="w-full px-6 py-4 rounded-xl bg-black/60 border border-white/10 text-white font-black focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80] outline-none transition-all placeholder:text-gray-700"
                                                                />
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">XP</div>
                                                            </div>

                                                            <button
                                                                onClick={() => handleStake(prophecy.id)}
                                                                disabled={!stakeAmount[prophecy.id] || stakeAmount[prophecy.id] < prophecy.min_stake}
                                                                className="w-full py-4 rounded-xl bg-white text-black font-black text-sm tracking-widest hover:bg-[#4ade80] hover:text-black transition-all disabled:opacity-20 disabled:grayscale cursor-pointer"
                                                            >
                                                                INITIATE_STAKE
                                                            </button>

                                                            <div className="flex items-center justify-center gap-4 text-[9px] text-gray-600 font-bold tracking-widest px-2">
                                                                <div className="flex items-center gap-1"><Cpu className="w-3 h-3" /> VERIFIED_ORACLE</div>
                                                                <div className="flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> HIGH_RISK</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
