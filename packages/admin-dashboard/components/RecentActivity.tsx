'use client';
import { useState, useEffect } from 'react';

// Simulated live data - generates new activity items periodically
const SAMPLE_ACTIVITIES = [
    { user: '7xKJ...4pQm', action: 'Completed Mission', mission: 'Swap 1 SOL', points: '+50 XP', type: 'primary' },
    { user: '8yPL...9dRe', action: 'Joined Quest', mission: 'Liquidity Provider', type: 'neutral' },
    { user: '3mNQ...2sTr', action: 'Claimed Reward', mission: 'First Swap', points: '10 USDC', type: 'success' },
    { user: '5kRT...7wXp', action: 'Completed Mission', mission: '$100 Volume', points: '+100 XP', type: 'primary' },
    { user: '9pLM...3dQn', action: 'Started Streak', mission: '7-Day Challenge', type: 'neutral' },
    { user: '2nJK...8sVe', action: 'Claimed Reward', mission: 'Week Warrior', points: '+200 XP', type: 'success' },
    { user: '6hFG...1tRm', action: 'Completed Mission', mission: 'Price Hunter', points: '+75 XP', type: 'primary' },
    { user: '4wSD...5yBn', action: 'Joined Quest', mission: 'Jupiter Routes', type: 'neutral' },
];

const WALLET_PREFIXES = ['7xK', '8yP', '3mN', '5kR', '9pL', '2nJ', '6hF', '4wS', '1aQ', '0zW'];
const WALLET_SUFFIXES = ['4pQm', '9dRe', '2sTr', '7wXp', '3dQn', '8sVe', '1tRm', '5yBn', '6cHj', '0mKl'];

function generateRandomWallet(): string {
    const prefix = WALLET_PREFIXES[Math.floor(Math.random() * WALLET_PREFIXES.length)];
    const suffix = WALLET_SUFFIXES[Math.floor(Math.random() * WALLET_SUFFIXES.length)];
    return `${prefix}J...${suffix}`;
}

function generateTimeAgo(seconds: number): string {
    if (seconds < 60) return 'just now';
    if (seconds < 120) return '1 min ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
}

interface Activity {
    id: string;
    user: string;
    action: string;
    mission: string;
    time: string;
    points?: string;
    type: string;
    isNew?: boolean;
}

export function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);

    // Initialize with sample data
    useEffect(() => {
        const initial = SAMPLE_ACTIVITIES.slice(0, 3).map((item, idx) => ({
            ...item,
            id: `initial-${idx}`,
            time: generateTimeAgo((idx + 1) * 120), // 2, 4, 6 mins ago
        }));
        setActivities(initial);
    }, []);

    // Simulate new activity every 8-15 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const randomActivity = SAMPLE_ACTIVITIES[Math.floor(Math.random() * SAMPLE_ACTIVITIES.length)];
            const newActivity: Activity = {
                ...randomActivity,
                id: `activity-${Date.now()}`,
                user: generateRandomWallet(),
                time: 'just now',
                isNew: true,
            };

            setActivities(prev => {
                const updated = [newActivity, ...prev.slice(0, 2)];
                // Remove "isNew" flag after animation
                setTimeout(() => {
                    setActivities(current =>
                        current.map(a => ({ ...a, isNew: false }))
                    );
                }, 500);
                return updated;
            });
        }, 15000 + Math.random() * 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="card glass-card relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-bold font-display text-white">Live Feed</h3>
                <span className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
                    LIVE
                </span>
            </div>

            <div className="space-y-4 relative z-10">
                {activities.map((activity) => (
                    <ActivityItem
                        key={activity.id}
                        user={activity.user}
                        action={activity.action}
                        mission={activity.mission}
                        time={activity.time}
                        points={activity.points}
                        type={activity.type}
                        isNew={activity.isNew}
                    />
                ))}
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700"></div>
        </div>
    );
}

interface ActivityItemProps {
    user: string;
    action: string;
    mission: string;
    time: string;
    points?: string;
    type?: string;
    isNew?: boolean;
}

function ActivityItem({ user, action, mission, time, points, type = 'primary', isNew }: ActivityItemProps) {
    return (
        <div className={`
            flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 
            hover:bg-white/10 hover:border-primary/20 transition-all duration-300 
            group/item cursor-pointer
            ${isNew ? 'animate-slide-in border-primary/30 bg-primary/5' : ''}
        `}>
            <div className="flex items-center gap-4">
                <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-inner
                    ${type === 'success' ? 'bg-success/20 text-success' :
                        type === 'neutral' ? 'bg-secondary/20 text-secondary' :
                            'bg-primary/20 text-primary'}
                `}>
                    {type === 'success' ? '🎁' : type === 'neutral' ? '🚀' : '⚡'}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover/item:text-primary transition-colors">{user}</span>
                        <span className="text-xs text-gray-500">{action}</span>
                    </div>
                    <p className="text-sm text-gray-400">{mission}</p>
                </div>
            </div>
            <div className="text-right">
                {points && <div className="text-sm font-bold font-display text-primary drop-shadow-glow">{points}</div>}
                <div className="text-xs text-gray-600 font-mono">{time}</div>
            </div>
        </div>
    );
}
