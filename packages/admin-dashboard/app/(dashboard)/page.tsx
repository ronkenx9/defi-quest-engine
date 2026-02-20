'use client';

import { StatsCard } from '@/components/StatsCard';
import { RecentActivity } from '@/components/RecentActivity';
import { useDashboardStats } from '@/lib/supabase-services';
import { Zap, Target, Trophy, Rocket, ArrowRight, Terminal } from 'lucide-react';

export default function DashboardPage() {
    const { stats, loading } = useDashboardStats();

    const formatVolume = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value}`;
    };

    return (
        <div className="space-y-6 animate-fade-in font-mono">
            {/* Header Hero (Cyber Brutalist) */}
            <div
                className="relative p-6 bg-[#000000] border-2 border-[#4ade80] overflow-hidden mb-8"
                style={{
                    clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 25px), calc(100% - 25px) 100%, 0 100%)',
                    boxShadow: '8px 8px 0px rgba(74,222,128,0.2)'
                }}
            >
                {/* Harsh Grid Overlay */}
                <div className="absolute inset-0 z-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 19px, #4ade80 19px, #4ade80 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, #4ade80 19px, #4ade80 20px)',
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Diagonal stripes corner accent */}
                <div className="absolute -top-10 -right-10 w-32 h-32 opacity-20" style={{
                    background: 'repeating-linear-gradient(45deg, #4ade80, #4ade80 2px, transparent 2px, transparent 8px)'
                }}></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 mb-2 bg-[#4ade80]/10 px-2 py-1 border border-[#4ade80]/30 text-[10px] tracking-widest text-[#4ade80] uppercase">
                            <Terminal className="w-3 h-3" />
                            SYS_ADMIN_ROOT
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                            MATRIX <span className="text-[#4ade80]">CORE</span>_
                        </h1>
                        <p className="text-[#4ade80]/60 max-w-lg text-sm md:text-base border-l-2 border-[#4ade80] pl-3">
                            <span className="text-white">{'>>'}</span> Centralized campaign datalyr execution terminal.
                        </p>
                    </div>
                    <div className="flex bg-[#000000] border border-[#4ade80] p-1 shadow-[4px_4px_0px_#4ade80]">
                        <div className="px-4 py-2 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-none bg-[#4ade80] animate-[pulse_1s_infinite]"></div>
                            <span className="text-xs font-bold font-mono tracking-widest text-[#4ade80] uppercase">System_Active</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard icon="👥" label="Total_Users" value={loading ? '...' : stats?.totalUsers.toLocaleString() || '0'} change="+12%" positive />
                <StatsCard icon="⚡" label="Active_Reqs" value={loading ? '...' : stats?.activeQuests.toString() || '0'} change="+3" positive />
                <StatsCard icon="💎" label="Volume_Tx" value={loading ? '...' : formatVolume(stats?.volumeTraded || 0)} change="+24%" positive />
                <StatsCard icon="🔥" label="Avg_Streak" value={loading ? '...' : `${stats?.avgStreak || 0}D`} change="-0.3" positive={false} />
            </div>

            {/* Charts & Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Vector Chart Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div
                        className="p-6 bg-[#000000] border border-[#4ade80]/30 h-[400px] flex flex-col relative overflow-hidden group hover:border-[#4ade80] transition-colors"
                        style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                    >
                        <div className="absolute top-0 left-0 bg-[#4ade80]/20 text-[#4ade80] text-[8px] tracking-[0.3em] px-2 py-1 uppercase">Graph_01_Participation</div>

                        <div className="flex justify-between items-center mb-6 z-10 mt-2">
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase tracking-tighter">Participation_Vector</h3>
                                <p className="text-[10px] text-[#4ade80]/50 tracking-widest">T-MINUS 30 CYCLE</p>
                            </div>
                            <select className="bg-[#000000] border-2 border-[#4ade80]/50 px-3 py-1 text-xs text-[#4ade80] font-bold uppercase outline-none focus:border-[#4ade80]">
                                <option>Weekly_Scale</option>
                                <option>Monthly_Scale</option>
                            </select>
                        </div>

                        {/* Brutalist Trajectory Visualization */}
                        <div className="flex-1 w-full relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 border-l-2 border-b-2 border-[#4ade80]/40">
                                {[...Array(24)].map((_, i) => (
                                    <div key={i} className="border-r border-t border-[#4ade80]/10 border-dashed"></div>
                                ))}
                            </div>

                            {/* Stepped Chart Line */}
                            <svg className="absolute inset-0 w-full h-full p-4 overflow-visible" preserveAspectRatio="none">
                                <path
                                    d="M0,300 L50,300 L50,250 L100,250 L100,280 L150,280 L150,200 L200,200 L200,120 L250,120 L250,150 L300,150 L300,100 L350,100 L350,50 L400,50 L400,80 L450,80 L450,150 L500,150 L500,220 L550,220 L550,100 L600,100 L600,50"
                                    fill="none"
                                    stroke="#4ade80"
                                    strokeWidth="2"
                                />
                                {/* Data Plot Points */}
                                {[
                                    [0, 300], [50, 250], [100, 280], [150, 200], [200, 120], [250, 150],
                                    [300, 100], [350, 50], [400, 80], [450, 150], [500, 220], [550, 100], [600, 50]
                                ].map((pt, i) => (
                                    <rect key={i} x={pt[0] - 3} y={pt[1] - 3} width={6} height={6} fill="#000000" stroke="#4ade80" strokeWidth="2" />
                                ))}
                            </svg>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            className="bg-[#000000] border border-[#4ade80]/30 h-64 relative overflow-hidden p-5 group hover:border-[#4ade80] transition-colors"
                            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 15px 100%, 0 calc(100% - 15px))' }}
                        >
                            <div className="absolute top-0 right-0 bg-[#4ade80]/10 px-2 py-1 text-[8px] text-[#4ade80]">CHART_02</div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Volume_Blocks</h3>

                            {/* Blocky Bar Chart */}
                            <div className="flex items-end gap-1 h-36">
                                {[40, 60, 45, 70, 85, 60, 90].map((h, i) => (
                                    <div key={i} className="flex-1 bg-[#4ade80]/10 relative group/bar border border-[#4ade80]/20" style={{ height: `${h}%` }}>
                                        <div className="absolute top-0 w-full h-1 bg-[#4ade80] group-hover/bar:h-full transition-all duration-300"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            className="bg-[#4ade80] border-2 border-white text-black h-64 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:bg-[#22c55e] transition-colors"
                            style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
                        >
                            <div className="relative z-10 w-16 h-16 border-4 border-black mb-4 flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-[4px_4px_0px_white]">
                                <Rocket size={24} className="text-black" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter">Initialize_Payload</h3>
                            <a href="/missions/create" className="mt-4 px-6 py-2 bg-black text-[#4ade80] font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors">
                                Execute_Deploy
                            </a>
                        </div>
                    </div>
                </div>

                {/* Right Column (Feed) */}
                <div className="space-y-6">
                    <RecentActivity />

                    {/* Quick Actions Panel */}
                    <div
                        className="bg-[#000000] border border-[#4ade80]"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
                    >
                        <div className="bg-[#4ade80] text-black font-bold uppercase text-xs tracking-widest px-4 py-2 border-b-2 border-black">
                            Command_Line
                        </div>
                        <div className="p-4 space-y-3 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                            <ActionLink href="/missions/create" icon={<Zap size={14} />} label="NEW_MISSION_REQ" />
                            <ActionLink href="/missions/manage" icon={<Target size={14} />} label="SYS_OVERRIDE_DB" />
                            <ActionLink href="/leaderboard" icon={<Trophy size={14} />} label="READ_LEADERBOARD" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <a href={href} className="flex items-center gap-3 p-3 bg-[#000000] border border-[#4ade80]/30 hover:border-[#4ade80] group transition-all">
            <div className="text-[#4ade80] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-widest group-hover:text-[#4ade80]">{label}</span>
            <ArrowRight size={14} className="ml-auto text-[#4ade80] opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
    );
}
