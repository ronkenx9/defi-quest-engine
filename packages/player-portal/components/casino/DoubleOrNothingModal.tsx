import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Flame, Coins, XCircle, ArrowRight, Skull, AlertOctagon, Loader2 } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { triggerXPNotification } from '@/components/player/XPNotification';

const MAX_DOUBLE_CHAIN = 5;

interface DoubleOrNothingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialWager?: number;
    walletAddress: string;
    onComplete: () => void;
}

export function DoubleOrNothingModal({
    isOpen,
    onClose,
    initialWager = 100,
    walletAddress,
    onComplete
}: DoubleOrNothingModalProps) {
    const { refreshStats } = usePlayer();

    // offer -> rolling -> result -> offer
    const [step, setStep] = useState<'offer' | 'rolling' | 'result' | 'loading'>('offer');
    const [currentWager, setCurrentWager] = useState(initialWager);
    const [chainLevel, setChainLevel] = useState(0);
    const [gameResult, setGameResult] = useState<'won' | 'lost' | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('loading');
            setCurrentWager(initialWager);
            setChainLevel(0);
            setGameResult(null);
            setError(null);

            // Deduct initial wager on open
            if (walletAddress) {
                fetch('/api/casino/double', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress, amount: initialWager, action: 'start' })
                }).then(res => res.json()).then(data => {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        refreshStats();
                        setStep('offer');
                    }
                }).catch(e => setError(e.message));
            }
        }
    }, [isOpen, initialWager, walletAddress, refreshStats]);

    const handleTake = async () => {
        setStep('loading');
        try {
            const res = await fetch('/api/casino/double', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount: currentWager, action: 'claim' })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            await refreshStats();

            if (currentWager > 0) {
                triggerXPNotification({
                    type: 'xp',
                    xp: currentWager,
                    streak: 0
                });
            }

            onComplete();
            onClose();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const handleRisk = async () => {
        setStep('rolling');
        setError(null);

        try {
            const res = await fetch('/api/casino/double', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, amount: currentWager, action: 'risk' })
            });
            const data = await res.json();

            // Artificial suspense since API is fast
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (data.error) throw new Error(data.error);

            if (data.won) {
                setCurrentWager(data.newWager);
                setGameResult('won');
                setStep('result');
            } else {
                setCurrentWager(0);
                setGameResult('lost');
                setStep('result');
            }
        } catch (e: any) {
            setError(e.message);
            setStep('offer'); // Revert
        }
    };

    const handleContinue = () => {
        if (gameResult === 'won' && chainLevel < MAX_DOUBLE_CHAIN - 1) {
            setChainLevel(prev => prev + 1);
            setGameResult(null);
            setStep('offer');
        } else {
            handleTake();
        }
    };

    const isMaxChain = chainLevel >= MAX_DOUBLE_CHAIN - 1;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-black border border-red-600/50 text-white overflow-hidden shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                {/* Warning Stripes Background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #dc2626 10px, #dc2626 20px)' }}
                />

                <DialogHeader className="relative z-10 border-b border-red-900/50 pb-4">
                    <DialogTitle className="text-center text-3xl font-black italic tracking-tighter uppercase text-red-600 font-display flex items-center justify-center gap-2">
                        <AlertOctagon className="h-8 w-8 animate-pulse" />
                        DOUBLE_PROTOCOL
                    </DialogTitle>
                </DialogHeader>

                <div className="relative z-10 flex flex-col items-center justify-center p-6 space-y-8 min-h-[300px]">

                    {error && (
                        <div className="text-center text-red-500 font-mono text-sm border border-red-500/30 bg-red-900/20 p-4 w-full">
                            ERROR: {error}
                            <Button variant="outline" className="mt-4 w-full border-red-500/30 hover:bg-red-900/30" onClick={onClose}>
                                ABORT
                            </Button>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 'loading' && !error && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center space-y-4 text-red-500"
                            >
                                <Loader2 className="w-12 h-12 animate-spin" />
                                <div className="font-mono animate-pulse tracking-widest">INITIALIZING_SECURE_LINK...</div>
                            </motion.div>
                        )}

                        {step === 'offer' && !error && (
                            <motion.div
                                key="offer"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                className="text-center w-full space-y-6"
                            >
                                <div className="space-y-2">
                                    <div className="text-red-500 text-xs font-bold tracking-[0.3em] uppercase font-mono">Current Buffer</div>
                                    <div className="text-5xl font-black text-white font-mono">
                                        {currentWager} <span className="text-red-800 text-2xl">XP</span>
                                    </div>
                                </div>

                                {/* Risk Visual */}
                                <div className="relative h-32 w-full bg-black rounded border border-zinc-800 flex items-center justify-between px-8 overflow-hidden group">

                                    <div className="text-center z-10">
                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1 font-mono">Secure Exit</div>
                                        <div className="text-green-500 font-bold text-lg font-mono">KEEP {currentWager}</div>
                                    </div>

                                    <div className="h-full w-px bg-red-900/50 z-10 relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-red-600 rounded-full p-2">
                                            <div className="text-[10px] font-bold text-red-600">VS</div>
                                        </div>
                                    </div>

                                    <div className="text-center z-10">
                                        <div className="text-[10px] text-red-500 uppercase font-bold mb-1 animate-pulse font-mono">Risk Protocol</div>
                                        <div className="text-white font-black text-2xl font-mono text-shadow-red">
                                            {currentWager * 2} XP
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <Button
                                        variant="outline"
                                        className="h-16 text-sm border-zinc-800 hover:bg-zinc-900 font-bold text-zinc-400 font-mono tracking-widest uppercase"
                                        onClick={handleTake}
                                    >
                                        [ SAFE_EXIT ]
                                    </Button>
                                    <Button
                                        className="h-16 text-xl bg-red-600 hover:bg-red-700 text-black font-black italic tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] font-display"
                                        onClick={handleRisk}
                                    >
                                        <Flame className="mr-2 h-6 w-6 fill-black animate-bounce" />
                                        EXECUTE
                                    </Button>
                                </div>
                                <div className="text-[10px] text-red-900 font-mono text-center">
                                    SEQUENCE {chainLevel + 1} / {MAX_DOUBLE_CHAIN} • 50% PROBABILITY
                                </div>
                            </motion.div>
                        )}

                        {step === 'rolling' && !error && (
                            <motion.div
                                key="rolling"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center space-y-6"
                            >
                                <motion.div
                                    animate={{ rotateY: 1800 }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                    className="relative preserve-3d"
                                >
                                    <div className="h-32 w-32 rounded-full border-4 border-red-600 bg-red-900/20 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)]">
                                        <Coins className="h-16 w-16 text-red-500" />
                                    </div>
                                </motion.div>
                                <div className="text-xl font-bold text-red-500 animate-pulse font-mono">
                                    CALCULATING_OUTCOME...
                                </div>
                            </motion.div>
                        )}

                        {step === 'result' && !error && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                className="text-center w-full space-y-6"
                            >
                                {gameResult === 'won' ? (
                                    <>
                                        <div className="relative inline-block mb-4">
                                            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-40 animate-pulse" />
                                            <Trophy className="h-24 w-24 text-yellow-400 relative z-10 drop-shadow-xl" />
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-black italic text-white mb-2 tracking-tighter font-display">SUCCESS!</h2>
                                            <p className="text-zinc-400 text-lg font-mono">Amount Doubled.</p>
                                        </div>

                                        {!isMaxChain ? (
                                            <Button
                                                className="w-full h-16 text-xl font-black italic bg-green-600 hover:bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.4)] font-display"
                                                onClick={handleContinue}
                                            >
                                                CONTINUE? ({currentWager * 2} XP) <ArrowRight className="ml-2 h-6 w-6" />
                                            </Button>
                                        ) : (
                                            <Button
                                                className="w-full h-16 text-xl font-black bg-yellow-500 hover:bg-yellow-400 text-black font-display"
                                                onClick={handleTake}
                                            >
                                                CLAIM MAX WIN 🎉
                                            </Button>
                                        )}

                                        {!isMaxChain && (
                                            <Button variant="ghost" className="w-full text-zinc-500 hover:text-white font-mono text-xs uppercase" onClick={handleTake}>
                                                [ CLAIM {currentWager} XP ]
                                            </Button>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="relative inline-block mb-4">
                                            <div className="absolute inset-0 bg-red-600 blur-3xl opacity-20" />
                                            <Skull className="h-24 w-24 text-red-600 relative z-10" />
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-4xl font-black italic text-red-600 mb-2 tracking-tighter font-display">TERMINATED</h2>
                                            <p className="text-red-900 font-mono">Zero Sum.</p>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full h-14 text-lg border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-white font-mono"
                                            onClick={() => onClose()}
                                        >
                                            [ CLOSE_TERMINAL ]
                                        </Button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </DialogContent>
        </Dialog>
    );
}
