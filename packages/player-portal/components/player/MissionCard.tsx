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

const typeConfig: Record<string, { icon: any; color: string; glow: string }> = {
    swap: { icon: ArrowUpDown, color: 'var(--cyan)', glow: 'rgba(0,240,255,0.15)' },
    volume: { icon: BarChart3, color: 'var(--magenta)', glow: 'rgba(255,45,120,0.15)' },
    streak: { icon: TrendingUp, color: 'var(--gold)', glow: 'rgba(255,200,68,0.15)' },
    price: { icon: DollarSign, color: '#4ade80', glow: 'rgba(74,222,128,0.15)' },
    routing: { icon: Route, color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
    limit_order: { icon: Shield, color: '#f97316', glow: 'rgba(249,115,22,0.15)' },
    dca: { icon: Zap, color: '#06b6d4', glow: 'rgba(6,182,212,0.15)' },
};

const difficultyConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    easy: { label: 'Easy', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
    medium: { label: 'Medium', color: 'var(--cyan)', bg: 'var(--cyan-dim)', border: 'rgba(0,240,255,0.2)' },
    hard: { label: 'Hard', color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
    legendary: { label: 'Legendary', color: 'var(--magenta)', bg: 'var(--magenta-dim)', border: 'rgba(255,45,120,0.3)' },
};

export default function MissionCard({ mission, progress, walletConnected, onStart }: MissionCardProps) {
    const typeInfo = typeConfig[mission.type] || typeConfig.swap;
    const diffInfo = difficultyConfig[(mission.difficulty ?? '').toLowerCase()] || difficultyConfig.easy;
    const Icon = typeInfo.icon;
    const xp = mission.reward?.points || mission.points || 0;

    return (
        <div
            className="group relative rounded-xl bg-[var(--void-card)] border border-[var(--border)] p-5 transition-all duration-300 hover:border-opacity-50 animate-slide-up overflow-hidden"
            style={{
                '--hover-color': typeInfo.color,
                '--hover-glow': typeInfo.glow,
            } as React.CSSProperties}
            onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = typeInfo.color + '40';
                el.style.boxShadow = `0 0 25px ${typeInfo.glow}`;
            }}
            onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderColor = '';
                el.style.boxShadow = '';
            }}
        >
            {/* Subtle corner glow */}
            <div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: typeInfo.color }}
            ></div>

            {/* Top row: type icon + difficulty badge */}
            <div className="flex items-center justify-between mb-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: typeInfo.glow }}
                >
                    <Icon className="w-4 h-4" style={{ color: typeInfo.color }} />
                </div>

                <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                        color: diffInfo.color,
                        background: diffInfo.bg,
                        borderColor: diffInfo.border,
                    }}
                >
                    {diffInfo.label}
                </span>
            </div>

            {/* Mission title */}
            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[var(--text-primary)] transition-colors line-clamp-1">
                {mission.name ?? 'Unknown Mission'}
            </h3>

            {/* Description */}
            <p className="text-xs text-[var(--text-muted)] mb-4 line-clamp-2 leading-relaxed">
                {mission.description || 'Complete this mission to earn XP rewards.'}
            </p>

            {/* Progress bar */}
            {progress > 0 && (
                <div className="mb-4">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mb-1">
                        <span className="font-mono">{progress}%</span>
                        <span className="font-mono">{xp} XP</span>
                    </div>
                    <div className="h-1 rounded-full bg-[var(--void-elevated)] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${typeInfo.color}, ${typeInfo.color}88)`,
                                boxShadow: `0 0 8px ${typeInfo.glow}`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Bottom: XP reward + action */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[var(--gold)]" />
                    <span className="text-xs font-bold text-[var(--gold)]">{xp} XP</span>
                    {mission.resetCycle && mission.resetCycle !== 'none' && (
                        <span className="text-[10px] text-[var(--text-muted)] font-mono ml-1">
                            ({mission.resetCycle})
                        </span>
                    )}
                </div>

                {walletConnected && progress === 0 && (
                    <button
                        onClick={onStart}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                        style={{
                            background: typeInfo.glow,
                            color: typeInfo.color,
                            border: `1px solid ${typeInfo.color}30`,
                        }}
                    >
                        <Play className="w-3 h-3" /> Start
                    </button>
                )}

                {progress > 0 && progress < 100 && (
                    <span className="text-[10px] font-bold text-[var(--cyan)] font-mono uppercase tracking-wider">
                        In Progress
                    </span>
                )}

                {progress >= 100 && (
                    <span className="text-[10px] font-bold text-[#4ade80] font-mono uppercase tracking-wider">
                        ✓ Complete
                    </span>
                )}
            </div>
        </div>
    );
}
