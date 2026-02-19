'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, BarChart3, Flame, DollarSign, Route, ClipboardList, Clock, Target, Shield, Eye, LucideIcon } from 'lucide-react';

interface Mission {
    id: string;
    name: string;
    description: string;
    type: string;
    difficulty: string;
    points: number;
    is_active: boolean;
}

interface MissionCardProps {
    mission: Mission;
    progress: number; // 0-100
    walletConnected: boolean;
    onStart?: () => void;
}

const difficultyColors: Record<string, { bg: string; border: string; text: string }> = {
    easy: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
    medium: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    hard: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
    legendary: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
};

const typeIcons: Record<string, LucideIcon> = {
    swap: ArrowLeftRight,
    volume: BarChart3,
    streak: Flame,
    price: DollarSign,
    routing: Route,
    limit_order: ClipboardList,
    dca: Clock,
    prediction: Eye,
    staking: Shield,
};

/**
 * Mission Card component for displaying individual missions
 */
export default function MissionCard({
    mission,
    progress = 0,
    walletConnected,
    onStart,
}: MissionCardProps) {
    const router = useRouter();
    const colors = difficultyColors[mission.difficulty] || difficultyColors.easy;
    const Icon = typeIcons[mission.type] || Target;
    const [jupPrice, setJupPrice] = useState<number | null>(null);

    // Fetch real-time Jupiter pricing
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const res = await fetch('https://api.jup.ag/price/v2?ids=JUP');
                const data = await res.json();
                if (data.data?.JUP?.price) {
                    setJupPrice(parseFloat(data.data.JUP.price));
                }
            } catch (err) {
                console.error("Failed to fetch JUP price:", err);
            }
        };
        fetchPricing();
    }, []);

    const rewardUsd = jupPrice ? ((mission.points / 10) * jupPrice).toFixed(2) : null;

    const handleStartMission = () => {
        if (onStart) {
            onStart();
        } else {
            // Default: navigate to swap page for primary types
            if (['swap', 'volume', 'routing', 'limit_order', 'dca'].includes(mission.type)) {
                router.push('/swap');
            } else {
                router.push('/swap'); // Fallback route
            }
        }
    };

    return (
        <div className={`
            p-5 rounded-xl border bg-[#0a0f0a] transition-all relative overflow-hidden group
            ${colors.border}
            hover:shadow-[0_0_30px_rgba(74,222,128,0.15)] hover:bg-[#0d140d]
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#4ade80]" />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} uppercase font-bold tracking-wider`}>
                        {mission.difficulty}
                    </span>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                        <span className="text-[#4ade80] font-bold text-lg">+{mission.points}</span>
                        <span className="text-gray-500 text-xs font-bold mt-1">XP</span>
                    </div>
                    {rewardUsd && (
                        <div className="text-xs text-green-400/80 font-mono">≈ ${rewardUsd} Value</div>
                    )}
                </div>
            </div>

            {/* Title & Description */}
            <h3 className="font-bold text-white mb-2 relative z-10 text-lg tracking-tight group-hover:text-[#4ade80] transition-colors">{mission.name}</h3>
            <p className="text-sm text-gray-400 mb-6 line-clamp-2 relative z-10 min-h-[40px]">
                {mission.description || `Complete a ${mission.type} mission to earn rewards.`}
            </p>

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="mb-4 relative z-10">
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                        <span className="text-gray-500 uppercase tracking-wider">Progress</span>
                        <span className="text-[#4ade80]">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div
                            className="h-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] transition-all duration-1000 relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute top-0 right-0 w-4 h-full bg-white/50 blur-[2px]" />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Button */}
            <div className="relative z-10 pt-2 border-t border-white/5">
                {walletConnected ? (
                    <button
                        onClick={handleStartMission}
                        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#4ade80]/10 to-[#22c55e]/5 border border-[#4ade80]/30 text-[#4ade80] text-sm font-bold hover:bg-[#4ade80]/20 hover:border-[#4ade80]/50 transition-all uppercase tracking-wider flex items-center justify-center gap-2 group/btn"
                    >
                        {progress > 0 ? 'Continue Interface' : 'Initiate Sequence'}
                        <ArrowLeftRight className="w-4 h-4 opacity-50 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all" />
                    </button>
                ) : (
                    <div className="text-center text-xs text-gray-500 py-3 uppercase tracking-wider font-bold bg-black/40 rounded-lg border border-white/5">
                        Awaiting Wallet Uplink
                    </div>
                )}
            </div>
        </div>
    );
}

