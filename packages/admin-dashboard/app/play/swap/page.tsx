'use client';

import { useState } from 'react';
import { ArrowUpDown, Loader2, CheckCircle, XCircle } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';

interface SwapResult {
    success: boolean;
    xpEarned: number;
    signature?: string;
}

export default function SwapPage() {
    const { walletAddress } = useWallet();
    const [inputToken, setInputToken] = useState('SOL');
    const [outputToken, setOutputToken] = useState('USDC');
    const [amount, setAmount] = useState('1');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SwapResult | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    const tokens = ['SOL', 'USDC', 'BONK', 'JUP', 'RAY', 'ORCA'];

    const executeSwap = async () => {
        if (!walletAddress || !amount) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/swap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress,
                    amount: parseFloat(amount),
                    inputToken,
                    outputToken,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Swap failed');
            }

            setResult({
                success: true,
                xpEarned: data.xpEarned,
                signature: 'tx_' + Date.now().toString(36),
            });

            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);

        } catch {
            setResult({ success: false, xpEarned: 0 });
        } finally {
            setLoading(false);
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
                                ~{(parseFloat(amount || '0') * 23.5).toFixed(2)}
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
                                    <Loader2 className="w-5 h-5 animate-spin" /> Executing...
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
                    <div className={`mt-6 p-4 rounded-xl border ${result.success
                        ? 'border-[#4ade80]/30 bg-[#4ade80]/10'
                        : 'border-red-500/30 bg-red-500/10'
                        }`}>
                        {result.success ? (
                            <div className="text-center">
                                <CheckCircle className="w-8 h-8 text-[#4ade80] mx-auto mb-2" />
                                <p className="font-bold text-[#4ade80] mb-1">Swap Complete!</p>
                                <p className="text-sm text-gray-400">
                                    You earned <span className="text-[#4ade80] font-bold">+{result.xpEarned} XP</span>
                                </p>
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
