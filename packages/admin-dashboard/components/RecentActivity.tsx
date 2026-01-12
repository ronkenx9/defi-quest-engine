'use client';

import { useRecentActivity, ActivityLogEntry } from '@/lib/supabase-services';
import { Zap, Rocket, Trophy, Target, Star, Gift, CheckCircle2 } from 'lucide-react';

function formatTimeAgo(date: Date | string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 120) return '1 min ago';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

function shortenWallet(wallet: string): string {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

interface Activity {
    id: string;
    user: string;
    action: string;
    mission: string;
    time: string;
    points?: string;
    type: string;
}

// Map database action types to display info
function mapActionToDisplay(action: string): { action: string; type: string } {
    switch (action) {
        case 'mission_completed':
            return { action: 'Completed', type: 'primary' };
        case 'mission_started':
            return { action: 'Started', type: 'neutral' };
        case 'streak_updated':
            return { action: 'Streak', type: 'neutral' };
        default:
            return { action: action, type: 'neutral' };
    }
}

export function RecentActivity() {
    const { activity: dbActivity, loading, error } = useRecentActivity(5);

    // Convert DB activity to display format
    const activities: Activity[] = dbActivity.map((entry: ActivityLogEntry) => {
        const { action, type } = mapActionToDisplay(entry.action);
        return {
            id: entry.id,
            user: shortenWallet(entry.wallet_address),
            action,
            mission: entry.mission?.name || 'Quest',
            time: formatTimeAgo(entry.created_at),
            points: entry.details?.points ? `+${entry.details.points} XP` : undefined,
            type,
        };
    });

    const hasData = activities.length > 0;

    return (
        <div className="card glass-card relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-xl font-bold font-display text-white">Activity</h3>
                {hasData && (
                    <span className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-primary shadow-glow"></span>
                        LIVE
                    </span>
                )}
            </div>

            {loading ? (
                <div className="space-y-4 relative z-10">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                                    <div className="h-3 w-32 bg-white/5 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="text-center py-8 relative z-10">
                    <p className="text-gray-500 text-sm">Failed to load activity</p>
                </div>
            ) : !hasData ? (
                <div className="text-center py-8 relative z-10">
                    <div className="text-3xl mb-3 opacity-50"><Target size={32} /></div>
                    <p className="text-gray-500 text-sm">No activity yet</p>
                    <p className="text-gray-600 text-xs mt-1">Activity will appear when users complete missions</p>
                </div>
            ) : (
                <div className="space-y-3 relative z-10">
                    {activities.map((activity) => (
                        <ActivityItem
                            key={activity.id}
                            user={activity.user}
                            action={activity.action}
                            mission={activity.mission}
                            time={activity.time}
                            points={activity.points}
                            type={activity.type}
                        />
                    ))}
                </div>
            )}

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
}

function ActivityItem({ user, action, mission, time, points, type = 'primary' }: ActivityItemProps) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/20 transition-all duration-300 group/item">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`
                    w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0
                    ${type === 'neutral' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}
                `}>
                    {type === 'neutral' ? <Rocket size={16} /> : <Zap size={16} />}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white group-hover/item:text-primary transition-colors truncate">{user}</span>
                        <span className="text-xs text-gray-500">{action}</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{mission}</p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
                {points && <div className="text-sm font-bold font-display text-primary">{points}</div>}
                <div className="text-xs text-gray-600 font-mono">{time}</div>
            </div>
        </div>
    );
}
