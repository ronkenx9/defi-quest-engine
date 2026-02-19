
import { useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dices, Ticket, Loader2, Binary } from 'lucide-react';

const REWARDS = [
    { id: 1, label: '2x MULTIPLIER', color: '#4ade80' }, // green-400
    { id: 2, label: '100 SOL', color: '#facc15' }, // yellow-400
    { id: 3, label: 'COMMON_DATA', color: '#94a3b8' }, // slate-400
    { id: 4, label: 'NULL_VOID', color: '#ef4444' }, // red-500
    { id: 5, label: 'RARE_DATA', color: '#a855f7' }, // purple-500
    { id: 6, label: '500 USDC', color: '#22c55e' }, // green-500
    { id: 7, label: 'NULL_VOID', color: '#ef4444' }, // red-500
    { id: 8, label: 'EPIC_DATA', color: '#fca5a5' }, // red-300
];

export function BadgeRouletteComponent() {
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const controls = useAnimation();

    const spinWheel = async () => {
        setIsSpinning(true);
        setResult(null);

        // Random rotation logic
        const segmentAngle = 360 / REWARDS.length;
        const randomSegment = Math.floor(Math.random() * REWARDS.length);
        const spins = 5;
        const rotateAmount = (spins * 360) + (randomSegment * segmentAngle);

        await controls.start({
            rotate: rotateAmount,
            transition: { duration: 4, ease: "circOut" }
        });

        const winningIndex = (REWARDS.length - randomSegment) % REWARDS.length;
        setResult(REWARDS[winningIndex].label);
        setIsSpinning(false);
    };

    return (
        <Card className="w-full max-w-md bg-black border border-green-500/30 text-green-500 mx-auto relative overflow-hidden group">
            {/* Matrix Background */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(34,197,94,0.1)_95%)] bg-[length:100%_4px] pointer-events-none" />

            <CardHeader className="text-center relative z-10 border-b border-green-500/20">
                <CardTitle className="flex items-center justify-center text-xl text-green-400 font-display tracking-widest uppercase">
                    <Binary className="mr-2 h-5 w-5" /> RNG_Roulette
                </CardTitle>
                <CardDescription className="text-green-800 font-mono text-xs">
                    Input 1x Rare Badge. Output Unknown.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-8">
                <div className="relative w-64 h-64 mb-8">
                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <div className="w-6 h-6 rotate-45 bg-green-500 border-2 border-black transform origin-center shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
                    </div>

                    {/* Wheel */}
                    <motion.div
                        animate={controls}
                        className="w-full h-full rounded-full border-4 border-green-900 bg-black relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                        style={{ transformOrigin: 'center' }}
                    >
                        {REWARDS.map((reward, index) => {
                            const rotation = (360 / REWARDS.length) * index;
                            return (
                                <div
                                    key={reward.id}
                                    className="absolute w-full h-full top-0 left-0"
                                    style={{
                                        transform: `rotate(${rotation}deg)`,
                                        transformOrigin: 'center',
                                    }}
                                >
                                    <div
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1/2 bg-green-900/50 origin-bottom"
                                    />
                                    <div
                                        className="absolute top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap font-mono"
                                        style={{ color: reward.color }}
                                    >
                                        {reward.label}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

                {result && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 text-center bg-green-900/20 w-full py-2 border border-green-500/30"
                    >
                        <div className="text-[10px] text-green-600 uppercase tracking-widest font-mono">Output Detected</div>
                        <div className="text-xl font-bold text-white font-display text-shadow-green">{result}</div>
                    </motion.div>
                )}

                <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-500 text-black font-bold font-mono tracking-widest border border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    onClick={spinWheel}
                    disabled={isSpinning}
                >
                    {isSpinning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> PROCSSING...
                        </>
                    ) : (
                        <>
                            <Ticket className="mr-2 h-5 w-5" /> INITIALIZE_SPIN
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}
