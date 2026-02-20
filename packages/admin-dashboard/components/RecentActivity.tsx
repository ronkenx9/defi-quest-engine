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
        <div
            className="border-2 border-[#4ade80] bg-[#000000] relative overflow-hidden flex flex-col h-full font-mono min-h-[400px]"
            style={{ clipPath: 'polygon(0 15px, 15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
        >
            {/* Tmux-style Header block */}
            <div className="flex items-center justify-between border-b-2 border-[#4ade80] bg-[#4ade80] px-4 py-1 text-black">
                <div className="flex items-center gap-2">
                    <Terminal size={14} strokeWidth={3} />
                    <span className="text-xs font-black tracking-widest uppercase">SYSLOG_MONITOR</span>
                </div>
                <div className="flex gap-2 text-[10px] font-bold">
                    <span className="px-1 border border-black bg-black text-[#4ade80]">PID:0X89</span>
                    <span className="px-1 border border-black text-black">ROOT</span>
                </div>
            </div>

            {/* Matrix Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #4ade80 2px, #4ade80 4px)'
            }}></div>

            <div className="flex-1 overflow-y-auto space-y-0.5 p-4 scrollbar-none relative z-10 text-[10px] md:text-xs">
                <div className="text-[#4ade80]/60 mb-4 select-none uppercase tracking-widest border-b border-[#4ade80]/30 pb-2 border-dashed">
                    {'>'} AUTH_ESTABLISHED: {new Date().toDateString()}<br />
                    {'>'} MATRIX_CORE v2.4.0 (MAINNET_BETA)<br />
                    {'>'} TAILING_ACTIVITY_FEED...
                </div>

                {loading ? (
                    <div className="space-y-2 animate-pulse">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-3 bg-[#4ade80]/20 w-3/4"></div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-[#4ade80]/50 italic text-xs uppercase">
                        Awaiting_Network_Events...
                        <span className="animate-pulse shadow-glow">_</span>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="group hover:bg-[#4ade80]/10 p-0.5 transition-colors flex gap-2 items-start border-l border-transparent hover:border-[#4ade80]">
                            <span className="text-[#4ade80]/50 whitespace-nowrap min-w-[50px]">{log.timestamp}</span>

                            <span className={`
                                font-bold whitespace-nowrap min-w-[55px]
                                ${log.level === 'SUCCESS' ? 'text-[#4ade80] bg-[#4ade80]/20' : ''}
                                ${log.level === 'WARN' ? 'text-yellow-400 bg-yellow-400/20' : ''}
                                ${log.level === 'INFO' ? 'text-blue-400 bg-blue-400/20' : ''}
                                ${log.level === 'ERROR' ? 'text-red-500 bg-red-500/20' : ''}
                                px-1
                            `}>
                                [{log.level}]
                            </span>

                            <span className="text-gray-300 break-all flex-1">
                                <span className="text-[#4ade80] mr-2 block sm:inline">{'>>'}</span>
                                {log.message}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#4ade80]/50 ml-2 block sm:inline">
                                    // {log.meta}
                                </span>
                            </span>
                        </div>
                    ))
                )}

                {/* Blinking cursor at the end */}
                <div className="text-[#4ade80] text-lg mt-2 font-black">
                    <span className="animate-pulse shadow-[0_0_8px_#4ade80]">_</span>
                </div>
            </div>
        </div>
    );
}
