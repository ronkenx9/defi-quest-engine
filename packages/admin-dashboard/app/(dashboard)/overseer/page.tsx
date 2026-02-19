'use client';

import { useState } from 'react';
import { Zap, Brain, Shield, Activity, ExternalLink, ChevronRight } from 'lucide-react';

interface SystemState {
    globalSuccessRate: number;
    difficulty: string;
    activePlayers: number;
    anomalyLevel: number;
}

interface GeneratedMission {
    id: string;
    name: string;
    type: string;
    difficulty: string;
    requirements: Record<string, unknown>;
    reward: {
        xp: number;
        badge?: string;
    };
    onChainAddress?: string;
}

export default function OverseerControlPanel() {
    const [generating, setGenerating] = useState(false);
    const [aiThinking, setAiThinking] = useState<string[]>([]);
    const [lastMission, setLastMission] = useState<GeneratedMission | null>(null);
    const [systemState, setSystemState] = useState<SystemState | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function triggerOverseer() {
        setGenerating(true);
        setAiThinking(['Initializing Overseer Protocol...', 'Connecting to neural network...']);
        setError(null);
        setLastMission(null);
        setSystemState(null);

        try {
            const response = await fetch('/api/overseer/strike', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Overseer failed to respond');
            }

            // Stream the reasoning lines for effect
            const lines = data.reasoning.split('\n');
            for (let i = 0; i < lines.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 300));
                setAiThinking(prev => [...prev, lines[i]]);
            }

            setLastMission(data.mission);
            setSystemState(data.systemState);

        } catch (err) {
            console.error('Overseer failed:', err);
            setError((err as Error).message);
        } finally {
            setGenerating(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono p-8">
            {/* Matrix Header */}
            <div className="mb-8 p-6 bg-green-950/20 border-2 border-green-500 rounded-lg animate-pulse">
                <div className="flex items-center gap-4 mb-2">
                    <Brain className="w-10 h-10 text-green-400" />
                    <h1 className="text-3xl font-bold text-white">
                        👁 OVERSEER CONTROL INTERFACE
                    </h1>
                </div>
                <div className="text-sm opacity-70 font-mono">
                    CLASSIFIED // LEVEL 5 ACCESS ONLY // NEURAL NETWORK ACTIVE
                </div>
            </div>

            {/* Trigger Button */}
            <div className="mb-8">
                <button
                    onClick={triggerOverseer}
                    disabled={generating}
                    className={`
                        px-8 py-4 border-2 rounded-lg font-bold text-xl transition-all
                        flex items-center gap-3
                        ${generating 
                            ? 'bg-red-900/50 border-red-500 text-red-400 cursor-not-allowed'
                            : 'bg-red-900 border-red-500 text-white hover:bg-red-800 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]'
                        }
                    `}
                >
                    <Zap className={`w-6 h-6 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? ' ARCHITECT IS THINKING...' : '🎯 TRIGGER MISSION GENERATION'}
                </button>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-8 p-6 bg-red-950/20 border-2 border-red-500 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className="w-6 h-6 text-red-400" />
                        <div className="font-bold text-red-400">SYSTEM ERROR</div>
                    </div>
                    <div className="text-red-300">{error}</div>
                </div>
            )}

            {/* Live AI Thinking Display */}
            {aiThinking.length > 0 && (
                <div className="mb-8 p-6 bg-green-950/10 border border-green-500 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <Brain className="w-6 h-6 text-green-400 animate-pulse" />
                        <div className="font-bold text-green-400">OLLAMA LLM PROCESSING</div>
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                    
                    <div className="space-y-2 font-mono text-sm">
                        {aiThinking.map((line, i) => (
                            <div 
                                key={i} 
                                className="animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <span className="text-green-600">›</span> <span className="text-green-300">{line}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* System State */}
            {systemState && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-6 border-2 border-green-500 rounded-lg bg-green-950/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-green-400" />
                            <div className="text-sm opacity-70">GLOBAL SUCCESS RATE</div>
                        </div>
                        <div className={`text-3xl font-bold ${systemState.globalSuccessRate > 60 ? 'text-red-400' : 'text-green-400'}`}>
                            {systemState.globalSuccessRate}%
                        </div>
                    </div>
                    <div className="p-6 border-2 border-yellow-500 rounded-lg bg-yellow-950/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4 text-yellow-400" />
                            <div className="text-sm opacity-70">DIFFICULTY LEVEL</div>
                        </div>
                        <div className="text-3xl font-bold text-yellow-400 uppercase">
                            {systemState.difficulty}
                        </div>
                    </div>
                    <div className="p-6 border-2 border-blue-500 rounded-lg bg-blue-950/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-blue-400" />
                            <div className="text-sm opacity-70">ACTIVE PLAYERS</div>
                        </div>
                        <div className="text-3xl font-bold text-blue-400">
                            {systemState.activePlayers}
                        </div>
                    </div>
                    <div className="p-6 border-2 border-purple-500 rounded-lg bg-purple-950/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            <div className="text-sm opacity-70">ANOMALY LEVEL</div>
                        </div>
                        <div className="text-3xl font-bold text-purple-400">
                            {systemState.anomalyLevel.toFixed(2)}x
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Mission Preview */}
            {lastMission && (
                <div className="p-6 border-2 border-green-500 rounded-lg bg-black relative overflow-hidden">
                    {/* Glow effect */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-green-500/10 rounded-full blur-[50px]"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="px-3 py-1 bg-green-900/50 border border-green-500 rounded text-sm font-bold">
                                📜 MISSION REGISTERED
                            </div>
                            <div className="text-xs text-green-600 font-mono">
                                ON-CHAIN VERIFIED
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-green-600 mb-1">MISSION NAME</div>
                                    <div className="text-xl font-bold text-white">{lastMission.name}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-green-600 mb-1">TYPE</div>
                                        <div className="text-green-300 uppercase">{lastMission.type}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-green-600 mb-1">DIFFICULTY</div>
                                        <div className={`uppercase font-bold ${
                                            lastMission.difficulty === 'legendary' ? 'text-red-400' :
                                            lastMission.difficulty === 'hard' ? 'text-yellow-400' :
                                            'text-green-400'
                                        }`}>
                                            {lastMission.difficulty}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-green-600 mb-1">MISSION ID</div>
                                    <div className="text-green-300 font-mono text-sm">{lastMission.id}</div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-green-600 mb-1">XP REWARD</div>
                                    <div className="text-3xl font-bold text-yellow-400">
                                        {lastMission.reward.xp.toLocaleString()} XP
                                    </div>
                                </div>
                                {lastMission.reward.badge && (
                                    <div>
                                        <div className="text-xs text-green-600 mb-1">BADGE</div>
                                        <div className="px-3 py-1 bg-purple-900/50 border border-purple-500 rounded text-purple-300 inline-block">
                                            🏅 {lastMission.reward.badge}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <div className="text-xs text-green-600 mb-1">REQUIREMENTS</div>
                                    <div className="text-green-300 text-sm font-mono">
                                        {JSON.stringify(lastMission.requirements, null, 2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Matrix Decorative Elements */}
            <div className="mt-12 pt-8 border-t border-green-900/50">
                <div className="text-xs text-green-700 font-mono">
                    <div className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3" />
                        SYSTEM STATUS: OPERATIONAL
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <ChevronRight className="w-3 h-3" />
                        NEURAL NETWORK: CONNECTED
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <ChevronRight className="w-3 h-3" />
                        ANOMALY PROTOCOL: ACTIVE
                    </div>
                </div>
            </div>
        </div>
    );
}
