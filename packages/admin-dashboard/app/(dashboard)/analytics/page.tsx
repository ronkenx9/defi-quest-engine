'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Users, Target, TrendingUp, Loader2 } from 'lucide-react';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

interface AnalyticsData {
    totalUsers: number;
    totalMissions: number;
    totalCompletions: number;
    avgCompletionRate: number;
    missionStats: Array<{
        name: string;
        started: number;
        completed: number;
        rate: string;
    }>;
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        async function fetchAnalytics() {
            setLoading(true);
            const supabase = getSupabase();

            // Fetch total users
            const { count: userCount } = await supabase
                .from('user_stats')
                .select('*', { count: 'exact', head: true });

            // Fetch total missions
            const { count: missionCount } = await supabase
                .from('missions')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);

            // Fetch total completions
            const { count: completionCount } = await supabase
                .from('mission_progress')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'completed');

            // Fetch mission stats
            const { data: missions } = await supabase
                .from('missions')
                .select('id, name, completions')
                .eq('is_active', true)
                .order('completions', { ascending: false })
                .limit(5);

            // Fetch started count per mission
            const missionStats = await Promise.all(
                (missions || []).map(async (m) => {
                    const { count: started } = await supabase
                        .from('mission_progress')
                        .select('*', { count: 'exact', head: true })
                        .eq('mission_id', m.id);

                    const completed = m.completions || 0;
                    const rate = started && started > 0 ? Math.round((completed / started) * 100) : 0;

                    return {
                        name: m.name,
                        started: started || 0,
                        completed,
                        rate: `${rate}%`,
                    };
                })
            );

            const totalStarted = missionStats.reduce((sum, m) => sum + m.started, 0);
            const totalCompleted = completionCount || 0;
            const avgRate = totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0;

            setData({
                totalUsers: userCount || 0,
                totalMissions: missionCount || 0,
                totalCompletions: totalCompleted,
                avgCompletionRate: avgRate,
                missionStats,
            });
            setLoading(false);
        }

        fetchAnalytics();
    }, [period]);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-white mb-2">Analytics</h1>
                <p className="text-gray-400">Track engagement and performance metrics</p>
            </div>

            {/* Time Period Selector */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl inline-flex backdrop-blur-md">
                {['7d', '30d', '90d', 'All'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold font-display transition-all duration-300 ${p === period
                            ? 'bg-primary text-black shadow-glow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Users"
                    value={data?.totalUsers.toLocaleString() || '0'}
                    subtext="Connected wallets"
                    icon={<Users className="w-8 h-8" />}
                />
                <MetricCard
                    title="Mission Completions"
                    value={data?.totalCompletions.toLocaleString() || '0'}
                    subtext={`${data?.totalMissions || 0} active missions`}
                    icon={<Target className="w-8 h-8" />}
                />
                <MetricCard
                    title="Avg. Completion Rate"
                    value={`${data?.avgCompletionRate || 0}%`}
                    subtext="Started to completed"
                    icon={<TrendingUp className="w-8 h-8" />}
                />
            </div>

            {/* Mission Performance Table */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-white">Mission Performance</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider font-display">Mission</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Started</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Completed</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data?.missionStats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No mission data yet. Create missions and users will start completing them.
                                    </td>
                                </tr>
                            ) : (
                                data?.missionStats.map((m, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-white group-hover:text-primary transition-colors">{m.name}</td>
                                        <td className="px-6 py-4 text-gray-400">{m.started}</td>
                                        <td className="px-6 py-4 text-gray-400">{m.completed}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${parseInt(m.rate) > 40 ? 'bg-success/20 text-success' :
                                                parseInt(m.rate) > 20 ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
                                                }`}>
                                                {m.rate}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtext, icon }: { title: string; value: string; subtext: string; icon: React.ReactNode }) {
    return (
        <div className="glass-card p-6 relative group overflow-hidden hover:scale-[1.02] transition-all">
            <div className="absolute right-4 top-4 opacity-20 group-hover:opacity-30 transition-opacity text-primary">
                {icon}
            </div>
            <p className="text-sm text-gray-400 mb-2 font-display uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-bold text-white mb-2 font-display group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary transition-all">{value}</p>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{subtext}</span>
            </div>
        </div>
    );
}
