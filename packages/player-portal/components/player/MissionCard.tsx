'use client';

import { Zap, Shield, TrendingUp, DollarSign, ArrowUpDown, BarChart3, ChevronRight, Play, Route } from 'lucide-react';

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
        <div className="group relative rounded-xl bg-[#0a0f0a] border border-[#4ade80]/10 p-5 transition-all duration-300 hover:border-[#4ade80]/30 hover:shadow-[0_0_25px_rgba(74,222,128,0.06)] animate-slide-up overflow-hidden">
            {/* Corner glow on hover */}
            <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#4ade80] blur-[40px] opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500 pointer-events-none"></div>

            {/* Top: icon + difficulty */}
            <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                    <Icon className="w-4 h-4" />
                </div>
                <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                    style={{ color: diffInfo.color, background: diffInfo.bg, borderColor: diffInfo.border }}
                >
                    {diffInfo.label}
                </span>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[#4ade80] transition-colors line-clamp-1">
                {mission.name ?? 'Unknown Mission'}
            </h3>

            {/* Description */}
            <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                {mission.description || 'Complete this mission to earn XP rewards.'}
            </p>

            {/* Progress bar */}
            {progress > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span className="font-mono">{progress}%</span>
                        <span className="font-mono">{xp} XP</span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#4ade80] transition-all duration-500"
                            style={{ width: `${progress}%`, boxShadow: '0 0 8px rgba(74,222,128,0.3)' }}
                        />
                    </div>
                </div>
            )}

            {/* Bottom: XP + action */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#4ade80]" />
                    <span className="text-xs font-bold text-[#4ade80]">{xp} XP</span>
                    {mission.resetCycle && mission.resetCycle !== 'none' && (
                        <span className="text-[10px] text-gray-600 font-mono ml-1">({mission.resetCycle})</span>
                    )}
                </div>

                {walletConnected && progress === 0 && (
                    <button
                        onClick={onStart}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20 hover:bg-[#4ade80]/20 transition-all hover:scale-105"
                    >
                        <Play className="w-3 h-3" /> Start
                    </button>
                )}

                {progress > 0 && progress < 100 && (
                    <span className="text-[10px] font-bold text-[#4ade80] font-mono uppercase tracking-wider">In Progress</span>
                )}

                {progress >= 100 && (
                    <span className="text-[10px] font-bold text-[#22c55e] font-mono uppercase tracking-wider">✓ Complete</span>
                )}
            </div>
        </div>
    );
}
