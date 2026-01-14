'use client';

import { useRecentActivity, ActivityLogEntry } from '@/lib/supabase-services';
import { Terminal, ShieldAlert, CheckCircle, Activity, Hash, Clock } from 'lucide-react';

function formatTimeLog(date: Date | string): string {
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

interface LogEntry {
    id: string;
    timestamp: string;
    level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR';
    message: string;
    meta: string;
}

export function RecentActivity() {
    const { activity: dbActivity, loading, error } = useRecentActivity(7);

    // Convert DB activity to log format
    const logs: LogEntry[] = dbActivity.map((entry: ActivityLogEntry) => {
        let level: LogEntry['level'] = 'INFO';
        let message = `Unknown action by ${entry.wallet_address.slice(0, 6)}`;

        switch (entry.action) {
            case 'mission_completed':
                level = 'SUCCESS';
                message = `Mission complete: ${entry.mission?.name || 'Unknown Protocol'}`;
                break;
            case 'mission_started':
                level = 'INFO';
                message = `Initiated sequence: ${entry.mission?.name}`;
                break;
            case 'streak_updated':
                level = 'WARN';
                message = `Streak verified. Consistency check passed.`;
                break;
            default:
                message = `System event: ${entry.action.toUpperCase()}`;
        }

        return {
            id: entry.id,
            timestamp: formatTimeLog(entry.created_at),
            level,
            message,
            meta: `ADDR: ${entry.wallet_address.slice(0, 6)}...${entry.wallet_address.slice(-4)}`
        };
    });

    return (
        <div className="card border border-green-900/50 bg-[#050905] relative overflow-hidden flex flex-col h-full font-mono min-h-[400px]">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-green-900/50 pb-3 mb-2 bg-[#0a110a] -mx-6 -mt-6 px-6 py-3">
                <div className="flex items-center gap-2 text-green-500">
                    <Terminal size={14} />
                    <span className="text-xs font-bold tracking-widest uppercase">SYSTEM_LOGS.sh</span>
                </div>
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
            </div>

            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-20 bg-[length:100%_2px,3px_100%] opacity-20"></div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent relative z-10" style={{ fontFamily: "'Fira Code', monospace" }}>
                <div className="text-[10px] text-green-700 mb-4 select-none">
                    Last login: {new Date().toDateString()} on ttys002<br />
                    Matrix Protocol v2.4.0-release (solana-mainnet)<br />
                    System check: COMPROMISED<br />
                    ----------------------------------------
                </div>

                {loading ? (
                    <div className="space-y-1 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 bg-green-900/10 rounded w-3/4"></div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-green-600/50 text-xs italic">
                        No recent system events captured. Waiting for input...
                        <span className="animate-pulse">_</span>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="text-xs group hover:bg-green-900/10 p-1 rounded transition-colors flex gap-3 items-start">
                            <span className="text-green-700 whitespace-nowrap min-w-[60px]">{log.timestamp}</span>

                            <span className={`
                                font-bold whitespace-nowrap min-w-[60px]
                                ${log.level === 'SUCCESS' ? 'text-green-400' : ''}
                                ${log.level === 'WARN' ? 'text-yellow-500' : ''}
                                ${log.level === 'INFO' ? 'text-blue-400' : ''}
                                ${log.level === 'ERROR' ? 'text-red-500' : ''}
                            `}>
                                [{log.level}]
                            </span>

                            <span className="text-gray-300 break-all">
                                <span className="text-green-500 mr-2">$</span>
                                {log.message}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 ml-2 text-[10px]">
                                    // {log.meta}
                                </span>
                            </span>
                        </div>
                    ))
                )}

                {/* Blinking cursor at the end */}
                <div className="text-green-500 text-xs mt-2 pl-20">
                    <span className="animate-pulse">_</span>
                </div>
            </div>

            <div className="absolute inset-0 bg-green-500/5 pointer-events-none z-0 mix-blend-overlay"></div>
        </div>
    );
}
