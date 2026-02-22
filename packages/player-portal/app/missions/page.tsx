'use client';

import { useState } from 'react';
import { Target, Activity } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import MissionCard from '@/components/player/MissionCard';
import MissionActionPanel from '@/components/player/MissionActionPanel';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { Mission } from '@defi-quest/core';
import { MatrixSounds } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissionsPage() {
    const { walletAddress } = useWallet();
    const { missions: allMissions, getMissionProgress, loading: contextLoading, startMission } = usePlayer();
    const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard' | 'legendary'>('all');
    const [activeMissionId, setActiveMissionId] = useState<string | null>(null);

    const missions = allMissions.filter((m: Mission) => filter === 'all' || (m.difficulty ?? '').toLowerCase() === filter);
    const loading = contextLoading;

    const filters = [
        { id: 'all', label: 'GLOBAL_SCAN', desc: 'All active signals' },
        { id: 'easy', label: 'INITIATE', desc: 'Low-risk data packet' },
        { id: 'medium', label: 'OPERATIVE', desc: 'Standard field ops' },
        { id: 'hard', label: 'ENFORCER', desc: 'High-intensity nodes' },
        { id: 'legendary', label: 'THE_ONE', desc: 'System-critical anomalies' }
    ] as const;

    const handleStartMission = (mission: Mission) => {
        if (activeMissionId === mission.id) {
            setActiveMissionId(null);
            return;
        }
        startMission(mission.id);
        setActiveMissionId(mission.id);
        MatrixSounds.playAction();
    };

    return (
        <div className="min-h-screen bg-[#050507] text-[#4ade80] font-mono selection:bg-[#4ade80]/30 crt-overlay overflow-x-hidden">
            <PlayerNavbar />

            <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-10">
                {/* Header / HUD */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-[#4ade80]/10 pb-8 relative">
                    <div className="absolute -bottom-px left-0 w-32 h-0.5 bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-[#4ade80] animate-pulse" />
                            <p className="text-[10px] tracking-[0.5em] font-black uppercase opacity-60">System // SECTOR_SCANNER_V4.0</p>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-white italic">
                            MISSION_<span className="text-[#4ade80]">CONTROL</span>
                        </h1>
                    </div>

                    <div className="flex gap-8">
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Signals_Detected</p>
                            <p className="text-2xl font-black text-white">{allMissions.length}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total_Potential_XP</p>
                            <p className="text-2xl font-black text-[#4ade80]">
                                {allMissions.reduce((sum: number, m: Mission) => sum + ((m as any).reward?.points || (m as any).points || 0), 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 items-start">
                    {/* Sidebar: Sector Control */}
                    <aside className="space-y-8 animate-in fade-in slide-in-from-left duration-700">
                        <div>
                            <h2 className="text-[10px] font-black tracking-[0.3em] text-gray-500 mb-4 uppercase border-b border-white/5 pb-2">
                                Sector_Navigation
                            </h2>
                            <div className="space-y-2">
                                {filters.map((f) => (
                                    <button
                                        key={f.id}
                                        onClick={() => {
                                            setFilter(f.id as any);
                                            MatrixSounds.playTick();
                                        }}
                                        className={`w-full flex flex-col items-start p-4 rounded-xl border transition-all relative group ${filter === f.id
                                            ? 'bg-[#4ade80]/10 border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                                            : 'bg-transparent border-white/5 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between w-full mb-1">
                                            <span className={`text-[10px] font-black tracking-widest ${filter === f.id ? 'text-[#4ade80]' : 'text-gray-400'}`}>
                                                {f.label}
                                            </span>
                                            {filter === f.id && <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]" />}
                                        </div>
                                        <span className="text-[9px] text-gray-600 uppercase tracking-tighter opacity-80 group-hover:opacity-100 transition-opacity">
                                            {f.desc}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Diagnostics / Extra Info */}
                        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                            <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-[#4ade80] opacity-50" />
                                <span className="text-[9px] font-black tracking-widest uppercase text-gray-400">Diag_Feed</span>
                            </div>
                            <div className="space-y-3">
                                {[1, 2].map(i => (
                                    <div key={i} className="flex gap-2">
                                        <div className="w-1 h-3 bg-[#4ade80]/20 mt-0.5" />
                                        <p className="text-[8px] text-gray-600 leading-tight uppercase font-mono">
                                            NODE_{Math.floor(Math.random() * 8999) + 1000} encrypted packet relaying successful.
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Main: Sector Grid */}
                    <div className="min-h-[600px] relative">
                        {loading ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 stagger-children">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-64 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : missions.length > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 stagger-children">
                                {missions.map((mission) => {
                                    const progressData = getMissionProgress(mission.id);
                                    const percent = progressData ? progressData.progressPercent : 0;
                                    const isActive = activeMissionId === mission.id;
                                    return (
                                        <div key={mission.id} className="flex flex-col group">
                                            <MissionCard
                                                mission={mission as any}
                                                progress={percent}
                                                walletConnected={!!walletAddress}
                                                onStart={() => handleStartMission(mission)}
                                            />
                                            <AnimatePresence>
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden bg-[#0a0c10] border-x border-b border-[#4ade80]/20 rounded-b-3xl"
                                                    >
                                                        <MissionActionPanel
                                                            mission={mission as any}
                                                            onClose={() => setActiveMissionId(null)}
                                                            walletAddress={walletAddress}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-32 text-center opacity-40">
                                <Target className="w-16 h-16 text-[#4ade80] mb-6 stroke-1 animate-pulse" />
                                <h3 className="text-xl font-black tracking-tighter text-white mb-2 uppercase">Zero Signals Found</h3>
                                <p className="text-sm max-w-xs mx-auto">Selected sector is currently silent. Re-scan alternative frequencies.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
