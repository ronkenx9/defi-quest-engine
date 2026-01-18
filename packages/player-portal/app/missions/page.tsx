'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import MissionCard from '@/components/player/MissionCard';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface Mission {
    id: string;
    name: string;
    description: string;
    type: string;
    difficulty: string;
    points: number;
    is_active: boolean;
    reset_cycle: string;
}

export default function MissionsPage() {
    const { walletAddress } = useWallet();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [filter, setFilter] = useState<'all' | 'easy' | 'medium' | 'hard' | 'legendary'>('all');
    const [loading, setLoading] = useState(true);

    const fetchMissions = useCallback(async () => {
        setLoading(true);
        let query = supabase
            .from('missions')
            .select('*')
            .eq('is_active', true)
            .order('difficulty', { ascending: true });

        if (filter !== 'all') {
            query = query.eq('difficulty', filter);
        }

        const { data, error } = await query;

        if (!error) {
            setMissions(data || []);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // MISSION CONTROL
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">ACTIVE </span>
                        <span className="text-[#4ade80]">MISSIONS</span>
                    </h1>
                    <p className="text-gray-400">
                        Complete missions to earn XP and unlock NFT badges.
                    </p>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {(['all', 'easy', 'medium', 'hard', 'legendary'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${filter === f
                                    ? 'bg-[#4ade80] text-black'
                                    : 'bg-[#0a0f0a] border border-gray-700 text-gray-400 hover:border-[#4ade80]/50'
                                }
                            `}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="h-48 rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse"
                            />
                        ))}
                    </div>
                ) : missions.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {missions.map((mission) => (
                            <MissionCard
                                key={mission.id}
                                mission={mission}
                                progress={0}
                                walletConnected={!!walletAddress}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-gray-500">
                        <Target className="w-12 h-12 text-[#4ade80] mx-auto mb-4" />
                        <p>No {filter !== 'all' ? filter : ''} missions available.</p>
                    </div>
                )}

                <div className="mt-12 p-6 rounded-xl border border-[#4ade80]/10 bg-[#0a0f0a]/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-2xl font-bold text-[#4ade80]">{missions.length}</div>
                            <div className="text-xs text-gray-500">Active Missions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#22c55e]">
                                {missions.reduce((sum, m) => sum + m.points, 0).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">Total XP Available</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-yellow-400">
                                {missions.filter(m => m.difficulty === 'legendary').length}
                            </div>
                            <div className="text-xs text-gray-500">Legendary Quests</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-purple-400">
                                {missions.filter(m => m.reset_cycle === 'daily').length}
                            </div>
                            <div className="text-xs text-gray-500">Daily Missions</div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
