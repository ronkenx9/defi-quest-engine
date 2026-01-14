'use client';

import { useState, useEffect } from 'react';
import { Eye, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface Prophecy {
    id: string;
    title: string;
    description: string;
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

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            // Fetch active prophecies
            const { data: prophecyData } = await supabase
                .from('prophecies')
                .select('*')
                .eq('status', 'active')
                .gt('deadline', new Date().toISOString());

            if (prophecyData) {
                setProphecies(prophecyData);
            }

            // Fetch user entries
            if (walletAddress) {
                const { data: entryData } = await supabase
                    .from('prophecy_entries')
                    .select('prophecy_id, prediction, staked_xp, potential_win, result')
                    .eq('wallet_address', walletAddress);

                if (entryData) {
                    setEntries(entryData);
                }
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
        if (diff <= 0) return 'Expired';
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ${hours % 24}h`;
        return `${hours}h`;
    };

    const handleStake = async (prophecyId: string) => {
        if (!walletAddress) return;

        const stake = stakeAmount[prophecyId] || 0;
        const pred = prediction[prophecyId] ?? true;

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
            // Refresh entries
            const prophecy = prophecies.find(p => p.id === prophecyId);
            setEntries([...entries, {
                prophecy_id: prophecyId,
                prediction: pred,
                staked_xp: stake,
                potential_win: Math.floor(stake * (prophecy?.win_multiplier || 3)),
                result: 'pending',
            }]);
        }
    };

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // THE ORACLE
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">PROPHE</span>
                        <span className="text-purple-400">CIES</span>
                    </h1>
                    <p className="text-gray-400">
                        Stake your XP on market predictions. Win big or lose it all.
                    </p>
                </div>

                {!walletAddress ? (
                    <div className="text-center py-16 text-gray-500">
                        Connect wallet to view prophecies
                    </div>
                ) : loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : prophecies.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <Eye className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                        <p>No active prophecies</p>
                        <p className="text-sm mt-2">Check back later for new predictions</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prophecies.map(prophecy => {
                            const entry = getEntry(prophecy.id);
                            const hasStaked = hasEntry(prophecy.id);

                            return (
                                <div
                                    key={prophecy.id}
                                    className="p-6 rounded-xl border border-purple-500/30 bg-purple-500/5"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{prophecy.title}</h3>
                                            <p className="text-sm text-gray-400">{prophecy.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Clock className="w-4 h-4" />
                                            {getTimeRemaining(prophecy.deadline)}
                                        </div>
                                    </div>

                                    {hasStaked && entry ? (
                                        <div className="p-4 rounded-lg bg-[#0a0f0a] border border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {entry.prediction ? (
                                                        <TrendingUp className="w-5 h-5 text-green-400" />
                                                    ) : (
                                                        <TrendingDown className="w-5 h-5 text-red-400" />
                                                    )}
                                                    <span className="text-gray-400">
                                                        Predicted: {entry.prediction ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Staked</p>
                                                    <p className="font-bold text-yellow-400">{entry.staked_xp} XP</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">Potential Win</p>
                                                    <p className="font-bold text-green-400">{entry.potential_win} XP</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${entry.result === 'won' ? 'bg-green-500/20 text-green-400' :
                                                        entry.result === 'lost' ? 'bg-red-500/20 text-red-400' :
                                                            'bg-yellow-500/20 text-yellow-400'
                                                    }`}>
                                                    <AlertCircle className="w-3 h-3" />
                                                    {entry.result === 'pending' ? 'Awaiting Resolution' : entry.result.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setPrediction({ ...prediction, [prophecy.id]: true })}
                                                    className={`flex-1 py-3 rounded-lg border font-bold transition-all ${prediction[prophecy.id] !== false
                                                            ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                                            : 'border-gray-700 text-gray-500 hover:border-green-500/30'
                                                        }`}
                                                >
                                                    <TrendingUp className="w-4 h-4 inline mr-2" />
                                                    Yes
                                                </button>
                                                <button
                                                    onClick={() => setPrediction({ ...prediction, [prophecy.id]: false })}
                                                    className={`flex-1 py-3 rounded-lg border font-bold transition-all ${prediction[prophecy.id] === false
                                                            ? 'bg-red-500/20 border-red-500/50 text-red-400'
                                                            : 'border-gray-700 text-gray-500 hover:border-red-500/30'
                                                        }`}
                                                >
                                                    <TrendingDown className="w-4 h-4 inline mr-2" />
                                                    No
                                                </button>
                                            </div>

                                            <div className="flex gap-2 items-center">
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
                                                    className="flex-1 px-4 py-2 rounded-lg bg-[#0a0f0a] border border-gray-700 text-white focus:border-purple-500 outline-none"
                                                />
                                                <button
                                                    onClick={() => handleStake(prophecy.id)}
                                                    disabled={!stakeAmount[prophecy.id]}
                                                    className="px-6 py-2 rounded-lg bg-purple-500 text-white font-bold hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Stake
                                                </button>
                                            </div>

                                            <p className="text-xs text-gray-500 text-center">
                                                Win multiplier: {prophecy.win_multiplier}x
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
