import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dices, Ticket, Loader2, Binary } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { triggerXPNotification } from '@/components/player/XPNotification';

const REWARDS = [
    { id: 1, label: 'COMMON_DATA', color: '#4ade80', tier: 'COMMON' },
    { id: 2, label: 'JACKPOT', color: '#fbbf24', tier: 'JACKPOT' },
    { id: 3, label: 'NULL_VOID', color: '#ef4444', tier: 'NULL_VOID' },
    { id: 4, label: 'RARE_DATA', color: '#60a5fa', tier: 'RARE' },
    { id: 5, label: 'NULL_VOID', color: '#ef4444', tier: 'NULL_VOID' },
    { id: 6, label: 'EPIC_DATA', color: '#c084fc', tier: 'EPIC' },
    { id: 7, label: 'NULL_VOID', color: '#ef4444', tier: 'NULL_VOID' },
    { id: 8, label: 'LEGENDARY', color: '#f43f5e', tier: 'LEGENDARY' },
];

const SPIN_COST = 100;

export function BadgeRouletteComponent() {
    const { walletAddress } = useWallet();
    const { refreshStats } = usePlayer();

    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const controls = useAnimation();

    const spinWheel = async () => {
        if (!walletAddress) {
            setError("Wallet not connected");
            return;
        }

        setIsSpinning(true);
        setResult(null);
        setError(null);

        try {
            // Pre-process API call so we know the outcome
            const response = await fetch('/api/casino/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Spin failed');
            }

            // Find matching index on the wheel for the tier returned by server
            const segmentAngle = 360 / REWARDS.length;
            const matchingIndices = REWARDS.map((r, idx) => r.tier === data.tier ? idx : -1).filter(idx => idx !== -1);

            // If multiple of same tier (like NULL_VOID), pick random one to land on
            const winningIndex = matchingIndices[Math.floor(Math.random() * matchingIndices.length)];

            // Calculate rotation to land exactly on the segment
            // Umi rotation logic:
            const targetSegment = (REWARDS.length - winningIndex) % REWARDS.length;
            const spins = 5;
            const rotateAmount = (spins * 360) + (targetSegment * segmentAngle);

            await controls.start({
                rotate: rotateAmount,
                transition: { duration: 4, ease: "circOut" }
            });

            const displayLabel = data.reward > 0 ? `+${data.reward} XP` : 'NULL_VOID';
            setResult(displayLabel);

            await refreshStats();

            if (data.reward > 0) {
                triggerXPNotification({
                    type: 'xp',
                    xp: data.reward,
                    multiplier: 1,
                    streak: 0
                });
            }

        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsSpinning(false);
        }
    };

    return (
        <Card className="w-full max-w-md bg-black border border-green-500/30 text-green-500 mx-auto relative overflow-hidden group">
            {/* Matrix Background */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(34,197,94,0.1)_95%)] bg-[length:100%_4px] pointer-events-none" />

            <CardHeader className="text-center relative z-10 border-b border-green-500/20">
                <CardTitle className="flex items-center justify-center text-xl text-green-400 font-display tracking-widest uppercase">
                    <Binary className="mr-2 h-5 w-5" /> Data Siphon
                </CardTitle>
                <CardDescription className="text-green-800 font-mono text-xs">
                    COST: {SPIN_COST} XP. High risk, high reward.
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

                {error && (
                    <div className="mb-6 text-center text-red-500 text-xs font-mono bg-red-900/10 px-4 py-2 border border-red-500/30">
                        ERROR: {error}
                    </div>
                )}

                {result && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mb-6 text-center w-full py-2 border ${result === 'NULL_VOID' ? 'bg-red-900/20 border-red-500/30 text-red-500' : 'bg-green-900/20 border-green-500/30 text-green-400'}`}
                    >
                        <div className="text-[10px] uppercase tracking-widest font-mono opacity-80">Output Detected</div>
                        <div className="text-xl font-bold font-display">{result}</div>
                    </motion.div>
                )}

                <Button
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-500 text-black font-bold font-mono tracking-widest border border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    onClick={spinWheel}
                    disabled={isSpinning || !walletAddress}
                >
                    {isSpinning ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> EXECUTING...
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
