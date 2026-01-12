'use client';

import { StatsCard } from '@/components/StatsCard';
import { RecentActivity } from '@/components/RecentActivity';
import { useDashboardStats } from '@/lib/supabase-services';
import { Zap, Target, Trophy, Rocket, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
    const { stats, loading } = useDashboardStats();

    // Format volume for display
    const formatVolume = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value}`;
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header Hero */}
            <div className="relative p-8 rounded-3xl overflow-hidden glass-panel border-primary/20 shadow-glow mb-10">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50"></div>
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-secondary/20 rounded-full blur-[50px]"></div>

                <div className="relative z-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold font-display text-white mb-2 tracking-tight">
                            Start Your Quest <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Engine</span>
                        </h1>
                        <p className="text-gray-400 max-w-lg text-lg">
                            Monitor engagement, manage campaigns, and track real-time Solana on-chain activity.
                        </p>
                    </div>
                    <div className="hidden lg:block">
                        <div className="px-4 py-2 rounded-full bg-black/40 border border-primary/30 backdrop-blur-md flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                            <span className="text-sm font-mono text-primary">System Operational</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    icon="👥"
                    label="Total Users"
                    value={loading ? '...' : stats?.totalUsers.toLocaleString() || '0'}
                    change="+12%"
                    positive
                />
                <StatsCard
                    icon="⚡"
                    label="Active Quests"
                    value={loading ? '...' : stats?.activeQuests.toString() || '0'}
                    change="+3"
                    positive
                />
                <StatsCard
                    icon="💎"
                    label="Volume Traded"
                    value={loading ? '...' : formatVolume(stats?.volumeTraded || 0)}
                    change="+24%"
                    positive
                />
                <StatsCard
                    icon="🔥"
                    label="Avg. Streak"
                    value={loading ? '...' : `${stats?.avgStreak || 0} Days`}
                    change="-0.3"
                    positive={false}
                />
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card h-[400px] flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6 z-10">
                            <div>
                                <h3 className="text-xl font-bold font-display text-white">Quest Participation</h3>
                                <p className="text-xs text-gray-500">Last 30 Days</p>
                            </div>
                            <select className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-300 outline-none">
                                <option>Weekly</option>
                                <option>Monthly</option>
                            </select>
                        </div>

                        {/* Fake Chart Visualization */}
                        <div className="flex-1 w-full bg-gradient-to-t from-primary/5 to-transparent rounded-lg border-b border-l border-white/5 relative group cursor-crosshair">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4">
                                {[...Array(24)].map((_, i) => (
                                    <div key={i} className="border-r border-t border-white/5"></div>
                                ))}
                            </div>

                            {/* Chart Line Representation */}
                            <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" preserveAspectRatio="none">
                                <path
                                    d="M0,300 C50,250 100,280 150,200 C200,120 250,150 300,100 C350,50 400,80 450,150 C500,220 550,180 600,100 L600,400 L0,400 Z"
                                    fill="url(#gradient)"
                                    className="opacity-20"
                                />
                                <path
                                    d="M0,300 C50,250 100,280 150,200 C200,120 250,150 300,100 C350,50 400,80 450,150 C500,220 550,180 600,100"
                                    fill="none"
                                    stroke="#C7F284"
                                    strokeWidth="3"
                                    className="drop-shadow-glow"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#C7F284" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="#C7F284" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Hover Tooltip Placeholder */}
                            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-surface border border-primary/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none transform -translate-y-2 backdrop-blur-md">
                                <p className="text-xs text-gray-400">Apr 12</p>
                                <p className="text-lg font-bold text-primary">8,452</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card h-64 relative overflow-hidden">
                            <h3 className="text-lg font-bold font-display text-white mb-4">User Growth</h3>
                            <div className="flex items-end gap-2 h-40">
                                {[40, 60, 45, 70, 85, 60, 90].map((h, i) => (
                                    <div key={i} className="flex-1 bg-white/5 hover:bg-secondary/50 transition-colors rounded-t-sm relative group" style={{ height: `${h}%` }}>
                                        <div className="absolute bottom-0 w-full h-1 bg-secondary shadow-[0_0_10px_#00BEBD]"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card h-64 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10 p-4 rounded-full bg-white/5 border border-white/10 mb-4 group-hover:scale-110 transition-transform duration-500">
                                <Rocket size={28} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white relative z-10">New Campaign</h3>
                            <p className="text-sm text-gray-500 mb-4 relative z-10">Launch a new quest to boost volume</p>
                            <a href="/missions/create" className="btn btn-primary relative z-10">Launch Now</a>
                        </div>
                    </div>
                </div>

                {/* Right Column (Feed) */}
                <div className="space-y-6">
                    <RecentActivity />

                    {/* Quick Actions Card */}
                    <div className="card bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                        <h3 className="text-lg font-bold font-display text-white mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <a href="/missions/create" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 group-hover:shadow-[0_0_10px_rgba(199,242,132,0.3)] transition-all">
                                    <Zap size={16} />
                                </div>
                                <span className="text-sm text-gray-300 group-hover:text-white">Create new mission</span>
                                <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                            </a>
                            <a href="/missions/manage" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <div className="p-1.5 rounded-lg bg-secondary/10 text-secondary group-hover:bg-secondary/20 group-hover:shadow-[0_0_10px_rgba(0,190,189,0.3)] transition-all">
                                    <Target size={16} />
                                </div>
                                <span className="text-sm text-gray-300 group-hover:text-white">Manage missions</span>
                                <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-secondary" />
                            </a>
                            <a href="/leaderboard" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
                                <div className="p-1.5 rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all">
                                    <Trophy size={16} />
                                </div>
                                <span className="text-sm text-gray-300 group-hover:text-white">View leaderboard</span>
                                <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
