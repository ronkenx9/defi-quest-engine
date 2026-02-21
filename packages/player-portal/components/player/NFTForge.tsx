'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Box, Wrench, Shield, Zap, Sparkles, Check, Flame, Lock, Eye, Terminal, Cpu, BarChart3, Trash2 } from 'lucide-react';
import { MatrixSounds } from '@/lib/sounds';
import { useWallet } from '@/contexts/WalletContext';
import { getEarnedBadges } from '@/lib/badgeStorage';

interface ForgeItem {
    id: string;
    badgeId: string;
    name: string;
    type: 'badge' | 'augment';
    image: string;
    color: string;
    description: string;
    locked: boolean;
}

export default function NFTForge() {
    const { walletAddress } = useWallet();
    const [equipped, setEquipped] = useState<ForgeItem[]>([]);
    const [isForging, setIsForging] = useState(false);
    const [forgeProgress, setForgeProgress] = useState(0);
    const [draggedItem, setDraggedItem] = useState<ForgeItem | null>(null);
    const isForgingOnMount = useRef(false);

    // AI Forge states
    const [isAIChanneling, setIsAIChanneling] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
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

    // Matrix badge plugins — same items as the Badge Gallery
    const MATRIX_FORGE_ITEMS: Omit<ForgeItem, 'locked'>[] = [
        { id: '1', badgeId: 'red_pill', name: 'The Red Pill', type: 'badge', image: '/badges/red-pill.png', color: '#ef4444', description: 'Awakened. First swap completed.' },
        { id: '2', badgeId: 'system_glitch', name: 'System Glitch', type: 'badge', image: '/badges/system-glitch.png', color: '#60a5fa', description: 'Volume ripple detected.' },
        { id: '3', badgeId: 'white_rabbit', name: 'White Rabbit', type: 'badge', image: '/badges/white-rabbit.png', color: '#4ade80', description: 'Followed the trail.' },
        { id: '4', badgeId: 'operator', name: 'The Operator', type: 'badge', image: '/badges/operator.png', color: '#c084fc', description: 'Automated precision.' },
        { id: '5', badgeId: 'the_one', name: 'The One', type: 'badge', image: '/badges/the-one.png', color: '#f43f5e', description: 'System compromised.' },
        { id: '6', badgeId: 'escape_sim', name: 'Escape Sim', type: 'badge', image: '/badges/escape.png', color: '#ffffff', description: 'Matrix survivor.' },
    ];

    // Resolve which items are unlocked
    const earnedIds = walletAddress ? getEarnedBadges(walletAddress) : [];
    const inventory: ForgeItem[] = MATRIX_FORGE_ITEMS.map(item => ({
        ...item,
        locked: !earnedIds.includes(item.badgeId),
    }));

    const handleForge = () => {
        if (equipped.length === 0) return;
        setIsForging(true);
        MatrixSounds.click();

        // Progress bar simulation
        let p = 0;
        const interval = setInterval(() => {
            p += 2;
            setForgeProgress(p);
            if (p >= 100) {
                clearInterval(interval);
                MatrixSounds.success();
                setTimeout(() => {
                    setIsForging(false);
                    setForgeProgress(0);
                    // Add result logic here
                }, 1000);
            }
        }, 50);
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
        </div>
    );
}
