
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BadgeForge, createBadgeForge, FORGE_RULES } from '@defi-quest/core';
import { Flame, Hammer, AlertTriangle, RefreshCw, Zap, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeCard, BadgeRarity } from './BadgeCard';

// Mock data
const MOCK_INVENTORY = [
    { id: '1', name: 'Swapper', rarity: 'common' as BadgeRarity, xp: 50, level: 1 },
    { id: '2', name: 'Volume', rarity: 'common' as BadgeRarity, xp: 50, level: 1 },
    { id: '3', name: 'Liquidity', rarity: 'common' as BadgeRarity, xp: 50, level: 1 },
    { id: '4', name: 'Degen', rarity: 'rare' as BadgeRarity, xp: 200, level: 2 },
    { id: '5', name: 'Whale', rarity: 'rare' as BadgeRarity, xp: 200, level: 2 },
    { id: '6', name: 'Sniper', rarity: 'common' as BadgeRarity, xp: 50, level: 1 },
    { id: '7', name: 'Holder', rarity: 'common' as BadgeRarity, xp: 50, level: 1 },
    { id: '8', name: 'Gem', rarity: 'rare' as BadgeRarity, xp: 200, level: 1 },
];

export function BadgeForgeComponent() {
    const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
    const [isForging, setIsForging] = useState(false);
    const [result, setResult] = useState<'success' | 'failure' | null>(null);
    const [newBadge, setNewBadge] = useState<any>(null);

    const toggleBadge = (id: string) => {
        if (selectedBadges.includes(id)) {
            setSelectedBadges(prev => prev.filter(b => b !== id));
        } else {
            if (selectedBadges.length < 3) {
                setSelectedBadges(prev => [...prev, id]);
            }
        }
    };

    const handleForge = async () => {
        if (selectedBadges.length !== 3) return;

        setIsForging(true);
        setResult(null);
        await new Promise(resolve => setTimeout(resolve, 3000));

        const success = Math.random() > 0.4;

        if (success) {
            setResult('success');
            setNewBadge({ name: 'Platinum Core', rarity: 'legendary', xp: 1000, level: 1 });
        } else {
            setResult('failure');
        }

        setIsForging(false);
    };

    const resetForge = () => {
        setSelectedBadges([]);
        setResult(null);
        setNewBadge(null);
    };

    return (
        <Card className="w-full bg-black border-y-4 border-x-0 border-green-900/50 text-green-500 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-none">
            {/* Background Circuit FX & Scanlines */}
            <div className="absolute inset-0 pointer-events-none opacity-20"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #22c55e 2px, #22c55e 4px)', backgroundSize: '100% 4px' }}
            />
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] z-0" />

            <CardHeader className="relative z-10 border-b border-green-500/20 bg-black/90 backdrop-blur-md pb-8">
                <div className="flex justify-center items-center">
                    <div className="text-center">
                        <CardTitle className="flex items-center justify-center text-3xl font-black font-display tracking-[0.3em] uppercase text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                            <Flame className="mr-4 h-8 w-8 text-red-500 fill-red-900 animate-pulse" />
                            THE CORE FORGE
                            <Flame className="ml-4 h-8 w-8 text-red-500 fill-red-900 animate-pulse" />
                        </CardTitle>
                        <CardDescription className="text-red-900/80 font-mono text-xs mt-2 uppercase tracking-[0.2em]">
                            Danger: Synthesis protocol active. Proceed with caution.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[600px]">

                    {/* LEFT: Inventory Selection (Takes up 3/5 of width) */}
                    <div className="lg:col-span-3 p-6 xl:p-10 border-r border-green-900/50 overflow-y-auto max-h-[700px] bg-[#050f08] custom-scrollbar shadow-inner">
                        <div className="flex justify-between items-center mb-6 pb-4 border-b border-green-900/30">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-green-600 font-mono flex items-center gap-2">
                                <Zap className="w-4 h-4" /> ASSET DATABASE
                            </h3>
                            <span className="text-xs text-green-400 font-mono bg-green-900/20 px-3 py-1 border border-green-500/20">
                                [{selectedBadges.length}/3] SELECTIONS
                            </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                            {MOCK_INVENTORY.map((badge) => (
                                <div key={badge.id} className="relative group">
                                    <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/10 transition-colors pointer-events-none z-10" />
                                    <BadgeCard
                                        {...badge}
                                        isSelected={selectedBadges.includes(badge.id)}
                                        onSelect={() => toggleBadge(badge.id)}
                                        isSelectable={!isForging && !result}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Forge Action Area (Takes up 2/5 of width) */}
                    <div className="lg:col-span-2 bg-[#0a0505] p-6 flex flex-col items-center justify-center relative overflow-hidden">
                        {/* Danger zone grid overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-screen"
                            style={{ backgroundImage: 'linear-gradient(rgba(239, 68, 68, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                        />

                        <AnimatePresence mode="wait">
                            {!result && !isForging && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center w-full max-w-md relative z-10"
                                >
                                    <h3 className="text-xl font-black text-red-500 mb-10 uppercase tracking-[0.4em] font-mono border-b border-red-900/50 pb-4 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                                        FUSION CORE
                                    </h3>

                                    {/* Oversized Brusk Slots */}
                                    <div className="flex justify-center gap-4 xl:gap-6 mb-12">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className={cn(
                                                "w-24 h-32 sm:w-28 sm:h-40 flex items-center justify-center transition-all duration-500 relative bg-black",
                                                selectedBadges[i] ? "border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.5)] scale-110 z-10" : "border border-red-900/30 border-dashed"
                                            )}>
                                                {selectedBadges[i] ? (
                                                    <Flame className="w-12 h-12 text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,1)]" />
                                                ) : (
                                                    <div className="text-red-900/40 font-mono text-3xl font-black">{`0${i + 1}`}</div>
                                                )}

                                                {/* Cyberpunk Bracket Corners */}
                                                <div className={cn("absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2", selectedBadges[i] ? "border-white" : "border-red-900/50")} />
                                                <div className={cn("absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2", selectedBadges[i] ? "border-white" : "border-red-900/50")} />
                                                <div className={cn("absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2", selectedBadges[i] ? "border-white" : "border-red-900/50")} />
                                                <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2", selectedBadges[i] ? "border-white" : "border-red-900/50")} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-6 w-full px-4">
                                        <div className="bg-red-900/10 p-4 border-l-4 border-red-600 text-[10px] text-red-400 font-mono flex items-center justify-between">
                                            <span className="tracking-[0.2em]">SUCCESS PROBABILITY</span>
                                            <span className="text-red-500 font-black text-sm">70.0%</span>
                                        </div>

                                        <button
                                            className={cn(
                                                "w-full h-20 bg-red-600 text-black font-black text-xl sm:text-2xl tracking-[0.3em] uppercase transition-all flex items-center justify-center relative group overflow-hidden border-4 border-transparent",
                                                selectedBadges.length === 3
                                                    ? "hover:bg-red-500 hover:border-white shadow-[0_0_30px_rgba(239,68,68,0.6)] cursor-pointer"
                                                    : "opacity-50 cursor-not-allowed saturate-0"
                                            )}
                                            disabled={selectedBadges.length !== 3}
                                            onClick={handleForge}
                                        >
                                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                                            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer" />
                                            <Hammer className="mr-3 h-6 w-6 fill-black" />
                                            INITIATE_FUSE
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {isForging && (
                                <motion.div
                                    key="forging"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20"
                                >
                                    <Cpu className="h-16 w-16 text-red-500 animate-pulse mb-4" />
                                    <h3 className="text-2xl font-black animate-pulse text-red-500 font-display tracking-widest">COMPILING...</h3>
                                    <div className="text-xs font-mono text-red-900 mt-2">Do not close window</div>
                                </motion.div>
                            )}

                            {result === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center w-full"
                                >
                                    <div className="mb-6 relative inline-block">
                                        <div className="absolute inset-0 bg-yellow-500/20 blur-2xl opacity-50 animate-pulse" />
                                        <BadgeCard {...newBadge} id="new" />
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-2 italic font-display">SUCCESS!</h3>
                                    <p className="text-green-600 mb-6 text-xs font-mono">New asset generated.</p>

                                    <Button onClick={resetForge} variant="outline" className="w-full border-green-500/30 hover:bg-green-900/20 text-green-400 font-mono">
                                        <RefreshCw className="mr-2 h-4 w-4" /> RESTART
                                    </Button>
                                </motion.div>
                            )}

                            {result === 'failure' && (
                                <motion.div
                                    key="failure"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center w-full"
                                >
                                    <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                                    <h3 className="text-2xl font-black text-red-600 mb-2 font-display">FAILURE</h3>
                                    <p className="text-red-900 mb-6 text-xs font-mono">Input material destroyed.</p>

                                    <Button onClick={resetForge} variant="outline" className="w-full border-red-900/30 hover:bg-red-900/10 text-red-500 font-mono">
                                        <RefreshCw className="mr-2 h-4 w-4" /> RETRY
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
