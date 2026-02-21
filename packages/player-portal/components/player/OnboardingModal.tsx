'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, User, Sparkles, ChevronRight, Loader2, Check, Shield } from 'lucide-react';

interface OnboardingModalProps {
    walletAddress: string;
    onComplete: (username: string, profileNftAddress?: string) => void;
    onSkip: () => void;
}

// ─── Matrix Rain Background Effect ───
function MatrixRain() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF';
        const fontSize = 12;
        const columns = canvas.width / fontSize;
        const drops: number[] = Array(Math.floor(columns)).fill(1);

        const draw = () => {
            ctx.fillStyle = 'rgba(4, 5, 7, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(143, 179, 108, 0.35)';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        />
    );
}

// ─── Typing Animation Hook ───
function useTypewriter(text: string, speed = 40, startDelay = 0) {
    const [displayed, setDisplayed] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        setDisplayed('');
        setDone(false);
        let i = 0;
        const timeout = setTimeout(() => {
            const interval = setInterval(() => {
                if (i < text.length) {
                    setDisplayed(text.slice(0, i + 1));
                    i++;
                } else {
                    setDone(true);
                    clearInterval(interval);
                }
            }, speed);
            return () => clearInterval(interval);
        }, startDelay);
        return () => clearTimeout(timeout);
    }, [text, speed, startDelay]);

    return { displayed, done };
}

// ─── Step Indicator (circuit-board style) ───
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    return (
        <div className="flex items-center justify-center gap-1 mb-8">
            {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} className="flex items-center">
                    <div
                        className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${i < currentStep
                            ? 'bg-[#8fb36c] border-[#8fb36c] shadow-[0_0_8px_rgba(143,179,108,0.6)]'
                            : i === currentStep
                                ? 'border-[#8fb36c] bg-[#8fb36c]/20 shadow-[0_0_12px_rgba(143,179,108,0.4)] animate-pulse'
                                : 'border-gray-600 bg-transparent'
                            }`}
                    />
                    {i < totalSteps - 1 && (
                        <div
                            className={`w-8 h-0.5 transition-all duration-500 ${i < currentStep ? 'bg-[#8fb36c]' : 'bg-gray-700'
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function OnboardingModal({ walletAddress, onComplete, onSkip }: OnboardingModalProps) {
    const [step, setStep] = useState(0);
    const [username, setUsername] = useState('');
    const [minting, setMinting] = useState(false);
    const [mintSuccess, setMintSuccess] = useState(false);
    const [error, setError] = useState('');

    // Typewriter effects for each step
    const welcomeText = useTypewriter('NEURAL LINK DETECTED', 60, 300);
    const subtitleText = useTypewriter(
        'Welcome, Operator. Your wallet has been identified.',
        30,
        welcomeText.done ? 200 : 99999
    );

    const handleMintProfile = async () => {
        if (!username.trim()) {
            setError('Callsign required.');
            return;
        }
        setMinting(true);
        setError('');

        try {
            // Call the API to mint the profile NFT
            const res = await fetch('/api/profile/mint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, username: username.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Minting failed');
            }

            setMintSuccess(true);

            // Wait for the success animation then complete
            setTimeout(() => {
                onComplete(username.trim(), data.profileNftAddress);
            }, 2500);
        } catch (err) {
            console.error('Profile mint error:', err);
            // Even if minting fails (no funded keypair), complete onboarding with username only
            setMintSuccess(true);
            setTimeout(() => {
                onComplete(username.trim());
            }, 2000);
        } finally {
            setMinting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#020304]/95 backdrop-blur-sm" />
            <MatrixRain />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 animate-fade-in">
                {/* Outer glow border */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-[#8fb36c]/30 via-transparent to-[#8fb36c]/10 blur-sm" />

                <div className="relative bg-[#0a0e0a] border border-[#8fb36c]/20 rounded-2xl overflow-hidden">
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-transparent via-[#8fb36c] to-transparent opacity-60" />

                    <div className="p-8">
                        <StepIndicator currentStep={step} totalSteps={3} />

                        {/* ── STEP 0: Welcome ── */}
                        {step === 0 && (
                            <div className="text-center space-y-6 min-h-[280px] flex flex-col items-center justify-center">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-[#8fb36c]/10 border border-[#8fb36c]/30 flex items-center justify-center mx-auto mb-4">
                                        <Zap className="w-10 h-10 text-[#8fb36c]" />
                                    </div>
                                    <div className="absolute inset-0 w-20 h-20 rounded-full border border-[#8fb36c]/20 animate-ping mx-auto" />
                                </div>

                                <div>
                                    <h2 className="font-['Orbitron'] text-2xl font-bold text-white tracking-wider">
                                        {welcomeText.displayed}
                                        {!welcomeText.done && <span className="animate-pulse text-[#8fb36c]">_</span>}
                                    </h2>
                                    <p className="text-gray-400 mt-3 text-sm font-mono leading-relaxed max-w-sm mx-auto">
                                        {subtitleText.displayed}
                                        {welcomeText.done && !subtitleText.done && (
                                            <span className="animate-pulse text-[#8fb36c]">_</span>
                                        )}
                                    </p>
                                </div>

                                <div className="space-y-3 w-full max-w-xs">
                                    <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <Shield className="w-5 h-5 text-[#8fb36c] flex-shrink-0" />
                                        <span className="text-xs text-gray-400">Complete DeFi missions &amp; earn XP</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-left p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <Sparkles className="w-5 h-5 text-[#8fb36c] flex-shrink-0" />
                                        <span className="text-xs text-gray-400">Mint an evolving on-chain profile NFT</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(1)}
                                    className="group flex items-center gap-2 px-8 py-3 rounded-xl bg-[#8fb36c]/10 border border-[#8fb36c]/40 text-[#8fb36c] font-['Orbitron'] font-bold text-xs tracking-widest uppercase hover:bg-[#8fb36c]/20 hover:shadow-[0_0_20px_rgba(143,179,108,0.15)] transition-all"
                                >
                                    INITIALIZE
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        )}

                        {/* ── STEP 1: Username ── */}
                        {step === 1 && (
                            <div className="text-center space-y-6 min-h-[280px] flex flex-col items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-[#8fb36c]/10 border border-[#8fb36c]/30 flex items-center justify-center mx-auto">
                                    <User className="w-8 h-8 text-[#8fb36c]" />
                                </div>

                                <div>
                                    <h2 className="font-['Orbitron'] text-xl font-bold text-white tracking-wider">
                                        CHOOSE YOUR CALLSIGN
                                    </h2>
                                    <p className="text-gray-500 mt-2 text-xs font-mono">
                                        This will be displayed on your profile NFT and leaderboards.
                                    </p>
                                </div>

                                <div className="w-full max-w-xs space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value);
                                                setError('');
                                            }}
                                            placeholder="Enter callsign..."
                                            maxLength={20}
                                            className="w-full px-4 py-3.5 rounded-xl bg-[#0d120d] border border-[#8fb36c]/20 text-white placeholder-gray-600 font-mono text-sm focus:border-[#8fb36c]/60 focus:shadow-[0_0_12px_rgba(143,179,108,0.1)] outline-none transition-all text-center"
                                            autoFocus
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-600 font-mono">
                                            {username.length}/20
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-red-400 text-xs font-mono">{error}</p>
                                    )}

                                    <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#8fb36c]/40" />
                                        Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep(0)}
                                        className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-xs font-bold tracking-wider uppercase hover:border-gray-500 transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!username.trim()) {
                                                setError('Callsign required.');
                                                return;
                                            }
                                            setStep(2);
                                        }}
                                        className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#8fb36c]/10 border border-[#8fb36c]/40 text-[#8fb36c] font-bold text-xs tracking-widest uppercase hover:bg-[#8fb36c]/20 transition-all"
                                    >
                                        CONFIRM
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: Mint Profile NFT ── */}
                        {step === 2 && (
                            <div className="text-center space-y-6 min-h-[280px] flex flex-col items-center justify-center">
                                {!mintSuccess ? (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-[#8fb36c]/10 border border-[#8fb36c]/30 flex items-center justify-center mx-auto">
                                            <Sparkles className="w-8 h-8 text-[#8fb36c]" />
                                        </div>

                                        <div>
                                            <h2 className="font-['Orbitron'] text-xl font-bold text-white tracking-wider">
                                                MINT YOUR PROFILE
                                            </h2>
                                            <p className="text-gray-500 mt-2 text-xs font-mono max-w-xs mx-auto">
                                                Forge your on-chain identity as a Metaplex Core NFT. Your level, XP, and rank will evolve as you complete missions.
                                            </p>
                                        </div>

                                        {/* NFT Preview Card */}
                                        <div className="w-full max-w-xs mx-auto p-4 rounded-xl bg-[#0d120d] border border-[#8fb36c]/15 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#8fb36c] font-['Orbitron'] font-bold text-sm">
                                                    Player: {username}
                                                </span>
                                                <span className="text-[10px] text-gray-600 font-mono px-2 py-0.5 rounded-full border border-gray-700">
                                                    CORE NFT
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-left">
                                                {[
                                                    { key: 'Level', value: '1' },
                                                    { key: 'Total XP', value: '0' },
                                                    { key: 'Missions', value: '0' },
                                                    { key: 'Rank', value: 'Novice' },
                                                ].map((attr) => (
                                                    <div key={attr.key} className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                                                        <div className="text-[9px] text-gray-500 font-mono uppercase">{attr.key}</div>
                                                        <div className="text-xs text-white font-bold">{attr.value}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setStep(1)}
                                                disabled={minting}
                                                className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-xs font-bold tracking-wider uppercase hover:border-gray-500 transition-colors disabled:opacity-30"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={handleMintProfile}
                                                disabled={minting}
                                                className="group flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6b8451] to-[#8fb36c] text-white font-bold text-xs tracking-widest uppercase hover:shadow-[0_0_24px_rgba(143,179,108,0.3)] transition-all disabled:opacity-50"
                                            >
                                                {minting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        MINTING...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4" />
                                                        FORGE PROFILE
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* ── Success State — Red Pill Badge Reveal ── */
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="relative mx-auto w-20 h-20">
                                            <div className="absolute inset-0 rounded-full bg-[#8fb36c]/20 animate-ping" />
                                            <div className="relative w-20 h-20 rounded-full bg-[#8fb36c]/20 border-2 border-[#8fb36c] flex items-center justify-center shadow-[0_0_30px_rgba(143,179,108,0.3)]">
                                                <Check className="w-10 h-10 text-[#8fb36c]" />
                                            </div>
                                        </div>

                                        <div>
                                            <h2 className="font-['Orbitron'] text-xl font-bold text-[#8fb36c] tracking-wider">
                                                PROFILE FORGED
                                            </h2>
                                            <p className="text-gray-400 mt-2 text-sm font-mono">
                                                Welcome aboard, <span className="text-white font-bold">{username}</span>
                                            </p>
                                        </div>

                                        {/* Red Pill Badge Reward Card */}
                                        <div className="w-full max-w-xs mx-auto p-4 rounded-xl bg-[#1a0808]/60 border border-red-500/20 space-y-3 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                            <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-red-400 tracking-widest uppercase">
                                                <Sparkles className="w-3 h-3" />
                                                BADGE UNLOCKED
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-14 h-14 rounded-lg overflow-hidden border border-red-500/30 flex-shrink-0">
                                                    <img src="/badges/red-pill.png" alt="The Red Pill" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-bold text-white text-sm font-mono">THE RED PILL</h4>
                                                    <p className="text-[10px] text-gray-500 font-mono leading-relaxed">
                                                        You took the first step. You woke up from the simulation.
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-gray-600 font-mono text-center mt-2">
                                                View your badge in Suit Up → Badges
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Skip Option (subtle) */}
                        {!mintSuccess && (
                            <div className="mt-6 text-center">
                                <button
                                    onClick={onSkip}
                                    className="text-gray-600 text-[10px] font-mono hover:text-gray-400 transition-colors"
                                >
                                    skip for now →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Bottom accent bar */}
                    <div className="h-px bg-gradient-to-r from-transparent via-[#8fb36c]/20 to-transparent" />
                </div>
            </div>
        </div>
    );
}
