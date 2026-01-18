'use client';

import { Flame } from 'lucide-react';

interface XPProgressBarProps {
    currentXP: number;
    level: number;
    streak: number;
    missionsCompleted: number;
}

/**
 * XP Progress Bar with level display
 */
export default function XPProgressBar({
    currentXP,
    level,
    streak,
    missionsCompleted,
}: XPProgressBarProps) {
    // Calculate XP needed for next level (exponential curve)
    const xpForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.5, lvl - 1));
    const xpForCurrentLevel = xpForLevel(level);
    const xpForNextLevel = xpForLevel(level + 1);
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progress = Math.min((xpInCurrentLevel / xpNeeded) * 100, 100);

    return (
        <div className="p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a]">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Level Badge */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-black font-bold text-2xl shadow-[0_0_30px_rgba(74,222,128,0.4)]">
                        {level}
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Level</div>
                        <div className="text-xl font-bold text-white">
                            {level < 5 ? 'Novice' : level < 10 ? 'Operator' : level < 20 ? 'Specialist' : 'The One'}
                        </div>
                    </div>
                </div>

                {/* XP Progress */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">
                            {currentXP.toLocaleString()} XP
                        </span>
                        <span className="text-sm text-gray-500">
                            {xpForNextLevel.toLocaleString()} XP to Level {level + 1}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-2xl font-bold text-[#f59e0b]">
                            {streak}<Flame className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-gray-500">Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-[#4ade80]">
                            {missionsCompleted}
                        </div>
                        <div className="text-xs text-gray-500">Completed</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
