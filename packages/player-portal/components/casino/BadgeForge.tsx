
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
        <Card className="w-full bg-black border border-green-500/30 text-green-500 overflow-hidden relative shadow-[0_0_30px_rgba(34,197,94,0.05)]">
            {/* Background Circuit FX */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <CardHeader className="relative z-10 border-b border-green-500/20 bg-black/80 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center text-xl font-bold font-display tracking-widest uppercase text-green-400">
                            <Flame className="mr-2 text-red-500 fill-red-900 animate-pulse" />
                            THE_FORGE
                        </CardTitle>
                        <CardDescription className="text-green-800 font-mono text-xs">
                            Badge Fusion Protocol v1.0. Requires 3 Inputs.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative z-10 p-0">
                <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[500px]">

                    {/* LEFT: Inventory Selection */}
                    <div className="lg:col-span-2 p-6 border-r border-green-500/20 overflow-y-auto max-h-[600px] bg-black/60 custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-green-700 font-mono">Available Assets</h3>
                            <span className="text-xs text-green-500 font-mono">[{selectedBadges.length}/3] BUFFERS_FILLED</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 p-2 pb-10">
                            {MOCK_INVENTORY.map((badge) => (
                                <div key={badge.id} className="relative">
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

                    {/* RIGHT: Forge Action Area */}
                    <div className="col-span-1 bg-black p-6 flex flex-col items-center justify-center relative bg-[url('/grid.png')]">
                        <AnimatePresence mode="wait">
                            {!result && !isForging && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center w-full max-w-xs"
                                >
                                    <h3 className="text-sm font-bold text-green-500 mb-6 uppercase tracking-[0.2em] font-mono border-b border-green-500/30 pb-2">Fusion Core</h3>

                                    {/* Slots */}
                                    <div className="flex justify-center -space-x-4 mb-8">
                                        {[0, 1, 2].map(i => (
                                            <div key={i} className={cn(
                                                "w-20 h-24 rounded border flex items-center justify-center transition-all transform z-0 relative",
                                                selectedBadges[i] ? "border-red-500 bg-red-900/10 z-10 scale-105 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-green-900 bg-black/80 border-dashed"
                                            )}>
                                                {selectedBadges[i] ? (
                                                    <Flame className="text-red-500 animate-pulse drop-shadow-md" />
                                                ) : (
                                                    <div className="text-green-900 font-mono text-xl">{`0${i + 1}`}</div>
                                                )}
                                                {/* Corner markers */}
                                                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-green-500/20" />
                                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-green-500/20" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-green-900/10 p-3 rounded border border-green-900/30 text-[10px] text-green-400 font-mono">
                                            <div className="flex justify-between mb-1">
                                                <span>PROBABILITY</span>
                                                <span className="text-green-400 font-bold">70.0%</span>
                                            </div>
                                            <div className="w-full bg-green-900/30 h-1 rounded-sm overflow-hidden">
                                                <div className="bg-green-500 w-[70%] h-full" />
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            className="w-full bg-red-600 hover:bg-red-500 text-black font-black h-14 text-lg font-display tracking-wider border border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                                            disabled={selectedBadges.length !== 3}
                                            onClick={handleForge}
                                        >
                                            <Hammer className="mr-2 h-5 w-5 fill-black" />
                                            INITIATE_FUSE
                                        </Button>
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
