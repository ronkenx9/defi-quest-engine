'use client';

import { useState } from 'react';
import { ShoppingCart, Crown, Flame, Sparkles, Gem, ArrowRight, Zap, Target, Check } from 'lucide-react';
import { MatrixSounds } from '@/lib/sounds';

interface StoreItem {
    id: string;
    name: string;
    description: string;
    type: 'cosmetic' | 'augment';
    icon: any;
    color: string;
    priceUsdc: number;
    royaltyBps: number;
    creator: string;
}

const STORE_ITEMS: StoreItem[] = [
    { id: '1', name: 'Neon Visor', description: 'Legendary vision module. Grants glowing eyes in the Tavern.', type: 'cosmetic', icon: Sparkles, color: '#f0abfc', priceUsdc: 5.00, royaltyBps: 500, creator: 'Morpheus' },
    { id: '2', name: 'XP Multiplier', description: '1.2x XP Gain for the next 7 days. Stacks with streak bonus.', type: 'augment', icon: Zap, color: '#4ade80', priceUsdc: 2.50, royaltyBps: 250, creator: 'System' },
    { id: '3', name: 'Fire Shield', description: 'Prevents streak loss if you miss a daily mission.', type: 'augment', icon: Flame, color: '#f87171', priceUsdc: 1.00, royaltyBps: 100, creator: 'Oracle' },
    { id: '4', name: 'Void Crown', description: 'Exclusive cosmetic. Flex your status on the leaderboard.', type: 'cosmetic', icon: Crown, color: '#a78bfa', priceUsdc: 15.00, royaltyBps: 1000, creator: 'Trinity' },
];

export default function CosmeticsStore() {
    const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
    const [isMinting, setIsMinting] = useState(false);
    const [mintSuccess, setMintSuccess] = useState(false);

    const handleSelect = (item: StoreItem) => {
        setSelectedItem(item);
        MatrixSounds.click();
    };

    const handleMint = async () => {
        if (!selectedItem) return;

        setIsMinting(true);
        MatrixSounds.click();

        // Simulate Metaplex Core Minting + USDC payment
        setTimeout(() => {
            setIsMinting(false);
            setMintSuccess(true);
            MatrixSounds.success();

            setTimeout(() => {
                setMintSuccess(false);
                setSelectedItem(null);
            }, 3000);
        }, 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Storefront Grid */}
            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {STORE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedItem?.id === item.id;

                    return (
                        <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className={`
                                p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden group
                                ${isSelected
                                    ? 'border-[#4ade80] bg-[#4ade80]/5 shadow-[0_0_30px_rgba(74,222,128,0.1)]'
                                    : 'border-white/10 bg-black/40 hover:border-white/30 hover:bg-white/5'}
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-white/5 shadow-inner ${isSelected ? 'shadow-[0_0_15px_rgba(255,255,255,0.1)]' : ''}`}>
                                    <Icon className="w-8 h-8" style={{ color: item.color }} />
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-white font-bold text-lg">
                                        ${item.priceUsdc.toFixed(2)} <span className="text-xs text-blue-400">USDC</span>
                                    </div>
                                </div>
                            </div>

                            <h3 className="font-bold text-white mb-1 group-hover:text-[#4ade80] transition-colors">{item.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>

                            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
                                <span className={item.type === 'cosmetic' ? 'text-purple-400' : 'text-orange-400'}>
                                    {item.type}
                                </span>
                                <span className="text-gray-600">Creator: {item.creator}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Checkout / Inspection Pane */}
            <div className="col-span-1">
                <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent sticky top-24">
                    <h2 className="text-sm font-bold text-white tracking-[0.2em] mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                        <ShoppingCart className="w-4 h-4 text-[#4ade80]" />
                        INSPECTION
                    </h2>

                    {selectedItem ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="flex justify-center py-8 relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-[#4ade80]/20 to-transparent blur-2xl rounded-full opacity-50"></div>
                                <selectedItem.icon className="w-24 h-24 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" style={{ color: selectedItem.color }} />
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{selectedItem.name}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed mb-4">{selectedItem.description}</p>
                            </div>

                            <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/5">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Asset Type</span>
                                    <span className="text-white font-bold capitalize">{selectedItem.type} Plugin</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Protocol Royalties</span>
                                    <span className="text-blue-400 font-bold">{selectedItem.royaltyBps / 100}%</span>
                                </div>
                                <div className="flex justify-between text-sm pt-3 border-t border-white/10">
                                    <span className="text-gray-300 font-bold uppercase tracking-wider">Total Output</span>
                                    <span className="text-[#4ade80] font-bold">${selectedItem.priceUsdc.toFixed(2)} USDC</span>
                                </div>
                            </div>

                            <button
                                onClick={handleMint}
                                disabled={isMinting || mintSuccess}
                                className={`
                                    w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]
                                    ${mintSuccess
                                        ? 'bg-blue-500 border border-blue-400 text-white'
                                        : 'bg-[#4ade80] hover:bg-[#22c55e] text-black'}
                                    ${isMinting ? 'opacity-75 cursor-not-allowed' : ''}
                                `}
                            >
                                {isMinting ? (
                                    <span className="animate-pulse">AWAITING TX CONFIRMATION...</span>
                                ) : mintSuccess ? (
                                    <>MINTED SUCCESSFULLY <Check className="w-5 h-5" /></>
                                ) : (
                                    <>AUTHORIZE MINT <ArrowRight className="w-5 h-5" /></>
                                )}
                            </button>

                            {mintSuccess && (
                                <p className="text-xs text-center text-blue-400 font-mono mt-2 animate-fade-in-up">
                                    Plugin effectively minted to wallet via Core! 💽
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4">
                            <Gem className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                            <h3 className="text-gray-400 font-bold mb-2">NO ITEM SELECTED</h3>
                            <p className="text-xs text-gray-600">Select a cosmetic or augment from the storefront to inspect its Metaplex properties and royalties.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
