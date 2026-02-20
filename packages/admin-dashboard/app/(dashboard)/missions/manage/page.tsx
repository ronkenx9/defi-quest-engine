'use client';

import { useState } from 'react';
import { Plus, Play, Pause, Pencil, Trash2, ArrowUpDown, TrendingUp, Zap, Target, BarChart3, DollarSign, Route, Loader2 } from 'lucide-react';
import { useMissions, Mission } from '@/lib/supabase-services';

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'swap': return <ArrowUpDown size={14} />;
        case 'volume': return <BarChart3 size={14} />;
        case 'streak': return <TrendingUp size={14} />;
        case 'price': return <DollarSign size={14} />;
        case 'routing': return <Route size={14} />;
        default: return <Zap size={14} />;
    }
};

export default function ManageMissionsPage() {
    const { missions, loading, error, toggleMission, deleteMission } = useMissions();
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const filteredMissions = missions.filter((m: Mission) => {
        if (filter === 'active') return m.is_active;
        if (filter === 'inactive') return !m.is_active;
        return true;
    });

    const handleToggle = async (id: string) => {
        setActionLoading(id);
        try {
            await toggleMission(id);
        } catch (err) {
            console.error('Failed to toggle mission:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this mission?')) {
            setActionLoading(id);
            try {
                await deleteMission(id);
            } catch (err) {
                console.error('Failed to delete mission:', err);
            } finally {
                setActionLoading(null);
            }
        }
    };

    if (error) {
        return (
            <div className="animate-fade-in font-mono space-y-8">
                <div className="border border-red-500 bg-red-900/10 text-center py-20 relative">
                    <div className="text-red-500 mb-4 text-4xl animate-pulse">⚠️_SYSTEM_FAULT</div>
                    <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Failed to load datalink</h3>
                    <p className="text-red-400/60 mb-8">{error.message}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase font-bold tracking-widest transition-colors">
                        Reboot_Connection
                    </button>
                    <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(239,68,68,0.05)_10px,rgba(239,68,68,0.05)_20px)]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-8 font-mono">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 mb-2 bg-[#4ade80]/10 px-2 py-1 border border-[#4ade80]/30 text-[10px] tracking-widest text-[#4ade80] uppercase">
                        DB_OPS
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Mission_Datagrid</h1>
                    <p className="text-[#4ade80]/50 lowercase">{'>>'} view and manage live ecosystem payloads</p>
                </div>
                <a href="/missions/create" className="px-6 py-2.5 bg-[#4ade80] text-[#000000] border-2 border-[#4ade80] flex items-center gap-2 font-bold uppercase tracking-widest hover:bg-[#000000] hover:text-[#4ade80] transition-colors shadow-[4px_4px_0px_#4ade80]">
                    <Plus size={18} strokeWidth={3} /> Inject_New
                </a>
            </div>

            {/* Matrix Tab Filters */}
            <div className="flex gap-0 border-b-2 border-[#4ade80]/30">
                {(['all', 'active', 'inactive'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all duration-200 border-x border-t border-transparent relative
                            ${filter === f
                                ? 'text-[#4ade80] bg-[#4ade80]/10 border-[#4ade80]/30 border-b-2 border-b-[#4ade80] -mb-[2px]'
                                : 'text-[#4ade80]/40 hover:text-[#4ade80]'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Missions Matrix Table */}
            <div
                className="bg-[#000000] border-2 border-[#4ade80] relative overflow-hidden"
                style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
            >
                <div className="absolute top-0 right-0 bg-[#4ade80] text-black text-[10px] uppercase font-bold tracking-widest px-4 border-b border-l border-black border-dashed">
                    DB_CONNECTION: SECURE
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#4ade80]">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <span className="text-xs uppercase tracking-widest animate-pulse">Querying_Nodes...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto relative z-10 pt-4">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-[#4ade80]/30 text-[10px] text-[#4ade80]/60 uppercase tracking-widest bg-[#4ade80]/5">
                                    <th className="px-6 py-4 font-normal">Mission_ID</th>
                                    <th className="px-6 py-4 font-normal">Type_Class</th>
                                    <th className="px-6 py-4 font-normal">Difficulty</th>
                                    <th className="px-6 py-4 font-normal">XP_Yield</th>
                                    <th className="px-6 py-4 font-normal">Executions</th>
                                    <th className="px-6 py-4 font-normal">Status</th>
                                    <th className="px-6 py-4 font-normal text-right">Root_Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#4ade80]/10">
                                {filteredMissions.map((mission: Mission) => mission ? (
                                    <tr key={mission.id} className="group hover:bg-[#4ade80]/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 border border-[#4ade80]/30 bg-[#4ade80]/10 flex items-center justify-center text-[#4ade80]">
                                                    <Target size={12} />
                                                </div>
                                                <span className="font-bold text-white group-hover:text-[#4ade80] transition-colors text-sm">
                                                    {mission.name ?? 'Unknown'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-2 px-2 py-1 border border-[#4ade80]/30 bg-[#000000] text-[10px] text-[#4ade80] uppercase tracking-widest">
                                                {getTypeIcon(mission.type ?? 'swap')}
                                                {mission.type ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`
                                                inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border
                                                ${mission.difficulty === 'easy' ? 'bg-green-900/20 text-green-400 border-green-500/30' : ''}
                                                ${mission.difficulty === 'medium' ? 'bg-blue-900/20 text-blue-400 border-blue-500/30' : ''}
                                                ${mission.difficulty === 'hard' ? 'bg-orange-900/20 text-orange-400 border-orange-500/30' : ''}
                                                ${mission.difficulty === 'legendary' ? 'bg-purple-900/20 text-purple-400 border-purple-500/30 shadow-[2px_2px_0px_rgba(168,85,247,0.4)]' : ''}
                                            `}>
                                                {mission.difficulty ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 font-bold text-[#4ade80]">
                                                <span className="text-[#4ade80]/50 text-xs">XP_</span>{mission.points ?? 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-[#4ade80]/60 text-sm">
                                            {(mission.completions ?? 0).toLocaleString()} <span className="text-[10px] text-gray-600 uppercase">reqs</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-2 px-2 py-0.5 text-[10px] font-bold border uppercase tracking-widest ${mission.is_active
                                                ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30'
                                                : 'bg-red-500/10 text-red-500 border-red-500/30'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-none ${mission.is_active ? 'bg-[#4ade80] animate-pulse' : 'bg-red-500'}`}></span>
                                                {mission.is_active ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleToggle(mission.id)}
                                                    disabled={actionLoading === mission.id}
                                                    className="p-1.5 border border-transparent hover:border-[#4ade80]/50 hover:bg-[#4ade80]/10 text-[#4ade80]/60 hover:text-[#4ade80] transition-colors disabled:opacity-50"
                                                    title={mission.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {actionLoading === mission.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : mission.is_active ? (
                                                        <Pause size={14} />
                                                    ) : (
                                                        <Play size={14} />
                                                    )}
                                                </button>
                                                <button
                                                    className="p-1.5 border border-transparent hover:border-blue-500/50 hover:bg-blue-500/10 text-[#4ade80]/60 hover:text-blue-500 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(mission.id)}
                                                    disabled={actionLoading === mission.id}
                                                    className="p-1.5 border border-transparent hover:border-red-500/50 hover:bg-red-500/10 text-[#4ade80]/60 hover:text-red-500 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : null)}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredMissions.length === 0 && (
                    <div className="text-center py-20 border-t border-[#4ade80]/20 bg-[#000000]">
                        <Target size={40} className="mx-auto mb-4 text-[#4ade80]/30" strokeWidth={1} />
                        <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest">Null_Query_Return</h3>
                        <p className="text-[#4ade80]/50 mb-6 text-sm">
                            {missions.length === 0
                                ? "Database empty. Inject a payload to populate the datalink."
                                : "Filter returned 0 rows. Check query parameters."}
                        </p>
                        {missions.length === 0 && (
                            <a href="/missions/create" className="inline-flex px-6 py-2 border-2 border-[#4ade80] text-[#4ade80] hover:bg-[#4ade80] hover:text-black uppercase font-bold tracking-widest text-xs transition-colors">
                                <Plus size={16} className="mr-2" strokeWidth={3} /> Inject_Genesis_Row
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
