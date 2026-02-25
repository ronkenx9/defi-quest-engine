'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, Flame, Zap, Star, AlertTriangle } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { useUnifiedWallet } from '@jup-ag/wallet-adapter';
import { usePlayer } from '@/contexts/PlayerContext';
import { MatrixSounds } from '@/lib/sounds';
import { triggerXPNotification } from '@/components/player/XPNotification';

interface SwapResult {
    success: boolean;
    xpEarned: number;
    baseXP?: number;
    multiplier?: number;
    newLevel?: number;
    newPoints?: number;
    streak?: number;
    firstSwapToday?: boolean;
    swapCount?: number;
    multipliers?: Array<{ type: string; value: number; source: string }>;
    glitchesDiscovered?: Array<{ name: string; xp: number; badge?: string }>;
    leveledUp?: boolean;
    skillLeveledUp?: { skill: string; newLevel: number };
    error?: string;
}

export default function SwapPage() {
    const { walletAddress } = useWallet();
    const passthroughWalletContextState = useUnifiedWallet();
    const { refreshStats } = usePlayer();

    const [isLoaded, setIsLoaded] = useState(false);
    const [result, setResult] = useState<SwapResult | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [claimingXP, setClaimingXP] = useState(false);
    const jupiterRef = useRef<HTMLDivElement>(null);
    const currentWalletRef = useRef<string | null>(null);

    useEffect(() => {
        currentWalletRef.current = walletAddress;
    }, [walletAddress]);

    useEffect(() => {
        let mounted = true;

        const loadJupiter = async () => {
            if (jupiterRef.current && !isLoaded) {
                try {
                    // Dynamically import the modern Jupiter Plugin
                    const { init } = await import('@jup-ag/plugin');

                    if (mounted) {
                        init({
                            displayMode: 'integrated',
                            integratedTargetId: 'jupiter-terminal',
                            enableWalletPassthrough: true,
                            passthroughWalletContextState,
                            formProps: {
                                initialAmount: '1',
                                initialInputMint: 'So11111111111111111111111111111111111111112',
                                initialOutputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
                            },
                            onSuccess: async ({ txid, swapResult }: any) => {
                                console.log('Jupiter Swap Success:', txid, swapResult);
                                // Lock the address that was ACTIVE when the swap happened
                                // We use the state value directly here or capture it
                                const snapshotAddress = walletAddress || undefined;
                                await handleSwapSuccess(txid, snapshotAddress);
                            },
                            onSwapError: ({ error, quoteResponseMeta }: any) => {
                                console.error('Jupiter Swap Error:', error);
                                setResult({ success: false, xpEarned: 0, error: 'Transaction failed or was rejected.' });
                            },
                        });
                        setIsLoaded(true);
                    }
                } catch (e) {
                    console.error("Failed to load Jupiter Plugin:", e);
                }
            }
        };

        loadJupiter();

        return () => { mounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoaded]);

    // Continuously sync wallet state to Jupiter Terminal
    useEffect(() => {
        if (isLoaded && window.Jupiter?.syncProps) {
            window.Jupiter.syncProps({ passthroughWalletContextState });
        }
    }, [passthroughWalletContextState, isLoaded]);

    const handleSwapSuccess = async (txid: string, snapshotAddress?: string) => {
        const addressToUse = snapshotAddress || currentWalletRef.current;
        if (!addressToUse) {
            console.warn('Swap succeeded but no wallet connected to claim XP');
            return;
        }

        setClaimingXP(true);
        setResult(null);

        try {
            // Claim XP with verified transaction
            const response = await fetch('/api/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: addressToUse,
                    transactionSignature: txid,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to claim XP');
            }

            setResult({
                success: true,
                xpEarned: data.xpEarned,
                baseXP: data.baseXP,
                multiplier: data.multiplier,
                newLevel: data.newLevel,
                newPoints: data.newPoints,
                streak: data.streak,
                firstSwapToday: data.firstSwapToday,
                swapCount: data.swapCount,
                multipliers: data.multipliers,
                glitchesDiscovered: data.glitchesDiscovered,
                leveledUp: data.leveledUp,
                skillLeveledUp: data.skillLeveledUp,
            });

            // Refresh global stats to update XP bar everywhere
            await refreshStats();

            // Play sound effects
            if (data.leveledUp) {
                MatrixSounds.levelUp();
            } else {
                MatrixSounds.success();
            }

            // Trigger XP Notification toaster
            if (data.xpEarned > 0) {
                triggerXPNotification({
                    type: 'xp',
                    xp: data.xpEarned,
                    multiplier: data.multiplier || 1,
                    streak: data.streak || 1
                });
            }

            // Trigger Mint Notification if badges were minted/evolved
            if (data.onChainEvolution?.firstSwapBadge) {
                triggerXPNotification({
                    type: 'mint',
                    badgeName: data.onChainEvolution.firstSwapBadge.name,
                    badgeTier: 'INITIATE',
                    mintAddress: data.onChainEvolution.firstSwapBadge.address
                });
            } else if (data.onChainEvolution?.badgeMinted) {
                triggerXPNotification({
                    type: 'mint',
                    badgeName: data.onChainEvolution.badgeMinted.mission,
                    badgeTier: 'INITIATE',
                    mintAddress: data.onChainEvolution.badgeMinted.address
                });
            } else if (data.onChainEvolution?.badgeEvolution) {
                triggerXPNotification({
                    type: 'mint',
                    badgeName: 'BADGE EVOLVED',
                    badgeTier: data.onChainEvolution.badgeEvolution.newRarity,
                });
            }

            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to claim XP for swap';
            setResult({ success: false, xpEarned: 0, error: errorMessage });
        } finally {
            setClaimingXP(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <PlayerNavbar />

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="text-6xl animate-bounce">🎉</div>
                </div>
            )}

            <main className="flex-1 flex flex-col items-center justify-start px-4 py-8">
                <div className="text-center mb-8 max-w-xl w-full">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // SWAP PROTOCOL
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">JUPITER </span>
                        <span className="text-[#4ade80]">TERMINAL</span>
                    </h1>
                    <p className="text-gray-400">
                        Execute swaps directly on mainnet and earn mission XP automatically.
                    </p>

                    {!walletAddress && (
                        <div className="mt-4 p-3 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm">
                            <AlertTriangle className="w-4 h-4 inline mr-2" />
                            Please connect your wallet in the navbar above before swapping to ensure you receive XP!
                        </div>
                    )}
                </div>

                <div className="w-full max-w-2xl relative z-10 flex flex-col" style={{ minHeight: '700px' }}>

                    {/* The Jupiter Terminal Container */}
                    <div
                        id="jupiter-terminal"
                        ref={jupiterRef}
                        className="w-full h-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(74,222,128,0.15)] ring-1 ring-[#4ade80]/20"
                    >
                        {!isLoaded && (
                            <div className="h-[500px] w-full flex flex-col items-center justify-center bg-[#1c2128]">
                                <Loader2 className="w-8 h-8 text-[#4ade80] animate-spin mb-4" />
                                <p className="text-gray-400 font-mono text-sm tracking-widest">LOADING TERMINAL...</p>
                            </div>
                        )}
                    </div>

                    {/* Token Market Info Footer (Matching Reference Image) */}
                    <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-glow relative overflow-hidden group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                    <span className="text-blue-400 font-bold text-xs">($)</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">USDC</span>
                                    <span className="text-gray-500 text-[10px] font-mono">EPjF...Dt1v</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-mono text-sm tracking-tighter">$0.99999</div>
                                <div className="text-[#8fb36c] text-[10px] font-mono">0.01%</div>
                            </div>
                            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>

                        <div className="glass-panel p-4 rounded-2xl flex items-center justify-between border-glow relative overflow-hidden group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 overflow-hidden">
                                    <Zap className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white font-bold text-sm">SOL</span>
                                    <span className="text-gray-500 text-[10px] font-mono">So11...1112</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-white font-mono text-sm tracking-tighter">$84.59</div>
                                <div className="text-[#8fb36c] text-[10px] font-mono">3.07%</div>
                            </div>
                            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Result Section (Below Terminal) */}
                <div className="w-full max-w-md mt-6">
                    {claimingXP && (
                        <div className="p-4 rounded-xl border border-[#4ade80]/20 bg-[#4ade80]/5 text-center flex items-center justify-center gap-3">
                            <Loader2 className="w-5 h-5 text-[#4ade80] animate-spin" />
                            <span className="text-[#4ade80] font-mono whitespace-nowrap">Verifying swap on-chain & claiming XP...</span>
                        </div>
                    )}

                    {!claimingXP && result && (
                        <div className={`p-5 rounded-xl border ${result.success
                            ? 'border-[#4ade80]/30 bg-[#4ade80]/10 shadow-[0_0_30px_rgba(74,222,128,0.1)]'
                            : 'border-red-500/30 bg-red-500/10'
                            }`}>
                            {result.success ? (
                                <div>
                                    <div className="text-center mb-4">
                                        <CheckCircle className="w-10 h-10 text-[#4ade80] mx-auto mb-2" />
                                        <p className="font-bold text-[#4ade80] text-lg">Swap Verified!</p>
                                    </div>

                                    {/* XP Breakdown */}
                                    <div className="space-y-2 mb-4 p-3 rounded-lg bg-black/40 border border-gray-800">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Base XP</span>
                                            <span className="text-white">+{result.baseXP || 0}</span>
                                        </div>
                                        {result.multiplier && result.multiplier > 1 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Total Multiplier</span>
                                                <span className="text-yellow-400">{result.multiplier.toFixed(2)}x</span>
                                            </div>
                                        )}
                                        {result.multipliers && result.multipliers.map((m, i) => (
                                            <div key={i} className="flex justify-between text-xs pl-2">
                                                <span className="text-gray-500">{m.source}</span>
                                                <span className="text-yellow-500">+{((m.value - 1) * 100).toFixed(0)}%</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-sm font-bold border-t border-gray-700 pt-2 mt-2">
                                            <span className="text-[#4ade80]">Total XP Earned</span>
                                            <span className="text-[#4ade80]">+{result.xpEarned}</span>
                                        </div>
                                    </div>

                                    {/* Streak */}
                                    {result.streak && result.streak > 0 && (
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 mb-3">
                                            <Flame className="w-5 h-5 text-orange-400" />
                                            <span className="text-sm text-orange-300">
                                                {result.firstSwapToday
                                                    ? `🔥 ${result.streak}-day streak!`
                                                    : `${result.streak}-day streak active`}
                                            </span>
                                        </div>
                                    )}

                                    {/* Glitches Discovered */}
                                    {result.glitchesDiscovered && result.glitchesDiscovered.length > 0 && (
                                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 mb-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Star className="w-5 h-5 text-purple-400 animate-pulse" />
                                                <span className="text-sm font-bold text-purple-300">GLITCH DISCOVERED!</span>
                                            </div>
                                            {result.glitchesDiscovered.map((g, i) => (
                                                <p key={i} className="text-xs text-purple-200 pl-7">
                                                    {g.name}: <span className="font-bold">+{g.xp} XP</span> {g.badge && `🏆 ${g.badge}`}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {/* Level Up */}
                                    {result.leveledUp && (
                                        <div className="text-center p-3 rounded-lg bg-[#4ade80]/20 border border-[#4ade80]/40 mt-3 animate-pulse">
                                            <Zap className="w-6 h-6 text-[#4ade80] mx-auto mb-1" />
                                            <p className="font-bold text-[#4ade80]">LEVEL UP!</p>
                                            <p className="text-sm text-gray-300">You reached Level {result.newLevel}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center">
                                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                                    <p className="font-bold text-red-400">XP Claim Failed</p>
                                    <p className="text-sm text-gray-400 mt-2">{result.error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}
