'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowUpDown, Loader2, CheckCircle, XCircle, Flame, Zap, Star, AlertTriangle } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { MatrixSounds } from '@/lib/sounds';

// Token mint addresses for Jupiter
const TOKEN_MINTS: Record<string, string> = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
};

// Token decimals for proper conversion
const TOKEN_DECIMALS: Record<string, number> = {
    SOL: 9,
    USDC: 6,
    BONK: 5,
    JUP: 6,
    RAY: 6,
    ORCA: 6,
};

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
    const { walletAddress, signTransaction } = useWallet();
    const { refreshStats } = usePlayer();
    const [inputToken, setInputToken] = useState('SOL');
    const [outputToken, setOutputToken] = useState('USDC');
    const [amount, setAmount] = useState('1');
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState('');
    const [result, setResult] = useState<SwapResult | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [outputAmount, setOutputAmount] = useState<string | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(false);

    const tokens = ['SOL', 'USDC', 'BONK', 'JUP', 'RAY', 'ORCA'];

    // Fetch real-time quote from Jupiter
    const fetchQuote = useCallback(async () => {
        const inputAmount = parseFloat(amount);
        if (!inputAmount || inputAmount <= 0 || inputToken === outputToken) {
            setOutputAmount(null);
            return;
        }

        setQuoteLoading(true);
        try {
            const inputMint = TOKEN_MINTS[inputToken];
            const outputMint = TOKEN_MINTS[outputToken];
            const inputDecimals = TOKEN_DECIMALS[inputToken];
            const outputDecimals = TOKEN_DECIMALS[outputToken];
            const amountInSmallestUnit = Math.floor(inputAmount * Math.pow(10, inputDecimals));

            const quoteResponse = await fetch(
                `/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInSmallestUnit}&slippageBps=50`
            );
            const quote = await quoteResponse.json();

            if (quote && quote.outAmount) {
                const out = parseInt(quote.outAmount) / Math.pow(10, outputDecimals);
                setOutputAmount(out.toLocaleString(undefined, { maximumFractionDigits: 4 }));
            } else {
                setOutputAmount(null);
            }
        } catch (error) {
            console.error('Quote fetch error:', error);
            setOutputAmount(null);
        } finally {
            setQuoteLoading(false);
        }
    }, [amount, inputToken, outputToken]);

    // Debounce quote fetching
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchQuote();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchQuote]);

    const executeSwap = async () => {
        if (!walletAddress || !amount || !signTransaction) return;

        setLoading(true);
        setResult(null);

        try {
            const inputMint = TOKEN_MINTS[inputToken];
            const outputMint = TOKEN_MINTS[outputToken];
            const inputDecimals = TOKEN_DECIMALS[inputToken];
            const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, inputDecimals));

            // Step 1: Get Jupiter quote via proxy
            setLoadingStage('Getting best route...');
            const quoteResponse = await fetch(
                `/api/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInSmallestUnit}&slippageBps=50`
            );
            const quote = await quoteResponse.json();

            if (!quoteResponse.ok || !quote || quote.error) {
                throw new Error(quote?.error || quote?.details || 'Failed to get swap quote');
            }

            // Step 2: Get swap transaction via proxy
            setLoadingStage('Preparing transaction...');
            const swapResponse = await fetch('/api/swap-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: walletAddress,
                    wrapAndUnwrapSol: true,
                }),
            });
            const swapData = await swapResponse.json();

            if (!swapResponse.ok || !swapData || !swapData.swapTransaction) {
                throw new Error(swapData?.error || swapData?.details || 'Failed to prepare swap transaction');
            }

            // Step 3: Sign and send transaction
            setLoadingStage('Waiting for wallet approval...');
            const transactionSignature = await signTransaction(swapData.swapTransaction);

            if (!transactionSignature) {
                throw new Error('Transaction cancelled or failed');
            }

            // Step 4: Claim XP with verified transaction
            setLoadingStage('Claiming XP rewards...');
            const response = await fetch('/api/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    transactionSignature,
                }),
            });

            const data = await response.json();
            console.log('[Swap Page] API Response:', data);

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

            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Swap failed';
            setResult({ success: false, xpEarned: 0, error: errorMessage });
        } finally {
            setLoading(false);
            setLoadingStage('');
        }
    };

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div className="text-6xl animate-bounce">🎉</div>
                </div>
            )}

            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // SWAP PROTOCOL
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">JUPITER </span>
                        <span className="text-[#4ade80]">SWAP</span>
                    </h1>
                    <p className="text-gray-400">
                        Execute swaps and earn XP rewards.
                    </p>
                </div>

                <div className="p-6 rounded-xl border border-[#4ade80]/20 bg-[#0a0f0a]">
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 mb-2 block">FROM</label>
                        <div className="flex gap-2">
                            <select
                                value={inputToken}
                                onChange={(e) => setInputToken(e.target.value)}
                                className="flex-shrink-0 px-4 py-3 rounded-lg bg-[#0a0f0a] border border-gray-700 text-white focus:border-[#4ade80] outline-none"
                            >
                                {tokens.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.0"
                                className="flex-1 px-4 py-3 rounded-lg bg-[#0a0f0a] border border-gray-700 text-white text-right text-xl focus:border-[#4ade80] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center my-4">
                        <button
                            onClick={() => {
                                const temp = inputToken;
                                setInputToken(outputToken);
                                setOutputToken(temp);
                            }}
                            className="p-2 rounded-full border border-gray-700 hover:border-[#4ade80] transition-colors"
                        >
                            <ArrowUpDown className="w-5 h-5 text-[#4ade80]" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs text-gray-500 mb-2 block">TO</label>
                        <div className="flex gap-2">
                            <select
                                value={outputToken}
                                onChange={(e) => setOutputToken(e.target.value)}
                                className="flex-shrink-0 px-4 py-3 rounded-lg bg-[#0a0f0a] border border-gray-700 text-white focus:border-[#4ade80] outline-none"
                            >
                                {tokens.filter(t => t !== inputToken).map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <div className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 text-right text-xl">
                                {quoteLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin inline" />
                                ) : (
                                    outputAmount ? `~${outputAmount}` : '---'
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 mb-6 text-center">
                        <span className="text-sm text-gray-400">Reward: </span>
                        <span className="text-[#4ade80] font-bold">
                            +{Math.floor(parseFloat(amount || '0') * 50)} XP
                        </span>
                    </div>

                    {walletAddress ? (
                        <button
                            onClick={executeSwap}
                            disabled={loading || !amount || parseFloat(amount) <= 0}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#22c55e] to-[#10b981] text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(74,222,128,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {loadingStage || 'Processing...'}
                                </span>
                            ) : (
                                'Execute Swap'
                            )}
                        </button>
                    ) : (
                        <div className="text-center py-4 text-gray-500">
                            Connect wallet to swap
                        </div>
                    )}
                </div>

                {result && (
                    <div className={`mt-6 p-5 rounded-xl border ${result.success
                        ? 'border-[#4ade80]/30 bg-[#4ade80]/10'
                        : 'border-red-500/30 bg-red-500/10'
                        }`}>
                        {result.success ? (
                            <div>
                                {/* Header */}
                                <div className="text-center mb-4">
                                    <CheckCircle className="w-10 h-10 text-[#4ade80] mx-auto mb-2" />
                                    <p className="font-bold text-[#4ade80] text-lg">Swap Complete!</p>
                                </div>

                                {/* XP Breakdown */}
                                <div className="space-y-2 mb-4 p-3 rounded-lg bg-black/30">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Base XP</span>
                                        <span className="text-white">+{result.baseXP}</span>
                                    </div>
                                    {result.multiplier && result.multiplier > 1 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Multiplier</span>
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
                                            <Star className="w-5 h-5 text-purple-400" />
                                            <span className="text-sm font-bold text-purple-300">GLITCH DISCOVERED!</span>
                                        </div>
                                        {result.glitchesDiscovered.map((g, i) => (
                                            <p key={i} className="text-xs text-purple-200 pl-7">
                                                {g.name} +{g.xp} XP {g.badge && `🏆 ${g.badge}`}
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Level Up */}
                                {result.leveledUp && (
                                    <div className="text-center p-3 rounded-lg bg-[#4ade80]/20 border border-[#4ade80]/40">
                                        <Zap className="w-6 h-6 text-[#4ade80] mx-auto mb-1" />
                                        <p className="font-bold text-[#4ade80]">LEVEL UP!</p>
                                        <p className="text-sm text-gray-300">You reached Level {result.newLevel}</p>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700">
                                    <span>Total Points: {result.newPoints?.toLocaleString()}</span>
                                    <span>Swap #{result.swapCount}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                                <p className="font-bold text-red-400">Swap Failed</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 text-center text-xs text-gray-500">
                    <p>Powered by Jupiter Aggregator</p>
                    <p className="mt-1">Best routes, MEV protection, instant execution</p>
                </div>
            </main>
        </div>
    );
}
