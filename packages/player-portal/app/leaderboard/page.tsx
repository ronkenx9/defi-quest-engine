'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
    wallet_address: string;
    xp: number;
    rank: number;
}

type Period = 'daily' | 'weekly' | 'alltime';

export default function LeaderboardPage() {
    const { walletAddress } = useWallet();
    const [period, setPeriod] = useState<Period>('alltime');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLeaderboard() {
            setLoading(true);

            const tableName = period === 'daily' ? 'leaderboard_daily' :
                period === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_alltime';

            // For daily/weekly we need date filter, for now just get alltime
            const { data, error } = await supabase
                .from(tableName)
                .select('wallet_address, xp, rank')
                .order('xp', { ascending: false })
                .limit(100);

            if (!error && data) {
                // Assign ranks if not set
                const ranked = data.map((entry, idx) => ({
                    ...entry,
                    rank: entry.rank || idx + 1,
                }));
                setEntries(ranked);

                // Find user's rank
                if (walletAddress) {
                    const user = ranked.find(e => e.wallet_address === walletAddress);
                    setUserRank(user || null);
                }
            }
            setLoading(false);
        }

        fetchLeaderboard();
    }, [period, walletAddress]);

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
        if (rank === 3) return <Award className="w-5 h-5 text-orange-400" />;
        return <span className="w-5 text-center text-gray-500">{rank}</span>;
    };

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // GLOBAL RANKINGS
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">LEADER</span>
                        <span className="text-[#4ade80]">BOARD</span>
                    </h1>
                    <p className="text-gray-400">
                        Top operators in the Matrix. Climb the ranks.
                    </p>
                </div>

                {/* Period Filter */}
                <div className="flex gap-2 mb-6">
                    {(['daily', 'weekly', 'alltime'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${period === p
                                    ? 'bg-[#4ade80] text-black'
                                    : 'bg-[#0a0f0a] border border-gray-700 text-gray-400 hover:border-[#4ade80]/50'
                                }`}
                        >
                            {p === 'alltime' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                        </button>
                    ))}
                </div>

                {/* User's Rank Card */}
                {walletAddress && userRank && (
                    <div className="mb-6 p-4 rounded-xl border border-[#4ade80]/30 bg-[#4ade80]/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#4ade80] flex items-center justify-center text-black font-bold">
                                    {userRank.rank}
                                </div>
                                <div>
                                    <p className="font-bold text-[#4ade80]">Your Rank</p>
                                    <p className="text-sm text-gray-400">{truncateAddress(walletAddress)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-[#4ade80]">{userRank.xp.toLocaleString()}</p>
                                <p className="text-sm text-gray-500">XP</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leaderboard Table */}
                <div className="rounded-xl border border-gray-800 overflow-hidden">
                    <div className="bg-[#0a0f0a] p-4 border-b border-gray-800">
                        <div className="grid grid-cols-12 text-xs text-gray-500 uppercase">
                            <div className="col-span-1">Rank</div>
                            <div className="col-span-7">Operator</div>
                            <div className="col-span-4 text-right">XP</div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : entries.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No entries yet</div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {entries.map((entry, idx) => (
                                <div
                                    key={entry.wallet_address}
                                    className={`p-4 grid grid-cols-12 items-center ${entry.wallet_address === walletAddress
                                            ? 'bg-[#4ade80]/5'
                                            : 'hover:bg-gray-800/30'
                                        }`}
                                >
                                    <div className="col-span-1 flex items-center">
                                        {getRankIcon(idx + 1)}
                                    </div>
                                    <div className="col-span-7">
                                        <span className={entry.wallet_address === walletAddress ? 'text-[#4ade80] font-bold' : 'text-white'}>
                                            {truncateAddress(entry.wallet_address)}
                                        </span>
                                        {entry.wallet_address === walletAddress && (
                                            <span className="ml-2 text-xs text-[#4ade80]">(You)</span>
                                        )}
                                    </div>
                                    <div className="col-span-4 text-right font-mono text-[#4ade80]">
                                        {entry.xp.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
