'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, ChevronRight, BarChart3, Search } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { supabase } from '@/lib/supabase';

interface LeaderboardEntry {
    wallet_address: string;
    xp: number;
    rank: number;
}

type Period = 'daily' | 'weekly' | 'alltime';

export default function LeaderboardPage() {
    const { walletAddress } = useWallet();
    const { userStats } = usePlayer();
    const [period, setPeriod] = useState<Period>('alltime');
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

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

            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded bg-[#4ade80]/10 border border-[#4ade80]/20 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-[#4ade80]" />
                            </div>
                            <p className="text-[#4ade80] text-[10px] tracking-[0.4em] font-mono uppercase opacity-70">
                                // GLOBAL_RANKINGS_PROTOCOL
                            </p>
                        </div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">
                            <span className="text-white">RANKING</span>
                            <span className="text-[#4ade80] italic ml-2">SYSTEM</span>
                        </h1>
                        <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                            Authorized operators sorted by temporal XP accumulation.
                        </p>
                    </div>

                    <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                        {(['daily', 'weekly', 'alltime'] as Period[]).map(p => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-[0.2em] uppercase transition-all ${period === p
                                    ? 'bg-[#4ade80] text-black shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {p === 'alltime' ? 'All Time' : p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left side: Search & Stats */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-[#0a0f0a] border border-white/5">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Search_Operator</h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                                <input
                                    type="text"
                                    placeholder="Enter address..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-mono text-[#4ade80] focus:ring-1 focus:ring-[#4ade80]/50 outline-none transition-all placeholder:text-gray-700"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {walletAddress && (
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#4ade80]/10 to-transparent border border-[#4ade80]/20">
                                <h3 className="text-[10px] font-bold text-[#4ade80] uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <ChevronRight className="w-3 h-3" /> Status_Report
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-[10px] text-gray-600 uppercase">Current_Rank</div>
                                        <div className="text-2xl font-black text-white italic">#{userRank?.rank || '---'}</div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-[10px] text-gray-600 uppercase">Localized_XP</div>
                                        <div className="text-xl font-black text-[#4ade80]">{userStats?.total_points.toLocaleString() || 0}</div>
                                    </div>
                                    <div className="pt-4 border-t border-white/5">
                                        <div className="text-[8px] text-gray-700 font-mono leading-relaxed italic">
                                            "You are currently in the top {(userRank?.rank && entries.length > 0) ? Math.max(1, Math.round((userRank.rank / 1000) * 100)) : '---'}% of all active operators."
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Feed: Leaderboard */}
                    <div className="lg:col-span-3">
                        <div className="rounded-2xl border border-white/5 bg-[#070709] overflow-hidden shadow-2xl">
                            <div className="bg-white/[0.02] px-6 py-4 border-b border-white/5">
                                <div className="grid grid-cols-12 text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-7">Operator_Identity</div>
                                    <div className="col-span-4 text-right">XP_Accumulation</div>
                                </div>
                            </div>

                            <div className="divide-y divide-white/[0.02]">
                                {loading ? (
                                    <div className="p-20 flex flex-col items-center justify-center gap-4 text-gray-700">
                                        <div className="w-8 h-8 border-2 border-t-[#4ade80] border-transparent rounded-full animate-spin" />
                                        <p className="font-mono text-[10px] uppercase tracking-widest animate-pulse">Establishing_Data_Link...</p>
                                    </div>
                                ) : entries.length === 0 ? (
                                    <div className="p-20 text-center text-gray-700 font-mono text-[10px] uppercase tracking-widest">
                                        NO_DATA_RECORDS_FOUND
                                    </div>
                                ) : (
                                    entries
                                        .filter(e => e.wallet_address.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((entry, idx) => (
                                            <div
                                                key={entry.wallet_address}
                                                className={`px-6 py-5 grid grid-cols-12 items-center transition-all ${entry.wallet_address === walletAddress
                                                    ? 'bg-[#4ade80]/10 border-x-2 border-x-[#4ade80]'
                                                    : 'hover:bg-white/[0.02]'
                                                    }`}
                                            >
                                                <div className="col-span-1 flex items-center">
                                                    {getRankIcon(entry.rank)}
                                                </div>
                                                <div className="col-span-7">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold ${entry.wallet_address === walletAddress ? 'bg-[#4ade80] border-[#4ade80] text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                                                            {entry.wallet_address.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <span className={`text-xs font-mono tracking-tight ${entry.wallet_address === walletAddress ? 'text-[#4ade80] font-bold' : 'text-gray-400'}`}>
                                                                {truncateAddress(entry.wallet_address)}
                                                            </span>
                                                            {entry.wallet_address === walletAddress && (
                                                                <div className="text-[8px] text-[#4ade80] font-black uppercase tracking-widest mt-0.5">SUBJECT_PRIMARY</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-span-4 text-right">
                                                    <div className="text-sm font-black text-white tabular-nums">
                                                        {entry.xp.toLocaleString()}
                                                    </div>
                                                    <div className="text-[9px] text-[#4ade80] font-mono opacity-50">XP</div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-center p-8 rounded-2xl bg-white/[0.02] border border-dashed border-white/5 text-center">
                            <p className="text-[10px] text-gray-700 font-mono leading-relaxed max-w-lg italic uppercase tracking-widest">
                                "The top 100 operators shown above are updated every cycle. Keep pushing the boundaries of the Matrix to maintain your position."
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
