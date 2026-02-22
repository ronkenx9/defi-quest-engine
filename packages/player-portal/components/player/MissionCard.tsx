'use client';

import { Zap, Shield, TrendingUp, DollarSign, ArrowUpDown, BarChart3, ChevronRight, Play, Route, Eye } from 'lucide-react';

interface MissionCardProps {
    mission: {
        id: string;
        name: string;
        description?: string;
        type: string;
        difficulty: string;
        points?: number;
        reward?: { points?: number };
        resetCycle?: string;
    };
    progress: number;
    walletConnected: boolean;
    onStart: () => void;
}

const typeIcons: Record<string, any> = {
    swap: ArrowUpDown,
    volume: BarChart3,
    streak: TrendingUp,
    price: DollarSign,
    routing: Route,
    limit_order: Shield,
    dca: Zap,
    prediction: Eye,
    prophecy: Eye,
};

const difficultyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    easy: { label: 'Easy', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
    medium: { label: 'Medium', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
    hard: { label: 'Hard', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
    legendary: { label: 'Legendary', color: '#a855f6', bg: 'rgba(168,85,246,0.08)', border: 'rgba(168,85,246,0.25)' },
};

export default function MissionCard({ mission, progress, walletConnected, onStart }: MissionCardProps) {
    const Icon = typeIcons[mission.type] || Zap;
    const diffInfo = difficultyConfig[(mission.difficulty ?? '').toLowerCase()] || difficultyConfig.easy;
    const xp = mission.reward?.points || mission.points || 0;

    return (
        <div className="group relative rounded-3xl bg-[#0a0c10] border border-white/10 p-8 transition-all duration-500 hover:border-[#4ade80]/40 overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ade80]/10 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            {/* Terminal HUD Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4ade80]/5 border border-[#4ade80]/20 flex items-center justify-center text-[#4ade80] shadow-[0_0_15px_rgba(74,222,128,0.1)] group-hover:shadow-[0_0_20px_rgba(74,222,128,0.2)] transition-all">
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-0.5">Packet_Protocol_ID</p>
                        <p className="text-[11px] font-black text-[#4ade80]/80">MSN_{mission.id.slice(0, 4)}_{mission.type.toUpperCase()}</p>
                    </div>
                </div>
                <div
                    className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    style={{ color: diffInfo.color, background: `${diffInfo.color}15`, borderColor: `${diffInfo.color}30` }}
                >
                    {diffInfo.label}
                </div>
            </div>

            {/* Signal Title */}
            <div className="mb-4">
                <h3 className="text-2xl font-black text-white italic tracking-tight mb-2 group-hover:text-[#4ade80] transition-colors leading-none">
                    {mission.name ?? 'Unknown Mission'}
                </h3>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-[#4ade80]/40" />
                    <p className="text-[11px] text-gray-500 leading-relaxed font-mono uppercase truncate max-w-[280px]">
                        {mission.description || 'Intercepting encrypted command signal...'}
                    </p>
                </div>
            </div>

            {/* Stats Block */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 group-hover:border-[#4ade80]/10 transition-colors">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1 font-black underline decoration-[#4ade80]/30 underline-offset-4">Yield_Reward</p>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#4ade80]" />
                        <span className="text-lg font-black text-white">{xp} <span className="text-[10px] text-[#4ade80]">XP</span></span>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 group-hover:border-[#4ade80]/10 transition-colors">
                    <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1 font-black underline decoration-[#4ade80]/30 underline-offset-4">Refresh_Cycle</p>
                    <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-gray-500" />
                        <span className="text-lg font-black text-white uppercase">{mission.resetCycle || 'STATIC'}</span>
                    </div>
                </div>
            </div>

            {/* Action Zone */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                    {progress > 0 && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em]">
                                <span className="text-gray-500">Decoding_Progress</span>
                                <span className="text-[#4ade80]">{progress}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/5 border border-white/5 p-0.5 relative overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80] transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            </div>
                        </div>
                    )}
                </div>

                {walletConnected && progress === 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onStart();
                        }}
                        className="flex items-center gap-2 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-[0.3em] bg-white text-black hover:bg-[#4ade80] transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(74,222,128,0.3)] active:scale-95 translate-y-0 hover:-translate-y-1"
                    >
                        Initiate_Link
                    </button>
                )}

                {progress > 0 && progress < 100 && (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/20">
                        <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                        <span className="text-[10px] font-black text-[#4ade80] uppercase tracking-widest">Linked</span>
                    </div>
                )}

                {progress >= 100 && (
                    <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20">
                        <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest italic">✓ Signal_Resolved</span>
                    </div>
                )}
            </div>
        </div>
    );
}
