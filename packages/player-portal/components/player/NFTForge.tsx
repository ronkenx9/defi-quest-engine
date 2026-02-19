'use client';

import { useState } from 'react';
import { Box, Wrench, Shield, Zap, Sparkles, Check, Flame } from 'lucide-react';
import { MatrixSounds } from '@/lib/sounds';

interface ForgeItem {
    id: string;
    name: string;
    type: 'cosmetic' | 'augment';
    icon: any;
    color: string;
    description: string;
}

const DUMMY_INVENTORY: ForgeItem[] = [
    { id: '1', name: 'Neon Visor', type: 'cosmetic', icon: Sparkles, color: '#f0abfc', description: 'Legendary vision.' },
    { id: '2', name: 'XP Multiplier', type: 'augment', icon: Zap, color: '#4ade80', description: '1.2x XP Gain' },
    { id: '3', name: 'Fire Shield', type: 'augment', icon: Shield, color: '#f87171', description: 'Prevents streak loss' },
    { id: '4', name: 'Cyber Core', type: 'cosmetic', icon: Box, color: '#3b82f6', description: 'Base matrix core' },
];

export default function NFTForge() {
    const [equipped, setEquipped] = useState<ForgeItem | null>(null);
    const [isForging, setIsForging] = useState(false);
    const [forgeSuccess, setForgeSuccess] = useState(false);
    const [draggedItem, setDraggedItem] = useState<ForgeItem | null>(null);

    const handleDragStart = (e: React.DragEvent, item: ForgeItem) => {
        setDraggedItem(item);
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'copyMove';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem) return;

        setIsForging(true);
        setForgeSuccess(false);
        MatrixSounds.click();

        // Simulate Metaplex Core update
        setTimeout(() => {
            setEquipped(draggedItem);
            setIsForging(false);
            setForgeSuccess(true);
            MatrixSounds.success();

            setTimeout(() => setForgeSuccess(false), 3000);
        }, 1500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* The Forge Anvil (Target) */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
                <div className="absolute top-0 right-0 p-4">
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest">METAPLEX CORE // V1.0</div>
                </div>

                <div
                    className={`
                        w-48 h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all duration-300 relative z-10
                        ${isForging ? 'border-[#4ade80] bg-[#4ade80]/10 shadow-[0_0_30px_rgba(74,222,128,0.2)]' : 'border-white/20 bg-black/40'}
                        ${forgeSuccess ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.3)]' : ''}
                        ${draggedItem ? 'hover:border-[#4ade80] hover:bg-white/5' : ''}
                    `}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {isForging ? (
                        <>
                            <Wrench className="w-12 h-12 text-[#4ade80] animate-spin-slow" />
                            <div className="text-sm font-bold tracking-widest text-[#4ade80] animate-pulse uppercase">Forging Asset...</div>
                        </>
                    ) : equipped ? (
                        <>
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/80 px-2 py-1 rounded text-[10px] border border-white/10 text-gray-400">
                                <Shield className="w-3 h-3 text-[#3b82f6]" /> COMPOSABLE
                            </div>
                            <equipped.icon className="w-16 h-16" style={{ color: equipped.color }} />
                            <div className="text-center mt-2">
                                <div className="font-bold text-white uppercase tracking-wider">{equipped.name}</div>
                                <div className="text-xs text-blue-400 font-mono">NFT Updated</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <Box className="w-12 h-12 text-gray-600" />
                            <div className="text-sm font-bold tracking-widest text-gray-500 uppercase text-center px-4">
                                Drag Asset Here to Equip
                            </div>
                        </>
                    )}
                </div>

                {forgeSuccess && (
                    <div className="absolute bottom-6 flex items-center gap-2 text-blue-400 text-sm font-bold bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 animate-fade-in-up">
                        <Check className="w-4 h-4" /> Plugin Attached successfully!
                    </div>
                )}
            </div>

            {/* Inventory (Source) */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-bold tracking-[0.2em] mb-6 text-white flex items-center gap-2 uppercase">
                    <Flame className="w-4 h-4 text-[#4ade80]" />
                    Available Plugins
                </h3>

                <div className="grid grid-cols-2 gap-4">
                    {DUMMY_INVENTORY.map((item) => {
                        const Icon = item.icon;
                        const isEquipped = equipped?.id === item.id;
                        return (
                            <div
                                key={item.id}
                                draggable={!isEquipped && !isForging}
                                onDragStart={(e) => handleDragStart(e, item)}
                                onDragEnd={() => setDraggedItem(null)}
                                className={`
                                    p-4 rounded-xl border flex flex-col items-center justify-center gap-3 text-center transition-all bg-black/40
                                    ${isEquipped
                                        ? 'border-white/5 opacity-50 cursor-not-allowed'
                                        : 'border-white/10 hover:border-white/30 cursor-grab active:cursor-grabbing hover:bg-white/5'}
                                `}
                            >
                                <Icon className="w-8 h-8" style={{ color: isEquipped ? '#6b7280' : item.color }} />
                                <div>
                                    <div className="text-xs font-bold text-white uppercase tracking-wider">{item.name}</div>
                                    <div className="text-[10px] text-gray-500">{item.description}</div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <p className="text-xs text-gray-500 mt-6 text-center italic">
                    All items are NFTs composed onto your core Player Profile via Metaplex Core Plugins.
                </p>
            </div>
        </div>
    );
}
