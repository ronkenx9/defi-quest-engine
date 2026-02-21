'use client';

import { useState, useEffect, useRef } from 'react';
import {
    X, ArrowUpDown, TrendingUp, BarChart3,
    ChevronDown, ExternalLink, Zap, Timer,
    CheckCircle2, AlertTriangle, Flame
} from 'lucide-react';

interface MissionActionPanelProps {
    mission: {
        id: string;
        name: string;
        description?: string;
        type: string;
        difficulty: string;
        points?: number;
        reward?: { points?: number };
    };
    onClose: () => void;
    onComplete?: () => void;
    walletAddress?: string | null;
}

/**
 * Mission Action Panel — Contextual mini-terminal
 * 
 * Slides open when the player clicks "Start Mission" on a card.
 * Renders the appropriate tool based on mission type:
 * - swap → Jupiter swap widget with mission parameters
 * - streak → Daily check-in tracker with flame counter
 * - prediction → Prophecy staking micro-interface
 * 
 * Aesthetic: Collapsed terminal window — glass panel with scan lines,
 * Matrix green accents, monospace data readouts. Feels like opening a
 * command console inside the mission briefing.
 */
export default function MissionActionPanel({
    mission, onClose, onComplete, walletAddress
}: MissionActionPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    // Animate in
    useEffect(() => {
        const timer = setTimeout(() => setIsExpanded(true), 50);
        return () => clearTimeout(timer);
    }, []);

    // Close with animation
    const handleClose = () => {
        setIsExpanded(false);
        setTimeout(onClose, 300);
    };

    const xp = mission.reward?.points || mission.points || 0;

    return (
        <div
            ref={panelRef}
            className="overflow-hidden transition-all duration-300 ease-out"
            style={{
                maxHeight: isExpanded ? '600px' : '0px',
                opacity: isExpanded ? 1 : 0,
            }}
        >
            <div className="mt-3 rounded-xl border border-[#4ade80]/20 overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #080d08 0%, #050507 100%)' }}>

                {/* ─── Terminal Header ─── */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#4ade80]/10"
                    style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.06) 0%, transparent 100%)' }}>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                            <div className="w-2 h-2 rounded-full bg-[#4ade80]/40" />
                            <div className="w-2 h-2 rounded-full bg-[#4ade80]/20" />
                        </div>
                        <span className="text-[9px] font-mono text-[#4ade80]/60 tracking-[0.2em] uppercase">
                            mission://execute/{mission.type}
                        </span>
                    </div>
                    <button onClick={handleClose} className="text-gray-600 hover:text-[#4ade80] transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ─── Mission Briefing Bar ─── */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono">OBJ:</span>
                        <span className="text-xs text-white font-semibold">{mission.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#4ade80]" />
                        <span className="text-xs font-bold text-[#4ade80] font-mono">{xp} XP</span>
                    </div>
                </div>

                {/* ─── Content Area (type-specific) ─── */}
                <div className="p-4 relative">
                    {/* Scanline effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="w-full h-[1px] bg-[#4ade80]/10 animate-scan-panel" />
                    </div>

                    {mission.type === 'swap' && (
                        <SwapMissionPanel walletAddress={walletAddress} onComplete={onComplete} />
                    )}
                    {mission.type === 'streak' && (
                        <StreakMissionPanel onComplete={onComplete} />
                    )}
                    {(mission.type === 'prediction' || mission.type === 'prophecy') && (
                        <ProphecyMissionPanel walletAddress={walletAddress} onComplete={onComplete} />
                    )}
                    {!['swap', 'streak', 'prediction', 'prophecy'].includes(mission.type) && (
                        <SwapMissionPanel walletAddress={walletAddress} onComplete={onComplete} />
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes scan-panel {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(600px); }
                }
                .animate-scan-panel {
                    animation: scan-panel 4s linear infinite;
                }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-PANEL: Swap Mission
// ═══════════════════════════════════════════════════════════════

function SwapMissionPanel({ walletAddress, onComplete }: { walletAddress?: string | null; onComplete?: () => void }) {
    const [swapStatus, setSwapStatus] = useState<'idle' | 'pending' | 'success'>('idle');

    const handleOpenSwap = () => {
        // Navigate to the swap tab
        window.location.href = '/swap';
    };

    return (
        <div className="space-y-4">
            {/* Quick info grid */}
            <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[8px] text-gray-600 font-mono tracking-widest uppercase mb-1">Protocol</div>
                    <div className="text-xs font-bold text-white">Jupiter</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[8px] text-gray-600 font-mono tracking-widest uppercase mb-1">Min Value</div>
                    <div className="text-xs font-bold text-[#4ade80]">$1 USD</div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-center">
                    <div className="text-[8px] text-gray-600 font-mono tracking-widest uppercase mb-1">Network</div>
                    <div className="text-xs font-bold text-white">Solana</div>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-[#4ade80] font-mono font-bold">1</span>
                    </div>
                    <div>
                        <p className="text-xs text-white font-medium">Open the Swap Terminal</p>
                        <p className="text-[10px] text-gray-600">Navigate to the swap tab to access Jupiter</p>
                    </div>
                </div>
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-gray-500 font-mono font-bold">2</span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Execute a swap ≥ $1 USD</p>
                        <p className="text-[10px] text-gray-600">Any token pair — SOL/USDC, JUP/SOL, etc.</p>
                    </div>
                </div>
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-gray-500 font-mono font-bold">3</span>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">XP awarded automatically</p>
                        <p className="text-[10px] text-gray-600">Your swap TX is verified on-chain</p>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <button
                onClick={handleOpenSwap}
                className="w-full py-3 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-200
                           bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-black
                           hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:scale-[1.01] active:scale-[0.99]"
            >
                <span className="flex items-center justify-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Open Swap Terminal
                    <ExternalLink className="w-3 h-3 opacity-60" />
                </span>
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-PANEL: Streak Mission
// ═══════════════════════════════════════════════════════════════

function StreakMissionPanel({ onComplete }: { onComplete?: () => void }) {
    const [streakDays, setStreakDays] = useState(0);
    const [checkedIn, setCheckedIn] = useState(false);

    // Load streak from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('defi-quest-streak');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const lastCheckin = new Date(data.lastCheckin);
                const now = new Date();
                const hoursDiff = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

                if (hoursDiff < 24) {
                    setStreakDays(data.days);
                    setCheckedIn(true);
                } else if (hoursDiff < 48) {
                    setStreakDays(data.days); // Can continue streak
                } else {
                    setStreakDays(0); // Streak broken
                }
            } catch { /* ignore */ }
        }
    }, []);

    const handleCheckin = () => {
        const newDays = streakDays + 1;
        setStreakDays(newDays);
        setCheckedIn(true);
        localStorage.setItem('defi-quest-streak', JSON.stringify({
            days: newDays,
            lastCheckin: new Date().toISOString(),
        }));
        onComplete?.();
    };

    // Flame intensity based on streak
    const flameColor = streakDays >= 7 ? '#f97316' : streakDays >= 3 ? '#eab308' : '#4ade80';

    return (
        <div className="space-y-4">
            {/* Streak counter */}
            <div className="flex items-center justify-center py-4">
                <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-[30px] opacity-30"
                        style={{ background: flameColor }} />
                    <div className="relative w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center"
                        style={{ borderColor: `${flameColor}40`, background: `${flameColor}08` }}>
                        <Flame className="w-6 h-6 mb-0.5" style={{ color: flameColor }} />
                        <span className="text-2xl font-black text-white font-mono">{streakDays}</span>
                        <span className="text-[8px] text-gray-500 font-mono tracking-widest uppercase">Days</span>
                    </div>
                </div>
            </div>

            {/* Streak milestones */}
            <div className="flex justify-between px-2">
                {[3, 7, 14, 30].map(milestone => (
                    <div key={milestone} className="text-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border
                            ${streakDays >= milestone
                                ? 'bg-[#4ade80]/10 border-[#4ade80]/30 text-[#4ade80]'
                                : 'bg-white/[0.02] border-white/10 text-gray-600'}`}
                        >
                            {milestone}
                        </div>
                        <div className="text-[8px] text-gray-600 mt-1 font-mono">
                            {streakDays >= milestone ? '✓' : `${milestone}d`}
                        </div>
                    </div>
                ))}
            </div>

            {/* Check-in button */}
            <button
                onClick={handleCheckin}
                disabled={checkedIn}
                className={`w-full py-3 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-200
                    ${checkedIn
                        ? 'bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-black hover:shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:scale-[1.01] active:scale-[0.99]'
                    }`}
            >
                <span className="flex items-center justify-center gap-2">
                    {checkedIn ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" />
                            Checked In Today
                        </>
                    ) : (
                        <>
                            <Flame className="w-4 h-4" />
                            Check In — Extend Streak
                        </>
                    )}
                </span>
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// SUB-PANEL: Prophecy / Prediction Mission
// ═══════════════════════════════════════════════════════════════

function ProphecyMissionPanel({ walletAddress, onComplete }: { walletAddress?: string | null; onComplete?: () => void }) {
    const handleOpenProphecies = () => {
        window.location.href = '/prophecies';
    };

    return (
        <div className="space-y-4">
            {/* Prediction overview */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="text-[8px] text-gray-600 font-mono tracking-widest uppercase mb-1">Mechanic</div>
                    <div className="text-xs font-bold text-white">XP Staking</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Stake XP on price predictions</div>
                </div>
                <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="text-[8px] text-gray-600 font-mono tracking-widest uppercase mb-1">Rewards</div>
                    <div className="text-xs font-bold text-[#4ade80]">1.5x—3x</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Win multiplier on correct calls</div>
                </div>
            </div>

            {/* How it works */}
            <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-[#4ade80] font-mono font-bold">1</span>
                    </div>
                    <p className="text-xs text-white">Choose an active prophecy</p>
                </div>
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-gray-500 font-mono font-bold">2</span>
                    </div>
                    <p className="text-xs text-gray-400">Stake XP on your prediction (10–10,000)</p>
                </div>
                <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] text-gray-500 font-mono font-bold">3</span>
                    </div>
                    <p className="text-xs text-gray-400">Wait for deadline — Jupiter resolves via price API</p>
                </div>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-500/[0.04] border border-yellow-500/10">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/60 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-yellow-500/60 leading-relaxed">
                    Staked XP is deducted immediately. Win → get multiplied XP back. Lose → XP is gone.
                </p>
            </div>

            {/* CTA */}
            <button
                onClick={handleOpenProphecies}
                className="w-full py-3 rounded-lg font-bold text-sm tracking-wider uppercase transition-all duration-200
                           bg-gradient-to-r from-[#a855f6] to-[#7c3aed] text-white
                           hover:shadow-[0_0_30px_rgba(168,85,246,0.3)] hover:scale-[1.01] active:scale-[0.99]"
            >
                <span className="flex items-center justify-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Open Prophecy Terminal
                    <ExternalLink className="w-3 h-3 opacity-60" />
                </span>
            </button>
        </div>
    );
}
