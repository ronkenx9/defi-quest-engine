'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftRight, BarChart3, Flame, DollarSign, Route, ClipboardList, Clock, Target, LucideIcon } from 'lucide-react';

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

    const handleStartMission = () => {
        if (onStart) {
            onStart();
        } else {
            // Default: navigate to swap page for swap/volume missions
            if (['swap', 'volume', 'routing'].includes(mission.type)) {
                router.push('/play/swap');
            } else {
                // For other mission types, could show a modal or navigate elsewhere
                router.push('/play/swap');
            }
        }
    };

    return (
        <div className={`
            p-5 rounded-xl border bg-[#0a0f0a] transition-all
            ${colors.border}
            hover:shadow-[0_0_20px_rgba(74,222,128,0.1)]
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-[#4ade80]" />
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} uppercase font-bold`}>
                        {mission.difficulty}
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-[#4ade80] font-bold">+{mission.points}</span>
                    <span className="text-gray-500 text-sm ml-1">XP</span>
                </div>
            </div>

            {/* Title & Description */}
            <h3 className="font-bold text-white mb-1">{mission.name}</h3>
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {mission.description || `Complete a ${mission.type} mission to earn rewards.`}
            </p>

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="text-[#4ade80]">{progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Action Button */}
            {walletConnected ? (
                <button
                    onClick={handleStartMission}
                    className="w-full py-2 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-sm font-bold hover:bg-[#4ade80]/20 transition-colors"
                >
                    {progress > 0 ? 'Continue' : 'Start Mission'}
                </button>
            ) : (
                <div className="text-center text-xs text-gray-500 py-2">
                    Connect wallet to start
                </div>
            )}
        </div>
    );
}

