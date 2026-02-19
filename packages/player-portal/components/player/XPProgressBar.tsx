'use client';

import { useState, useEffect } from 'react';
import { Flame, DollarSign, TrendingUp } from 'lucide-react';

interface XPProgressBarProps {
    currentXP: number;
    level: number;
    streak: number;
    missionsCompleted: number;
}

/**
 * XP Progress Bar with level display and Real-Time Economy
 */
export default function XPProgressBar({
    currentXP,
    level,
    streak,
    missionsCompleted,
}: XPProgressBarProps) {
    const [jupPrice, setJupPrice] = useState<number | null>(null);

    // Fetch real-time Jupiter pricing
    useEffect(() => {
        const fetchPricing = async () => {
            try {
                // Jupiter V6 Pricing API
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
        const interval = setInterval(fetchPricing, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Calculate XP needed for next level (exponential curve)
    const xpForLevel = (lvl: number) => Math.floor(100 * Math.pow(1.5, lvl - 1));
    const xpForCurrentLevel = xpForLevel(level);
    const xpForNextLevel = xpForLevel(level + 1);
    const xpInCurrentLevel = currentXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;
    const progress = Math.min((xpInCurrentLevel / xpNeeded) * 100, 100);

    // Economy Conversion: 10 XP = 1 JUP Equivalent Power
    const netWorthUsd = jupPrice ? ((currentXP / 10) * jupPrice).toFixed(2) : '---';

    return (
        <div className="p-6 rounded-xl border border-[#4ade80]/20 bg-gradient-to-r from-[#0a0f0a] to-[#0d140d]">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Level Badge */}
                <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center text-black font-bold text-2xl shadow-[0_0_30px_rgba(74,222,128,0.4)] overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 -skew-x-12 -ml-8" />
                        <span className="relative z-10">{level}</span>
                    </div>
                    <div>
                        <div className="text-xs text-[#4ade80] uppercase tracking-wider font-bold">Level {level}</div>
                        <div className="text-xl font-bold text-white tracking-tight">
                            {level < 5 ? 'Novice' : level < 10 ? 'Operator' : level < 20 ? 'Specialist' : 'The One'}
                        </div>
                    </div>
                </div>

                {/* XP Progress */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">
                            {currentXP.toLocaleString()} <span className="text-[#4ade80]">XP</span>
                        </span>
                        <span className="text-sm text-gray-500 font-mono">
                            {xpForNextLevel.toLocaleString()} XP Limit
                        </span>
                    </div>
                    <div className="h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative">
                        {/* Glow effect for progress bar */}
                        <div className="absolute top-0 left-0 h-full w-full bg-[#4ade80]/20 blur-md" style={{ width: `${progress}%` }} />
                        <div
                            className="relative z-10 h-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#3b82f6] rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Stats & Economy */}
                <div className="flex gap-4 md:gap-8 items-center pl-0 md:pl-4 md:border-l border-white/10">
                    <div className="text-left flex-1 min-w-[100px]">
                        <div className="flex items-center gap-1 text-sm font-bold text-[#4ade80] mb-1 tracking-wider uppercase">
                            <TrendingUp className="w-4 h-4" /> Net Worth
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">${netWorthUsd}</span>
                            {jupPrice && <span className="text-xs text-gray-500">USD</span>}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center min-w-[70px]">
                            <div className="flex items-center justify-center gap-1 text-xl font-bold text-[#f59e0b]">
                                {streak}<Flame className="w-4 h-4" />
                            </div>
                            <div className="text-[10px] uppercase text-gray-500 tracking-wider">Streak</div>
                        </div>
                        <div className="p-3 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center min-w-[70px]">
                            <div className="text-xl font-bold text-[#3b82f6]">
                                {missionsCompleted}
                            </div>
                            <div className="text-[10px] uppercase text-gray-500 tracking-wider">Missions</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
