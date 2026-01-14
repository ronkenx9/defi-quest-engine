'use client';

import { useState, useEffect } from 'react';
import { Loader2, Bug as GlitchIcon, Terminal, Trophy, Flame, ScrollText } from 'lucide-react';

interface Glitch {
    id: string;
    name: string;
    description: string;
    trigger_type: string;
    rarity: string;
    discovery_count?: number;
}

interface QuestChain {
    id: string;
    name: string;
    description: string;
    step_count: number;
    is_active: boolean;
}

interface Prophecy {
    id: string;
    title: string;
    deadline: string;
    status: string;
    total_staked_xp?: number;
}

export default function GamificationControlCenter() {
    const [activeTab, setActiveTab] = useState('glitches');
    const [glitches, setGlitches] = useState<Glitch[]>([]);
    const [quests, setQuests] = useState<QuestChain[]>([]);
    const [prophecies, setProphecies] = useState<Prophecy[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [glitchRes, questRes, seasonRes, prophecyRes] = await Promise.all([
                    fetch('/api/glitches?all=true'),
                    fetch('/api/quests?all=true'),
                    fetch('/api/season'),
                    fetch('/api/prophecy')
                ]);

                if (glitchRes.ok) {
                    const data = await glitchRes.json();
                    if (data.success) setGlitches(data.glitches || []);
                }

                if (questRes.ok) {
                    const data = await questRes.json();
                    if (data.success) setQuests(data.chains || []);
                }

                if (prophecyRes.ok) {
                    const data = await prophecyRes.json();
                    if (data.success) setProphecies(data.prophecies || []);
                }
            } catch (error) {
                console.error('Failed to fetch gamification data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Gamification Control</h1>
                    <p className="text-gray-400">Manage game mechanics, seasons, and rewards.</p>
                </div>
                <div className="flex gap-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">
                        System Active
                    </span>
                </div>
            </div>

            {/* Custom Tabs */}
            <div className="w-full">
                <div className="flex bg-white/5 border border-white/10 p-1 mb-6 rounded-lg overflow-x-auto">
                    {[
                        { id: 'glitches', label: 'Glitches', icon: GlitchIcon },
                        { id: 'quests', label: 'Quest Chains', icon: Terminal },
                        { id: 'prophecies', label: 'Prophecies', icon: ScrollText },
                        { id: 'season', label: 'Seasons', icon: Flame },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'bg-primary/20 text-primary shadow-sm'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* GLITCHES TAB */}
                {activeTab === 'glitches' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {glitches.map((glitch) => (
                            <div key={glitch.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/30 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-white">{glitch.name}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${getRarityColor(glitch.rarity)}`}>
                                        {glitch.rarity}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-4 h-10 line-clamp-2">{glitch.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                                    <span>Trigger: {glitch.trigger_type.toUpperCase()}</span>
                                    <span>Found: {glitch.discovery_count || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* QUESTS TAB */}
                {activeTab === 'quests' && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {quests.map((quest) => (
                            <div key={quest.id} className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-xl text-white mb-1">{quest.name}</h3>
                                    <p className="text-gray-400">{quest.description}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-sm font-medium text-gray-300">{quest.step_count} Steps</div>
                                        <div className={`text-xs ${quest.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                            {quest.is_active ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <div className={`w-2 h-2 rounded-full ${quest.is_active ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PROPHECIES TAB */}
                {activeTab === 'prophecies' && (
                    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-mono text-gray-500 border-b border-white/10 uppercase bg-white/5">
                            <div className="col-span-4">Title</div>
                            <div className="col-span-3">Deadline</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-2 text-right">Staked XP</div>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {prophecies.map((prophecy) => (
                                <div key={prophecy.id} className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors items-center text-sm">
                                    <div className="col-span-4 font-medium text-white">{prophecy.title}</div>
                                    <div className="col-span-3 text-gray-400">{new Date(prophecy.deadline).toLocaleDateString()}</div>
                                    <div className="col-span-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(prophecy.status)} bg-transparent`}>
                                            {prophecy.status}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-right font-mono text-primary">
                                        {prophecy.total_staked_xp?.toLocaleString() || 0} XP
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SEASONS TAB */}
                {activeTab === 'season' && (
                    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Season 1: The Awakening</h2>
                        <p className="text-gray-400 max-w-md mx-auto mb-6">Currently active. Ends in 42 days. Users can earn XP and climb the battle pass tiers to unlock exclusive Matrix-themed rewards.</p>
                        <div className="flex justify-center gap-4">
                            <div className="bg-black/30 px-6 py-3 rounded-xl border border-white/10">
                                <div className="text-2xl font-mono font-bold text-white">1,245</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">Participants</div>
                            </div>
                            <div className="bg-black/30 px-6 py-3 rounded-xl border border-white/10">
                                <div className="text-2xl font-mono font-bold text-primary">850k</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider">XP Distributed</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function getRarityColor(rarity: string) {
    switch (rarity) {
        case 'legendary': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
        case 'epic': return 'bg-purple-500/20 text-purple-400 border border-purple-500/50';
        case 'rare': return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
        default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/50';
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'active': return 'text-green-400 border-green-400/30';
        case 'resolved_win': return 'text-blue-400 border-blue-400/30';
        case 'resolved_lose': return 'text-red-400 border-red-400/30';
        default: return 'text-gray-400 border-gray-400/30';
    }
}
