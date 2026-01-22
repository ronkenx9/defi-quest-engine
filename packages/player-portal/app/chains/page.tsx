'use client';

import { useState, useEffect } from 'react';
import { Link2, CheckCircle, Circle, Trophy, Zap } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';

interface QuestChain {
    id: string;
    name: string;
    description: string;
    protocols: string[];
    bonus_xp: number;
    required_missions: number;
    missions: ChainMission[];
    progress: {
        current_step: number;
        completed: boolean;
    };
}

interface ChainMission {
    id: string;
    title: string;
    chain_order: number;
    xp_reward: number;
}

export default function QuestChainsPage() {
    const { walletAddress } = useWallet();
    const [chains, setChains] = useState<QuestChain[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChains() {
            setLoading(true);
            try {
                const url = walletAddress
                    ? `/api/quest-chains?wallet=${walletAddress}`
                    : '/api/quest-chains';
                const res = await fetch(url);
                const data = await res.json();
                setChains(data.chains || []);
            } catch (error) {
                console.error('Error fetching quest chains:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchChains();
    }, [walletAddress]);

    const getProtocolColor = (protocol: string) => {
        const colors: Record<string, string> = {
            Jupiter: '#4ade80',
            Marinade: '#f97316',
            Drift: '#3b82f6',
            Jito: '#a855f7',
        };
        return colors[protocol] || '#6b7280';
    };

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // CROSS-PROTOCOL
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">QUEST </span>
                        <span className="text-[#4ade80]">CHAINS</span>
                    </h1>
                    <p className="text-gray-400">
                        Complete multi-step quests across protocols for mega XP bonuses.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-500">Loading quest chains...</div>
                ) : chains.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No quest chains available yet.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {chains.map((chain) => {
                            const progressPercent = chain.missions.length > 0
                                ? (chain.progress.current_step / chain.missions.length) * 100
                                : 0;

                            return (
                                <div
                                    key={chain.id}
                                    className={`rounded-xl border ${chain.progress.completed
                                        ? 'border-[#4ade80] bg-[#4ade80]/10'
                                        : 'border-gray-800 bg-[#0a0f0a]'
                                        } p-6`}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link2 className="w-5 h-5 text-[#4ade80]" />
                                                <h2 className="text-xl font-bold text-white">{chain.name}</h2>
                                                {chain.progress.completed && (
                                                    <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm">{chain.description}</p>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-[#4ade80] font-bold">
                                                <Trophy className="w-4 h-4" />
                                                +{chain.bonus_xp} Bonus XP
                                            </div>
                                            <p className="text-xs text-gray-500">on completion</p>
                                        </div>
                                    </div>

                                    {/* Protocols */}
                                    <div className="flex gap-2 mb-4">
                                        {chain.protocols.map((protocol) => (
                                            <span
                                                key={protocol}
                                                className="px-3 py-1 rounded-full text-xs font-bold"
                                                style={{
                                                    backgroundColor: `${getProtocolColor(protocol)}20`,
                                                    color: getProtocolColor(protocol),
                                                }}
                                            >
                                                {protocol}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>
                                                {chain.progress.current_step}/{chain.missions.length} steps
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] transition-all"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Mission Steps */}
                                    <div className="space-y-2">
                                        {chain.missions.map((mission, idx) => {
                                            const isCompleted = idx < chain.progress.current_step;
                                            const isCurrent = idx === chain.progress.current_step;

                                            return (
                                                <div
                                                    key={mission.id}
                                                    className={`flex items-center justify-between p-3 rounded-lg ${isCompleted
                                                        ? 'bg-[#4ade80]/10 border border-[#4ade80]/30'
                                                        : isCurrent
                                                            ? 'bg-gray-800 border border-[#4ade80]/50'
                                                            : 'bg-gray-800/50 border border-gray-700'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {isCompleted ? (
                                                            <CheckCircle className="w-5 h-5 text-[#4ade80]" />
                                                        ) : isCurrent ? (
                                                            <Zap className="w-5 h-5 text-[#4ade80] animate-pulse" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-gray-600" />
                                                        )}
                                                        <span
                                                            className={`font-medium ${isCompleted
                                                                ? 'text-[#4ade80]'
                                                                : isCurrent
                                                                    ? 'text-white'
                                                                    : 'text-gray-500'
                                                                }`}
                                                        >
                                                            Step {idx + 1}: {mission.title}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        +{mission.xp_reward} XP
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!walletAddress && (
                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Connect your wallet to track quest chain progress
                    </div>
                )}
            </main>
        </div>
    );
}
