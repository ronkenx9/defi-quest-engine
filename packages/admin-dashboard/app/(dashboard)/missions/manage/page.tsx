'use client';

import { useState } from 'react';
import { Plus, Play, Pause, Pencil, Trash2, ArrowUpDown, TrendingUp, Zap, Target, BarChart3, DollarSign, Route } from 'lucide-react';

interface Mission {
    id: string;
    name: string;
    type: string;
    difficulty: string;
    points: number;
    isActive: boolean;
    completions: number;
}

const mockMissions: Mission[] = [
    { id: '1', name: 'Swap 1 SOL to USDC', type: 'swap', difficulty: 'easy', points: 50, isActive: true, completions: 234 },
    { id: '2', name: 'Complete $100 in swaps', type: 'volume', difficulty: 'medium', points: 100, isActive: true, completions: 89 },
    { id: '3', name: 'Swap for 7 consecutive days', type: 'streak', difficulty: 'hard', points: 200, isActive: true, completions: 45 },
    { id: '4', name: 'Buy SOL when price < $100', type: 'price', difficulty: 'medium', points: 75, isActive: false, completions: 12 },
    { id: '5', name: 'Use best route for swap', type: 'routing', difficulty: 'legendary', points: 300, isActive: true, completions: 28 },
];

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
    const [missions, setMissions] = useState<Mission[]>(mockMissions);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const filteredMissions = missions.filter(m => {
        if (filter === 'active') return m.isActive;
        if (filter === 'inactive') return !m.isActive;
        return true;
    });

    const toggleMission = (id: string) => {
        setMissions(prev =>
            prev.map(m => m.id === id ? { ...m, isActive: !m.isActive } : m)
        );
    };

    const deleteMission = (id: string) => {
        if (confirm('Are you sure you want to delete this mission?')) {
            setMissions(prev => prev.filter(m => m.id !== id));
        }
    };

    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display text-white mb-2">Manage Missions</h1>
                    <p className="text-gray-400">View and manage your quest ecosystem</p>
                </div>
                <a href="/missions/create" className="btn btn-primary shadow-glow flex items-center gap-2">
                    <Plus size={18} /> Create Mission
                </a>
            </div>

            {/* Filters */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl inline-flex backdrop-blur-md">
                {(['all', 'active', 'inactive'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2.5 rounded-lg text-sm font-bold font-display transition-all duration-300 capitalize ${filter === f
                            ? 'bg-primary text-black shadow-[0_0_15px_rgba(199,242,132,0.4)] scale-105'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Missions Table */}
            <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl relative">
                {/* Decorative background glow */}
                <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Mission Name</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Type</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Difficulty</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Points</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Completions</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Status</th>
                                <th className="px-6 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredMissions.map((mission) => (
                                <tr key={mission.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                <Target size={16} />
                                            </div>
                                            <span className="font-bold text-white group-hover:text-primary transition-colors font-display">
                                                {mission.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium text-gray-300 capitalize">
                                            {getTypeIcon(mission.type)}
                                            {mission.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`
                                            inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                                            ${mission.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                            ${mission.difficulty === 'medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                                            ${mission.difficulty === 'hard' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : ''}
                                            ${mission.difficulty === 'legendary' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : ''}
                                        `}>
                                            {mission.difficulty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 font-mono font-bold text-primary">
                                            <span className="text-yellow-400">★</span> {mission.points}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-sm">
                                        {mission.completions.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${mission.isActive
                                            ? 'bg-success/10 text-success border-success/20'
                                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${mission.isActive ? 'bg-success animate-pulse' : 'bg-gray-400'}`}></span>
                                            {mission.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => toggleMission(mission.id)}
                                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                title={mission.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {mission.isActive ? <Pause size={16} /> : <Play size={16} />}
                                            </button>
                                            <button
                                                className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg text-gray-400 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => deleteMission(mission.id)}
                                                className="p-2 hover:bg-error/20 hover:text-error rounded-lg text-gray-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredMissions.length === 0 && (
                    <div className="text-center py-20">
                        <Target size={48} className="mx-auto mb-4 text-gray-600" />
                        <h3 className="text-xl font-bold text-white mb-2">No missions found</h3>
                        <p className="text-gray-500">Try adjusting your filters or create a new mission.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
