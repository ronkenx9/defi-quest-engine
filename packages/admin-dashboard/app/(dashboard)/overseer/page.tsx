'use client';

import { useState } from 'react';
import {
    Zap, Brain, Shield, Activity, ChevronRight,
    ArrowUpDown, TrendingUp, BarChart3, Sliders,
    CheckCircle2, Loader2, Package, Cpu
} from 'lucide-react';

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

// ─── Type & Difficulty configs for the control panel ───
const MISSION_TYPES = [
    { id: 'swap', label: 'Swap', icon: ArrowUpDown, color: '#4ade80', desc: 'Jupiter swap missions' },
    { id: 'streak', label: 'Streak', icon: TrendingUp, color: '#eab308', desc: 'Daily check-in targets' },
    { id: 'prediction', label: 'Prediction', icon: BarChart3, color: '#a855f6', desc: 'Prophecy market forecasts' },
];

const DIFFICULTIES = [
    { id: 'easy', label: 'Easy', color: '#4ade80' },
    { id: 'medium', label: 'Medium', color: '#3b82f6' },
    { id: 'hard', label: 'Hard', color: '#f97316' },
    { id: 'legendary', label: 'Legendary', color: '#a855f6' },
];

export default function OverseerControlPanel() {
    // AI Overseer state
    const [generating, setGenerating] = useState(false);
    const [aiThinking, setAiThinking] = useState<string[]>([]);
    const [lastMission, setLastMission] = useState<GeneratedMission | null>(null);
    const [systemState, setSystemState] = useState<SystemState | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Batch generator state
    const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['swap', 'streak', 'prediction']);
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(['easy', 'medium', 'hard', 'legendary']);
    const [batchCount, setBatchCount] = useState(5);
    const [batchGenerating, setBatchGenerating] = useState(false);
    const [batchResult, setBatchResult] = useState<{ generated: number; missions: any[]; reasoning?: string } | null>(null);
    const [batchError, setBatchError] = useState<string | null>(null);
    const [batchThinking, setBatchThinking] = useState<string[]>([]);

    // Toggle helpers
    const toggleType = (id: string) => {
        setSelectedTypes(prev =>
            prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
        );
    };
    const toggleDifficulty = (id: string) => {
        setSelectedDifficulties(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    // AI Overseer trigger
    async function triggerOverseer() {
        setGenerating(true);
        setAiThinking(['[ARCHITECT] Initializing neural network...', '[ARCHITECT] Connecting to Groq API...', '[ARCHITECT] Analyzing system parameters...']);
        setError(null);
        setLastMission(null);
        setSystemState(null);

        try {
            const response = await fetch('/api/overseer/strike', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger: 'manual' })
            });

            // Check response before parsing
            const text = await response.text();

            if (!text) {
                throw new Error('Empty response from server');
            }

            const data = JSON.parse(text);

            if (!response.ok) {
                throw new Error(data.error || 'Overseer failed to respond');
            }

            // Parse reasoning lines and display them with animation
            const lines = data.reasoning.split('\n').filter((l: string) => l.trim());
            for (let i = 0; i < lines.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 300));
                setAiThinking(prev => [...prev, lines[i]]);
            }

            setLastMission(data.mission);
            setSystemState(data.systemState);
        } catch (err) {
            console.error('Overseer failed:', err);
            setError((err as Error).message);
            setAiThinking(['[ERROR] Mission generation failed', (err as Error).message]);
        } finally {
            setGenerating(false);
        }
    }

    // Batch generator
    async function triggerBatchGenerate() {
        if (selectedTypes.length === 0 || selectedDifficulties.length === 0) {
            setBatchError('Select at least one type and one difficulty.');
            return;
        }

        setBatchGenerating(true);
        setBatchError(null);
        setBatchResult(null);
        setBatchThinking(['[OVERSEER] Initializing controlled generation...', `[OVERSEER] Constraint: types=[${selectedTypes.join(',')}], difficulties=[${selectedDifficulties.join(',')}]`]);

        try {
            const response = await fetch('/api/overseer/batch-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    types: selectedTypes,
                    difficulties: selectedDifficulties,
                    count: batchCount,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : (data.error || 'Batch generation failed');
                throw new Error(errorMessage);
            }

            // Stream reasoning lines for effect
            if (data.reasoning) {
                const lines = data.reasoning.split('\n').filter((l: string) => l.trim());
                for (let i = 0; i < Math.min(lines.length, 20); i++) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                    setBatchThinking(prev => [...prev, lines[i]]);
                }
            }

            setBatchResult({ generated: data.generated, missions: data.missions, reasoning: data.reasoning });
        } catch (err: any) {
            setBatchError(err.message || 'Batch generation failed');
        } finally {
            setBatchGenerating(false);
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

            {/* ═══════════════════════════════════════════════
                TAB SWITCHER: AI vs Manual
            ═══════════════════════════════════════════════ */}
            <div className="flex gap-2 mb-8">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all border-2 ${activeTab === 'ai'
                        ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                        : 'bg-black border-green-900/30 text-green-700 hover:border-green-600'
                        }`}
                >
                    <Brain className="w-4 h-4" />
                    AI Overseer
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider transition-all border-2 ${activeTab === 'manual'
                        ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                        : 'bg-black border-green-900/30 text-green-700 hover:border-green-600'
                        }`}
                >
                    <Sliders className="w-4 h-4" />
                    Manual Generator
                </button>
            </div>

            {/* ═══════════════════════════════════════════════
                TAB: AI OVERSEER (existing)
            ═══════════════════════════════════════════════ */}
            {activeTab === 'ai' && (
                <>
                    {/* Trigger Buttons */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4">
                        <button
                            onClick={triggerOverseer}
                            disabled={generating}
                            className={`
                                flex-1 px-8 py-4 border-2 rounded-lg font-bold text-lg md:text-xl transition-all
                                flex items-center justify-center gap-3
                                ${generating
                                    ? 'bg-red-900/50 border-red-500 text-red-400 cursor-not-allowed'
                                    : 'bg-black border-red-500 text-red-400 hover:bg-red-900/20 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]'
                                }
                            `}
                        >
                            <Zap className={`w-6 h-6 ${generating ? 'animate-spin' : ''}`} />
                            {generating ? ' API THINKING...' : '🎯 GROQ API GENERATOR'}
                        </button>

                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch('/api/prophecies/resolve', {
                                        method: 'POST'
                                    });
                                    const data = await res.json();

                                    if (data.success) {
                                        alert(`✅ Resolved ${data.resolved} prophecies\n❌ Failed: ${data.failed}`);
                                    } else {
                                        alert(`Error: ${data.error}`);
                                    }
                                } catch (error: any) {
                                    alert(`Error: ${error.message}`);
                                }
                            }}
                            className={`
                                flex-1 px-8 py-4 border-2 rounded-lg font-bold text-lg md:text-xl transition-all
                                flex items-center justify-center gap-3
                                bg-purple-900/40 border-purple-500 text-purple-400 hover:bg-purple-900/60 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]
                            `}
                        >
                            🔮 RESOLVE EXPIRED PROPHECIES
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
                                                <div className={`uppercase font-bold ${lastMission.difficulty === 'legendary' ? 'text-red-400' :
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
                </>
            )}

            {/* ═══════════════════════════════════════════════
                TAB: MANUAL GENERATOR (new)
            ═══════════════════════════════════════════════ */}
            {activeTab === 'manual' && (
                <div className="space-y-8">
                    {/* Category Selection */}
                    <div className="p-6 border-2 border-green-800 rounded-lg bg-green-950/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Package className="w-5 h-5 text-green-400" />
                            <h3 className="text-lg font-bold text-green-400">MISSION CATEGORIES</h3>
                        </div>
                        <p className="text-xs text-green-700 mb-4">Select which mission types to include in the batch. At least one required.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {MISSION_TYPES.map(type => {
                                const Icon = type.icon;
                                const isSelected = selectedTypes.includes(type.id);
                                return (
                                    <button
                                        key={type.id}
                                        onClick={() => toggleType(type.id)}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${isSelected
                                            ? 'border-green-500 bg-green-950/30 shadow-[0_0_15px_rgba(74,222,128,0.1)]'
                                            : 'border-green-900/30 bg-black hover:border-green-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-5 h-5" style={{ color: type.color }} />
                                                <span className={`font-bold uppercase tracking-wider text-sm ${isSelected ? 'text-white' : 'text-green-700'}`}>
                                                    {type.label}
                                                </span>
                                            </div>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-green-500 bg-green-500' : 'border-green-800'
                                                }`}>
                                                {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                                            </div>
                                        </div>
                                        <p className="text-xs text-green-700">{type.desc}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="p-6 border-2 border-green-800 rounded-lg bg-green-950/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-lg font-bold text-green-400">DIFFICULTY FILTER</h3>
                        </div>
                        <p className="text-xs text-green-700 mb-4">Select difficulty tiers. Missions will be randomly assigned from selected tiers.</p>

                        <div className="flex flex-wrap gap-2">
                            {DIFFICULTIES.map(diff => {
                                const isSelected = selectedDifficulties.includes(diff.id);
                                return (
                                    <button
                                        key={diff.id}
                                        onClick={() => toggleDifficulty(diff.id)}
                                        className={`px-4 py-2.5 rounded-lg border-2 font-bold uppercase tracking-wider text-sm transition-all ${isSelected
                                            ? 'shadow-[0_0_12px_rgba(74,222,128,0.1)]'
                                            : 'bg-black hover:opacity-80'
                                            }`}
                                        style={{
                                            borderColor: isSelected ? diff.color : '#1a3a1a',
                                            color: isSelected ? diff.color : '#2d5a2d',
                                            backgroundColor: isSelected ? `${diff.color}15` : 'black',
                                        }}
                                    >
                                        {isSelected && '✓ '}{diff.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Count Selector */}
                    <div className="p-6 border-2 border-green-800 rounded-lg bg-green-950/10">
                        <div className="flex items-center gap-2 mb-4">
                            <Zap className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-bold text-green-400">BATCH SIZE</h3>
                        </div>

                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={1}
                                max={25}
                                value={batchCount}
                                onChange={e => setBatchCount(parseInt(e.target.value))}
                                className="flex-1 accent-green-500 h-2 bg-green-900/30 rounded cursor-pointer"
                            />
                            <div className="w-20 text-center">
                                <input
                                    type="number"
                                    min={1}
                                    max={50}
                                    value={batchCount}
                                    onChange={e => setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="w-full bg-black border-2 border-green-800 rounded-lg px-3 py-2 text-xl font-bold text-green-400 text-center focus:border-green-500 outline-none"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-green-700 mt-2">
                            Deploying <span className="text-green-400 font-bold">{batchCount}</span> mission{batchCount !== 1 ? 's' : ''} across{' '}
                            <span className="text-green-400 font-bold">{selectedTypes.length}</span> type{selectedTypes.length !== 1 ? 's' : ''} and{' '}
                            <span className="text-green-400 font-bold">{selectedDifficulties.length}</span> difficulty tier{selectedDifficulties.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Deploy Button */}
                    <button
                        onClick={triggerBatchGenerate}
                        disabled={batchGenerating || selectedTypes.length === 0 || selectedDifficulties.length === 0}
                        className={`w-full px-8 py-5 border-2 rounded-lg font-bold text-xl transition-all flex items-center justify-center gap-3 ${batchGenerating
                            ? 'bg-green-900/30 border-green-700 text-green-600 cursor-not-allowed'
                            : selectedTypes.length === 0 || selectedDifficulties.length === 0
                                ? 'bg-black border-green-900/30 text-green-800 cursor-not-allowed'
                                : 'bg-green-900/50 border-green-500 text-green-400 hover:bg-green-800/50 hover:shadow-[0_0_30px_rgba(74,222,128,0.2)]'
                            }`}
                    >
                        {batchGenerating ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                DEPLOYING MISSIONS...
                            </>
                        ) : (
                            <>
                                <Zap className="w-6 h-6" />
                                DEPLOY {batchCount} MISSION{batchCount !== 1 ? 'S' : ''} TO DATABASE
                            </>
                        )}
                    </button>

                    {/* Batch Error */}
                    {batchError && (
                        <div className="p-4 border-2 border-red-500 rounded-lg bg-red-950/20">
                            <div className="flex items-center gap-2 text-red-400 font-bold mb-1">
                                <Shield className="w-4 h-4" /> GENERATION ERROR
                            </div>
                            <p className="text-red-300 text-sm">{batchError}</p>
                        </div>
                    )}

                    {/* AI Thinking Stream */}
                    {batchThinking.length > 0 && (
                        <div className="p-5 border-2 border-green-800 rounded-lg bg-green-950/10">
                            <div className="flex items-center gap-3 mb-3">
                                <Brain className="w-5 h-5 text-green-400 animate-pulse" />
                                <div className="font-bold text-green-400 text-sm">OVERSEER AI PROCESSING</div>
                                {batchGenerating && (
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1 font-mono text-xs max-h-[200px] overflow-y-auto">
                                {batchThinking.map((line, i) => (
                                    <div key={i} className="text-green-600">
                                        <span className="text-green-800">›</span> {line}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Batch Results */}
                    {batchResult && (
                        <div className="p-6 border-2 border-green-500 rounded-lg bg-green-950/10">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <div className="font-bold text-green-400 text-lg">
                                    {batchResult.generated} MISSION{batchResult.generated !== 1 ? 'S' : ''} DEPLOYED
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {batchResult.missions.map((m: any, i: number) => (
                                    <div key={i} className="p-3 rounded-lg bg-black/50 border border-green-900/30">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${m.type === 'swap' ? 'text-green-400 border-green-800 bg-green-950/30' :
                                                    m.type === 'streak' ? 'text-yellow-400 border-yellow-800 bg-yellow-950/30' :
                                                        'text-purple-400 border-purple-800 bg-purple-950/30'
                                                    }`}>
                                                    {m.type}
                                                </div>
                                                <span className="text-sm text-white font-bold">{m.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase ${m.difficulty === 'legendary' ? 'text-purple-400' :
                                                    m.difficulty === 'hard' ? 'text-orange-400' :
                                                        m.difficulty === 'medium' ? 'text-blue-400' :
                                                            'text-green-400'
                                                    }`}>
                                                    {m.difficulty}
                                                </span>
                                                <span className="text-yellow-400 font-bold text-sm font-mono">{m.points} XP</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] text-green-700 leading-relaxed flex-1 mr-4">{m.description}</p>
                                            {m.personality && (
                                                <span className={`text-[9px] px-2 py-0.5 rounded border font-bold tracking-wider whitespace-nowrap ${m.personality === 'The Architect' ? 'text-cyan-400 border-cyan-800' :
                                                    m.personality === 'Agent Smith' ? 'text-red-400 border-red-800' :
                                                        'text-amber-400 border-amber-800'
                                                    }`}>
                                                    {m.personality}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
