'use client';

import { useState, useEffect } from 'react';
import {
    Eye,
    Clock,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    ShieldAlert,
    Cpu,
    Terminal as TerminalIcon,
    DollarSign,
    BarChart3,
    Activity,
    Zap,
    Lock,
    Binary,
    ChevronRight,
    Search
} from 'lucide-react';
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
    type?: string;
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
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const lines = [
            '> CONNECTING TO ORACLE CLUSTERS...',
            '> AUTHENTICATING AGENT ACCESS...',
            '> DECRYPTING POLYMARKET FEED...',
            '> REALITY PROJECTION STABILIZED.'
        ];

        let i = 0;
        const interval = setInterval(() => {
            if (i < lines.length) {
                setTerminalLines(prev => [...prev, lines[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 500);

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

            // Fetch Polymarket Markets
            let polyMarkets: Prophecy[] = [];
            try {
                const polyRes = await fetch('/api/prophecy/markets');
                if (polyRes.ok) {
                    const polyData = await polyRes.json();
                    if (Array.isArray(polyData)) {
                        polyMarkets = polyData.map(market => ({
                            id: `poly_${market.id}`,
                            title: market.question,
                            description: `Volume: $${(market.volume / 1000).toFixed(1)}K • Ends: ${new Date(market.end_date).toLocaleDateString()}`,
                            condition_type: 'polymarket_market',
                            condition_value: {
                                event_id: market.event_id,
                                yes_probability: market.yes_probability,
                                no_probability: market.no_probability,
                                volume: market.volume
                            },
                            deadline: market.end_date ? new Date(market.end_date).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                            min_stake: 50,
                            max_stake: 5000,
                            win_multiplier: 2.0,
                            status: 'active',
                            type: 'polymarket'
                        }));
                    }
                }
            } catch (err) {
                console.error("Failed to load Polymarket markets:", err);
            }

            setProphecies([...(prophecyData || []), ...formattedMissions, ...polyMarkets]);

            // Fetch user entries
            const { data: entryData } = await supabase
                .from('prophecy_entries')
                .select('market_id, prediction, staked_xp, potential_win, result')
                .eq('wallet_address', walletAddress);

            if (entryData) {
                setEntries(entryData.map(e => ({
                    ...e,
                    prophecy_id: e.market_id.startsWith('poly_') ? e.market_id : 'poly_' + e.market_id
                })));
            }

            setLoading(false);
        }

        fetchData();
    }, [walletAddress]);

    const getTimeRemaining = (deadline: string) => {
        const diff = new Date(deadline).getTime() - Date.now();
        if (diff <= 0) return 'EXPIRED';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days > 0 ? `${days}D ${hours}H` : `${hours}H REMAINING`;
    };

    const handleStake = async (prophecyId: string) => {
        if (!walletAddress) {
            alert("Please connect your wallet first.");
            return;
        }
        const stake = stakeAmount[prophecyId] || 0;
        const pred = prediction[prophecyId] ?? true;

        if (stake <= 0) {
            alert("Please enter a valid stake amount.");
            return;
        }

        try {
            const response = await fetch('/api/prophecy/stake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    prophecyId: prophecyId.replace('poly_', ''),
                    prediction: pred,
                    stakeXP: stake,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                const prophecy = prophecies.find(p => p.id === prophecyId);
                setEntries(prev => [...prev, {
                    prophecy_id: prophecyId,
                    prediction: pred,
                    staked_xp: stake,
                    potential_win: Math.floor(stake * (prophecy?.win_multiplier || 2)),
                    result: 'pending',
                }]);
                setStakeAmount(prev => ({ ...prev, [prophecyId]: 0 }));
                alert("Prediction initiated successfully!");
            } else {
                // Handle specific error messages from the API
                if (result.code === '23505') {
                    alert("You have already placed a prediction on this market.");
                } else {
                    alert(`Stake failed: ${result.error || result.details || 'Unknown error'}`);
                }
            }
        } catch (err: any) {
            console.error('Stake failed:', err);
            alert(`Stake failed: ${err.message}`);
        }
    };

    const filteredProphecies = prophecies.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filter === 'all' || p.type === filter;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-[#050507] text-[#4ade80] font-mono selection:bg-[#4ade80]/30 selection:text-white pb-20">
            <PlayerNavbar />

            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 overflow-hidden">
                <div className="absolute inset-0 grid-bg" />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-4 pt-12">
                {/* Oracle Dashboard Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                className="p-2 bg-[#4ade80]/10 rounded-lg border border-[#4ade80]/30 shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                            >
                                <Cpu className="w-5 h-5 text-[#4ade80]" />
                            </motion.div>
                            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic glitch-text" data-text="ORACLE_FEED">ORACLE_FEED</h1>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.3em] font-bold">
                            {terminalLines.map((line, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 0.6, x: 0 }}
                                    key={i}
                                    className="flex items-center gap-2"
                                >
                                    <span className="w-1 h-3 bg-[#4ade80]/30" />
                                    {line}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#4ade80] transition-colors" />
                            <input
                                type="text"
                                placeholder="Search Prophecies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-black/60 border border-white/10 rounded-full text-xs focus:border-[#4ade80] outline-none transition-all w-full md:w-64"
                            />
                        </div>
                        <div className="flex bg-black/60 border border-white/10 rounded-full p-1">
                            {['all', 'polymarket', 'mission'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${filter === t ? 'bg-[#4ade80] text-[#050507]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {!walletAddress ? (
                    <div className="max-w-md mx-auto py-24 text-center">
                        <div className="w-20 h-20 bg-[#f87171]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#f87171]/20">
                            <Lock className="w-8 h-8 text-[#f87171]" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3 tracking-tight uppercase">ENCRYPTED_ACCESS</h2>
                        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                            The Oracle's foresight is reserved for authenticated operators. Link your biometric signature to decrypt the probability nexus.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-80 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence mode="popLayout">
                            {filteredProphecies.map((prophecy, index) => (
                                <ProphecyCard
                                    key={prophecy.id}
                                    prophecy={prophecy}
                                    index={index}
                                    entry={entries.find(e => e.prophecy_id === prophecy.id)}
                                    stakeValue={stakeAmount[prophecy.id] || 0}
                                    setStakeValue={(val: number) => setStakeAmount(prev => ({ ...prev, [prophecy.id]: val }))}
                                    prediction={prediction[prophecy.id]}
                                    setPrediction={(val: boolean) => setPrediction(prev => ({ ...prev, [prophecy.id]: val }))}
                                    onStake={() => handleStake(prophecy.id)}
                                    timeRemaining={getTimeRemaining(prophecy.deadline)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}

function ProphecyCard({
    prophecy,
    index,
    entry,
    stakeValue,
    setStakeValue,
    prediction,
    setPrediction,
    onStake,
    timeRemaining
}: any) {
    const isPolymarket = prophecy.type === 'polymarket';
    const yesProb = isPolymarket ? Math.round((prophecy.condition_value?.yes_probability || 0.5) * 100) : 50;
    const noProb = 100 - yesProb;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            className="group"
        >
            <div className="relative h-full flex flex-col glass-card p-0 overflow-hidden rounded-3xl border-white/10 hover:border-[#4ade80]/40 transition-all duration-500">
                {/* Card Header Tapestry */}
                <div className={`h-2 border-b border-white/10 ${isPolymarket ? 'bg-gradient-to-r from-blue-500 via-[#4ade80] to-purple-500' : 'bg-[#4ade80]/20'}`} />

                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${isPolymarket ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-[#4ade80]/50 bg-[#4ade80]/10 text-[#4ade80]'}`}>
                            {isPolymarket ? 'POLYMARKET_LINK' : 'OVERSEER_MISSION'}
                        </span>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase">{timeRemaining}</span>
                        </div>
                    </div>

                    <h3 className="text-lg font-black leading-tight text-white mb-3 group-hover:text-gradient transition-all duration-300 line-clamp-2">
                        {prophecy.title}
                    </h3>

                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed mb-6 line-clamp-2">
                        {prophecy.description}
                    </p>

                    {/* Odds / Probability Visualization */}
                    <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-[8px] text-gray-600 font-black uppercase mb-1">Probability_Yes</span>
                                <span className="text-xl font-black text-[#4ade80]">{yesProb}%</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[8px] text-gray-600 font-black uppercase mb-1">Multiplier</span>
                                <span className="text-xl font-black text-white">{prophecy.win_multiplier}x</span>
                            </div>
                        </div>

                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${yesProb}%` }}
                                className="h-full bg-gradient-to-r from-[#4ade80] to-emerald-600"
                            />
                            <div className="h-full bg-white/5" style={{ width: `${noProb}%` }} />
                        </div>
                    </div>

                    {entry ? (
                        <div className="mt-auto p-4 rounded-2xl bg-[#4ade80]/5 border border-[#4ade80]/20 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase">Your_Position</span>
                                <span className={`text-xs font-black ${entry.prediction ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                                    {entry.prediction ? 'YES' : 'NO'} | {entry.staked_xp} XP
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold">
                                <span className="text-gray-500 uppercase">Potential_Win</span>
                                <span className="text-white">{entry.potential_win} XP</span>
                            </div>
                            <div className="mt-2 text-center py-1 rounded-full bg-black/40 text-[8px] font-black tracking-widest text-[#4ade80] border border-[#4ade80]/10">
                                WAITING_FOR_ORACLE...
                            </div>
                        </div>
                    ) : (
                        <div className="mt-auto space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPrediction(true)}
                                    className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${prediction === true ? 'bg-[#4ade80]/10 border-[#4ade80] text-[#4ade80]' : 'bg-black/40 border-white/5 text-gray-600 hover:border-white/20'}`}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-tighter mb-0.5">Predict_Yes</span>
                                    <span className="text-sm font-black">YES</span>
                                </button>
                                <button
                                    onClick={() => setPrediction(false)}
                                    className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center transition-all ${prediction === false ? 'bg-[#f87171]/10 border-[#f87171] text-[#f87171]' : 'bg-black/40 border-white/5 text-gray-600 hover:border-white/20'}`}
                                >
                                    <span className="text-[9px] font-black uppercase tracking-tighter mb-0.5">Predict_No</span>
                                    <span className="text-sm font-black">NO</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 grid grid-cols-3 gap-2">
                                        {[100, 500, 1000].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => setStakeValue(amt)}
                                                className={`py-1.5 rounded-lg border text-[9px] font-black transition-all ${stakeValue === amt ? 'bg-white text-black border-white' : 'bg-black/40 border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}
                                            >
                                                {amt}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative w-1/3">
                                        <input
                                            type="number"
                                            value={stakeValue || ''}
                                            onChange={(e) => setStakeValue(parseInt(e.target.value) || 0)}
                                            placeholder="QTY"
                                            className="w-full pl-3 pr-7 py-2 bg-black/60 border border-white/5 rounded-xl text-[10px] font-black outline-none focus:border-[#4ade80] transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] text-gray-600 font-black">XP</span>
                                    </div>
                                </div>

                                <button
                                    onClick={onStake}
                                    disabled={prediction === undefined || stakeValue <= 0}
                                    className="w-full py-3 bg-[#4ade80] text-[#050507] rounded-xl font-black text-xs tracking-widest uppercase hover:bg-white transition-all disabled:opacity-30 disabled:grayscale group-hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]"
                                >
                                    INITIATE_PROJECTION
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 p-1 opacity-10 pointer-events-none">
                    <Binary className="w-12 h-12 text-[#4ade80]" />
                </div>
            </div>
        </motion.div>
    );
}
