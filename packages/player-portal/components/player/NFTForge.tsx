'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Box, Wrench, Shield, Zap, Sparkles, Check, Flame, Lock, Eye, Terminal, Cpu, BarChart3, Trash2 } from 'lucide-react';
import { MatrixSounds } from '@/lib/sounds';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { getEarnedBadges } from '@/lib/badgeStorage';

interface ForgeItem {
    id: string;
    badgeId: string;
    dbRowId?: string; // The Supabase primary key
    name: string;
    type: 'badge' | 'augment';
    image: string;
    color: string;
    description: string;
    locked: boolean;
}

export default function NFTForge() {
    const { walletAddress } = useWallet();
    const { unlockedBadges, refreshBadges } = usePlayer();
    const [equipped, setEquipped] = useState<ForgeItem[]>([]);
    const [isForging, setIsForging] = useState(false);
    const [forgeProgress, setForgeProgress] = useState(0);
    const [draggedItem, setDraggedItem] = useState<ForgeItem | null>(null);
    const isForgingOnMount = useRef(false);

    // AI Forge states
    const [isAIChanneling, setIsAIChanneling] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const [evolvedResult, setEvolvedResult] = useState<any>(null);
    const [channelType, setChannelType] = useState<'nft_variant' | 'prophecy'>('nft_variant');

    const handleAIForge = async () => {
        if (!walletAddress) return;

        setIsAIChanneling(true);
        MatrixSounds.click();

        try {
            const response = await fetch('/api/ai-forge/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: channelType,
                    walletAddress,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setAiResult(data.result);
                MatrixSounds.success();
            }
        } catch (error) {
            console.error('AI Forge Error:', error);
        } finally {
            setIsAIChanneling(false);
        }
    };

    // Matrix soul fragments and badges
    const MATRIX_FORGE_ITEMS: Omit<ForgeItem, 'locked'>[] = [
        { id: 'f1', badgeId: 'soul_alpha', name: 'Soul Fragment α', type: 'badge', image: '/badges/fragment-alpha.png', color: '#4ade80', description: 'Raw energy gathered from the void.' },
        { id: 'f2', badgeId: 'soul_beta', name: 'Soul Fragment β', type: 'badge', image: '/badges/fragment-beta.png', color: '#3b82f6', description: 'A shimmering pulse of archived data.' },
        { id: 'f3', badgeId: 'soul_gamma', name: 'Soul Fragment γ', type: 'badge', image: '/badges/fragment-gamma.png', color: '#ef4444', description: 'Violent resonance of a system glitch.' },
        { id: '1', badgeId: 'red_pill', name: 'The Red Pill', type: 'badge', image: '/badges/red-pill.png', color: '#ef4444', description: 'Awakened. First swap completed.' },
        { id: '2', badgeId: 'system_glitch', name: 'System Glitch', type: 'badge', image: '/badges/system-glitch.png', color: '#60a5fa', description: 'Volume ripple detected.' },
        { id: '3', badgeId: 'white_rabbit', name: 'White Rabbit', type: 'badge', image: '/badges/white-rabbit.png', color: '#4ade80', description: 'Followed the trail.' },
        { id: '4', badgeId: 'operator', name: 'The Operator', type: 'badge', image: '/badges/operator.png', color: '#c084fc', description: 'Automated precision.' },
        { id: '5', badgeId: 'the_one', name: 'The One', type: 'badge', image: '/badges/the-one.png', color: '#f43f5e', description: 'System compromised.' },
    ];

    // Resolve which items are unlocked
    const inventory: ForgeItem[] = MATRIX_FORGE_ITEMS.map(item => {
        // 1. Check Database (Unlocked Badges)
        const dbBadge = unlockedBadges.find(ub =>
            ub.name === item.name ||
            (item.badgeId === 'red_pill' && ub.name === 'Initiate Beacon') ||
            (item.badgeId === 'system_glitch' && ub.name === 'Morpheus Key') ||
            (item.badgeId === 'white_rabbit' && ub.name === 'Directive Fragment') ||
            (item.badgeId === 'operator' && ub.name === 'Oracle Sight') ||
            (item.badgeId === 'the_one' && ub.name === 'Void Navigator')
        );

        const isUnlockedInDb = !!dbBadge;

        // 2. Showcase / Demo Mode Fallback
        const isShowcaseMode = !walletAddress || walletAddress === '' || unlockedBadges.length === 0;
        // Generic fragments are ALWAYS unlocked for the demo
        const isForceUnlocked = isShowcaseMode || item.badgeId.startsWith('soul_');

        // 3. Check local storage
        const isEarnedLocally = walletAddress ? getEarnedBadges(walletAddress).includes(item.badgeId) : false;

        return {
            ...item,
            dbRowId: dbBadge?.id,
            locked: !isEarnedLocally && !isUnlockedInDb && !isForceUnlocked,
        };
    });

    const handleForge = async () => {
        if (equipped.length < 2) return;
        setIsForging(true);
        MatrixSounds.click();

        // Progress bar simulation (slightly faster for better UX)
        let p = 0;
        const interval = setInterval(() => {
            p += 1;
            setForgeProgress(p);
            if (p >= 100) {
                clearInterval(interval);
            }
        }, 30);

        try {
            // Call Real Backend
            const response = await fetch('/api/forge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    badgeIds: equipped.map(e => e.dbRowId).filter(Boolean)
                })
            });

            const data = await response.json();

            if (data.success) {
                MatrixSounds.success();
                setEvolvedResult(data.newBadge);
                setEquipped([]);
                if (refreshBadges) refreshBadges();
            } else {
                console.warn('Forge API error:', data.error);
                // Simulation fallback for demo if API fails or ingredients are mock
                setTimeout(() => {
                    MatrixSounds.success();
                    const ids = equipped.map(e => e.badgeId);
                    let result = {
                        name: 'Glitched Entity',
                        rarity: 'RARE',
                        image: '/badges/system-glitch.png',
                        color: '#a855f7',
                        description: 'A powerful resonance of combined fragments.'
                    };

                    if (ids.includes('soul_alpha') && ids.includes('soul_beta')) {
                        result = {
                            name: 'Nebula Shard',
                            rarity: 'EPIC',
                            image: '/badges/fragment-alpha.png',
                            color: '#22c55e',
                            description: 'A stabilized crystalline structure forged from raw void energy.'
                        };
                    } else if (ids.includes('soul_beta') && ids.includes('soul_gamma')) {
                        result = {
                            name: 'Glitch Core',
                            rarity: 'EPIC',
                            image: '/badges/fragment-beta.png',
                            color: '#6366f1',
                            description: 'A pulsating chip containing segments of the Matrix master code.'
                        };
                    } else if (ids.includes('soul_alpha') && ids.includes('soul_gamma')) {
                        result = {
                            name: 'Resonance Prism',
                            rarity: 'EPIC',
                            image: '/badges/fragment-gamma.png',
                            color: '#f43f5e',
                            description: 'A dangerous artifact that refracts the truth of the simulation.'
                        };
                    }
                    setEvolvedResult(result);
                    setEquipped([]);
                }, 1000);
            }
        } catch (error) {
            console.error('Forge Error:', error);
        } finally {
            setTimeout(() => {
                setIsForging(false);
                setForgeProgress(0);
            }, 500);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Inventory */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold tracking-widest text-gray-400">INVENTORY_ARCHIVE</h3>
                        <div className="text-[10px] font-mono text-gray-600">UNLOCKED: {inventory.filter(i => !i.locked).length}/{inventory.length}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 overflow-y-auto pr-2 no-scrollbar">
                        {inventory.map(item => {
                            const isEquipped = equipped.find(e => e.id === item.id);
                            return (
                                <div
                                    key={item.id}
                                    draggable={!isEquipped && !isForging && !item.locked}
                                    onDragStart={() => !item.locked && !isEquipped && setDraggedItem(item)}
                                    className={`
                                        relative aspect-square rounded-xl border flex items-center justify-center p-2 transition-all
                                        ${item.locked
                                            ? 'border-white/5 opacity-60 grayscale-[0.6] cursor-not-allowed'
                                            : isEquipped
                                                ? 'border-white/5 opacity-50 cursor-not-allowed'
                                                : 'border-white/10 hover:border-white/30 cursor-grab active:cursor-grabbing hover:bg-white/5'}
                                    `}
                                >
                                    {/* Lock overlay */}
                                    {item.locked && (
                                        <div className="absolute inset-0 flex items-center justify-center z-10">
                                            <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-full">
                                                <Lock className="w-3 h-3 text-gray-500" />
                                                <span className="text-[8px] font-mono text-gray-500 tracking-wider">LOCKED</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="relative w-full h-full">
                                        <Image src={item.image} alt={item.name} fill className="object-contain" />
                                    </div>

                                    {!item.locked && !isEquipped && (
                                        <div className="absolute top-1 right-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] shadow-[0_0_5px_#4ade80]" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-auto pt-4 text-[9px] font-mono text-gray-500 leading-relaxed uppercase tracking-widest">
                        Drag unlocked items into the Forge to combine their properties or generate variations.
                    </div>
                </div>

                {/* Right: The Forge & AI Overseer */}
                <div className="space-y-6">
                    {/* Manual Forge */}
                    <div className="p-6 rounded-3xl bg-[#0a0f0a] border border-[#4ade80]/20 flex flex-col h-[280px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Terminal className="w-20 h-20 text-[#4ade80]" />
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">THE_FORGE</h3>
                            <div className="px-2 py-0.5 rounded-full bg-[#4ade80]/10 text-[#4ade80] text-[8px] font-mono border border-[#4ade80]/20">v2.0.4</div>
                        </div>

                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => draggedItem && setEquipped([...equipped, draggedItem])}
                            className={`
                                flex-1 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-4 relative
                                ${isForging ? 'border-[#4ade80] bg-[#4ade80]/5' : 'border-white/5 hover:border-[#4ade80]/30'}
                            `}
                        >
                            {isForging ? (
                                <div className="flex flex-col items-center gap-3">
                                    <Zap className="w-8 h-8 text-[#4ade80] animate-pulse" />
                                    <div className="text-xs font-mono text-[#4ade80]">RESTRUCTURING_ENTITY: {forgeProgress}%</div>
                                    <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#4ade80]" style={{ width: `${forgeProgress}%` }} />
                                    </div>
                                </div>
                            ) : equipped.length > 0 ? (
                                <div className="flex gap-3">
                                    {equipped.map((item, i) => (
                                        <div key={i} className="relative group/equipped">
                                            <div className="w-16 h-16 rounded-xl border border-white/20 bg-white/5 p-2">
                                                <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                                            </div>
                                            <button
                                                onClick={() => setEquipped(equipped.filter((_, idx) => idx !== i))}
                                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center scale-0 group-hover/equipped:scale-100 transition-transform"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {equipped.length < 2 && (
                                        <div className="w-16 h-16 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-gray-600">
                                            <Box className="w-6 h-6 opacity-20" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center text-gray-600">
                                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2">Insert Soul Fragments</p>
                                    <p className="text-[8px] opacity-60">DRAP_AND_DROP_ITEMS_HERE</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleForge}
                            disabled={equipped.length === 0 || isForging}
                            className="mt-4 w-full py-4 rounded-xl bg-white text-black font-bold text-xs tracking-[0.3em] uppercase hover:bg-[#4ade80] transition-all disabled:opacity-20 flex items-center justify-center gap-2"
                        >
                            <Cpu className="w-4 h-4" /> INITIATE_FORGE
                        </button>
                    </div>

                    {/* AI Overseer Interface */}
                    <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 flex flex-col min-h-[200px] relative">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold tracking-widest text-purple-400 flex items-center gap-2">
                                <Eye className="w-4 h-4" /> OVERSEER_LINK
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setChannelType('nft_variant')}
                                    className={`px-2 py-1 rounded text-[8px] font-mono border transition-all ${channelType === 'nft_variant' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-white/10 text-gray-500'}`}
                                >
                                    NFT_VARIANT
                                </button>
                                <button
                                    onClick={() => setChannelType('prophecy')}
                                    className={`px-2 py-1 rounded text-[8px] font-mono border transition-all ${channelType === 'prophecy' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'border-white/10 text-gray-500'}`}
                                >
                                    PROPHECY
                                </button>
                            </div>
                        </div>

                        {aiResult ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-black/40 rounded-2xl border border-purple-500/20 animate-in zoom-in-95 duration-500">
                                {aiResult.type === 'nft' ? (
                                    <>
                                        <div className="relative w-24 h-24 mb-4 rounded-xl overflow-hidden border border-[#4ade80]/30 bg-[#4ade80]/5">
                                            <Image src={aiResult.image} alt={aiResult.name} fill className="object-cover" />
                                            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[8px] text-[#4ade80]">{aiResult.rarity}</div>
                                        </div>
                                        <h4 className="text-white font-bold text-sm mb-1 italic">#{aiResult.name.replace(/\s+/g, '_')}</h4>
                                        <p className="text-[10px] text-gray-400 line-clamp-2 max-w-xs">{aiResult.description}</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30">
                                            <BarChart3 className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <h4 className="text-white font-bold text-sm mb-1 italic">#{aiResult.title.replace(/\s+/g, '_')}</h4>
                                        <p className="text-[10px] text-gray-400 line-clamp-2 max-w-xs">{aiResult.description}</p>
                                    </>
                                )}
                                <button
                                    onClick={() => setAiResult(null)}
                                    className="mt-4 text-[10px] text-purple-400 underline underline-offset-4 hover:text-purple-300"
                                >
                                    CLOSE_STREAM
                                </button>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-xs text-gray-400 mb-6 italic">
                                    "Direct link to the Overseer. Channel processing power to generate rare variants or discover new prophecies..."
                                </p>
                                <button
                                    onClick={handleAIForge}
                                    disabled={isAIChanneling}
                                    className="w-full py-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs tracking-[0.2em] relative overflow-hidden transition-all disabled:opacity-50"
                                >
                                    {isAIChanneling ? 'ESTABLISHING_CHANNEL...' : 'TRIGGER_OVERSEER_AI'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Evolved Result Modal */}
            {evolvedResult && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setEvolvedResult(null)} />

                    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-[#0a0f0a] shadow-[0_0_50px_rgba(74,222,128,0.2)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                        {/* Matrix Code Rain Background (SVG) */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none">
                            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M10 0 L10 100 M30 0 L30 100 M50 0 L50 100 M70 0 L70 100 M90 0 L90 100" stroke="#4ade80" strokeWidth="0.1" strokeDasharray="1 1" className="animate-[pulse_2s_infinite]" />
                            </svg>
                        </div>

                        <div className="relative p-8 flex flex-col items-center text-center">
                            <div className="mb-6 relative">
                                <div className="absolute inset-0 bg-[#4ade80]/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative w-32 h-32 rounded-2xl border border-[#4ade80]/50 bg-black/40 p-4 shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                                    <Image src={evolvedResult.image} alt={evolvedResult.name} fill className="object-contain p-4" />
                                </div>
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#4ade80] text-black text-[10px] font-black tracking-[0.2em] rounded-full shadow-[0_0_15px_#4ade80]">
                                    {evolvedResult.rarity}
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <h2 className="text-2xl font-black text-white italic tracking-tight">
                                    {evolvedResult.name.split('').map((char: string, i: number) => (
                                        <span key={i} className="inline-block" style={{ animationDelay: `${i * 50}ms` }}>{char}</span>
                                    ))}
                                </h2>
                                <p className="text-xs text-gray-400 font-mono leading-relaxed px-4">
                                    {evolvedResult.description}
                                </p>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Type</div>
                                    <div className="text-[10px] text-white font-bold font-mono">EVOLVED_ENTITY</div>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-[8px] text-gray-500 uppercase tracking-widest mb-1">Status</div>
                                    <div className="text-[10px] text-[#4ade80] font-bold font-mono">STABILIZED</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setEvolvedResult(null)}
                                className="w-full py-4 rounded-xl bg-white text-black font-black text-xs tracking-[0.3em] uppercase hover:bg-[#4ade80] transition-all shadow-[0_4px_15px_rgba(255,255,255,0.2)]"
                            >
                                TRANSMIT_TO_ARCHIVE
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
