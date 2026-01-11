'use client';

import { Medal, Crown, Award, Star, Target, Flame, User, Download } from 'lucide-react';

export default function LeaderboardPage() {
    const leaderboardData = [
        { rank: 1, address: '7xKJ...4pQm', points: 2450, missions: 34, streak: 12 },
        { rank: 2, address: '3mNP...8rTz', points: 2120, missions: 28, streak: 8 },
        { rank: 3, address: '9zWQ...2vLx', points: 1890, missions: 25, streak: 15 },
        { rank: 4, address: '5kRY...6nDs', points: 1650, missions: 22, streak: 5 },
        { rank: 5, address: '1pHT...9wCb', points: 1420, missions: 19, streak: 7 },
        { rank: 6, address: '8fGX...3kMn', points: 1280, missions: 17, streak: 4 },
        { rank: 7, address: '2jLP...7yRq', points: 1150, missions: 15, streak: 9 },
        { rank: 8, address: '6wBN...1zTs', points: 980, missions: 13, streak: 3 },
        { rank: 9, address: '4cVK...5xJw', points: 850, missions: 11, streak: 6 },
        { rank: 10, address: '0dAM...9gFv', points: 720, missions: 9, streak: 2 },
    ];

    const getRankIcon = (rank: number) => {
        if (rank === 1) return <Crown size={20} className="text-yellow-400" fill="currentColor" />;
        if (rank === 2) return <Medal size={20} className="text-gray-300" />;
        if (rank === 3) return <Award size={20} className="text-orange-400" />;
        return <span className="text-gray-500 font-mono text-sm">#{rank}</span>;
    };

    const getRankBgStyle = (rank: number) => {
        if (rank === 1) return 'bg-yellow-500/10 border-l-2 border-l-yellow-500';
        if (rank === 2) return 'bg-gray-400/5 border-l-2 border-l-gray-400';
        if (rank === 3) return 'bg-orange-500/10 border-l-2 border-l-orange-500';
        return '';
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2">Leaderboard</h1>
                    <p className="text-gray-400">Top performers across all missions</p>
                </div>
                <button className="btn btn-secondary flex items-center gap-2">
                    <Download size={16} />
                    Export JSON
                </button>
            </div>

            {/* Podium */}
            <div className="flex justify-center items-end gap-6 mb-12 h-56 pt-8">
                {/* 2nd Place */}
                <div className="flex flex-col items-center group">
                    <div className="w-16 h-16 rounded-full bg-gray-400/10 border-2 border-gray-400/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <User size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium font-display text-white">{leaderboardData[1].address}</p>
                    <p className="text-xs text-gray-500">{leaderboardData[1].points.toLocaleString()} pts</p>
                    <div className="w-28 h-20 bg-gradient-to-t from-gray-600/80 to-gray-400/50 rounded-t-xl mt-3 flex items-center justify-center border-t border-x border-gray-400/30">
                        <Medal size={32} className="text-gray-300 opacity-50" />
                    </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center group">
                    <div className="relative">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <Crown size={24} className="text-yellow-400 animate-pulse" fill="currentColor" />
                        </div>
                        <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)] group-hover:scale-110 transition-transform">
                            <User size={36} className="text-yellow-400" />
                        </div>
                    </div>
                    <p className="text-sm font-bold font-display text-white mt-3">{leaderboardData[0].address}</p>
                    <p className="text-xs text-primary font-medium">{leaderboardData[0].points.toLocaleString()} pts</p>
                    <div className="w-28 h-28 bg-gradient-to-t from-yellow-600/80 to-yellow-400/50 rounded-t-xl mt-3 flex items-center justify-center border-t border-x border-yellow-500/30 shadow-[0_-10px_30px_rgba(234,179,8,0.2)]">
                        <Star size={40} className="text-yellow-400 opacity-50" fill="currentColor" />
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center group">
                    <div className="w-16 h-16 rounded-full bg-orange-500/10 border-2 border-orange-500/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <User size={28} className="text-orange-400" />
                    </div>
                    <p className="text-sm font-medium font-display text-white">{leaderboardData[2].address}</p>
                    <p className="text-xs text-gray-500">{leaderboardData[2].points.toLocaleString()} pts</p>
                    <div className="w-28 h-14 bg-gradient-to-t from-orange-700/80 to-orange-500/50 rounded-t-xl mt-3 flex items-center justify-center border-t border-x border-orange-500/30">
                        <Award size={28} className="text-orange-400 opacity-50" />
                    </div>
                </div>
            </div>

            {/* Full List Table */}
            <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl relative">
                {/* Decorative glow */}
                <div className="absolute top-[-30%] right-[-10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Rank</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Wallet</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Points</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Missions</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Streak</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leaderboardData.map((user) => (
                                <tr key={user.rank} className={`group hover:bg-white/5 transition-colors ${getRankBgStyle(user.rank)}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                                            {getRankIcon(user.rank)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border border-white/10">
                                                <User size={18} className="text-gray-400" />
                                            </div>
                                            <span className="font-mono text-white group-hover:text-primary transition-colors">{user.address}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 font-bold text-primary">
                                            <Star size={14} fill="currentColor" />
                                            {user.points.toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-300">
                                            <Target size={14} className="text-gray-500" />
                                            {user.missions}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-orange-400">
                                            <Flame size={14} className="text-orange-500" />
                                            {user.streak} days
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
