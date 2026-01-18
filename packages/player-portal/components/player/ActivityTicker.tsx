'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Trophy, Flame, Target, Gift, Star } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'swap' | 'badge' | 'streak' | 'mission' | 'glitch' | 'level';
    wallet: string;
    message: string;
    timestamp: Date;
    highlight?: boolean;
}

// Mock activity generator for demo
const ACTIVITY_TEMPLATES: Omit<ActivityItem, 'id' | 'timestamp' | 'wallet'>[] = [
    { type: 'swap', message: 'completed a swap', highlight: false },
    { type: 'badge', message: 'unlocked "The Red Pill" badge', highlight: true },
    { type: 'streak', message: 'hit a 7-day streak!', highlight: true },
    { type: 'mission', message: 'completed "First Swap" mission', highlight: false },
    { type: 'glitch', message: 'triggered a GLITCH BONUS +500 XP', highlight: true },
    { type: 'level', message: 'reached Level 5', highlight: false },
    { type: 'badge', message: 'earned "System Glitch" badge', highlight: true },
    { type: 'swap', message: 'swapped 2.5 SOL → USDC', highlight: false },
    { type: 'mission', message: 'completed "Volume Trader" quest', highlight: false },
    { type: 'glitch', message: 'got a CRITICAL HIT! 3x XP', highlight: true },
];

const MOCK_WALLETS = [
    '7xKXt...mNpq3',
    '9yLMn...kPq42',
    'Bv3Rt...jKl89',
    '4aWe2...mXp12',
    'Kj8Xn...qRt56',
    '2pLmv...nWq78',
];

function generateRandomActivity(): ActivityItem {
    const template = ACTIVITY_TEMPLATES[Math.floor(Math.random() * ACTIVITY_TEMPLATES.length)];
    const wallet = MOCK_WALLETS[Math.floor(Math.random() * MOCK_WALLETS.length)];

    return {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        wallet,
        timestamp: new Date(),
        ...template,
    };
}

const TYPE_ICONS: Record<ActivityItem['type'], React.ReactNode> = {
    swap: <Zap className="w-3.5 h-3.5" />,
    badge: <Trophy className="w-3.5 h-3.5" />,
    streak: <Flame className="w-3.5 h-3.5" />,
    mission: <Target className="w-3.5 h-3.5" />,
    glitch: <Star className="w-3.5 h-3.5" />,
    level: <Gift className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<ActivityItem['type'], string> = {
    swap: '#4ade80',
    badge: '#f59e0b',
    streak: '#f43f5e',
    mission: '#60a5fa',
    glitch: '#c084fc',
    level: '#22c55e',
};

interface ActivityTickerProps {
    /** Speed of scroll in seconds */
    speed?: number;
    /** Show live indicator */
    showLive?: boolean;
}

export function ActivityTicker({ speed = 30, showLive = true }: ActivityTickerProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    // Initialize with some activities
    useEffect(() => {
        const initial = Array.from({ length: 10 }, () => generateRandomActivity());
        setActivities(initial);
    }, []);

    // Add new activity periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setActivities(prev => {
                const newActivity = generateRandomActivity();
                // Keep last 20 activities
                return [newActivity, ...prev.slice(0, 19)];
            });
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full overflow-hidden bg-black/40 border-y border-green-500/20">
            {/* Live indicator */}
            {showLive && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-black/80 px-3 py-1 rounded-full border border-green-500/30">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-green-400 uppercase tracking-wider">LIVE</span>
                </div>
            )}

            {/* Ticker container */}
            <div
                className="flex items-center py-3 animate-ticker whitespace-nowrap"
                style={{
                    animation: `ticker ${speed}s linear infinite`,
                }}
            >
                {/* Duplicate content for seamless loop */}
                {[...activities, ...activities].map((activity, index) => (
                    <div
                        key={`${activity.id}-${index}`}
                        className={`
                            inline-flex items-center gap-2 mx-4 px-3 py-1.5 rounded-full
                            ${activity.highlight
                                ? 'bg-gradient-to-r from-green-500/20 to-transparent border border-green-500/30'
                                : 'bg-white/5'
                            }
                        `}
                    >
                        {/* Icon */}
                        <span
                            className="flex-shrink-0"
                            style={{ color: TYPE_COLORS[activity.type] }}
                        >
                            {TYPE_ICONS[activity.type]}
                        </span>

                        {/* Wallet */}
                        <span className="font-mono text-xs text-green-400 font-medium">
                            {activity.wallet}
                        </span>

                        {/* Message */}
                        <span className={`font-mono text-xs ${activity.highlight ? 'text-white' : 'text-gray-400'}`}>
                            {activity.message}
                        </span>

                        {/* Highlight glow effect */}
                        {activity.highlight && (
                            <span
                                className="w-1 h-1 rounded-full animate-pulse"
                                style={{ backgroundColor: TYPE_COLORS[activity.type] }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Gradient fade edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0a0a0f] to-transparent pointer-events-none z-[5]" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0a0a0f] to-transparent pointer-events-none z-[5]" />

            {/* CSS for animation */}
            <style jsx>{`
                @keyframes ticker {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </div>
    );
}

export default ActivityTicker;
