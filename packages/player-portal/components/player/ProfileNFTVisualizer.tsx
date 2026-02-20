'use client';

import { useEffect, useState } from 'react';

interface ProfileNFTVisualizerProps {
    level?: number;
    rank?: string;
    className?: string;
}

export default function ProfileNFTVisualizer({ level = 1, rank = 'NOVICE', className = '' }: ProfileNFTVisualizerProps) {
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => (prev + 1) % 360);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`relative w-full h-[400px] flex items-center justify-center bg-black/40 rounded-3xl overflow-hidden border border-[#4ade80]/10 ${className}`}>
            {/* ─── Volumetric Spotlight Effect ─── */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[500px] pointer-events-none z-20">
                <div
                    className="w-full h-full opacity-30"
                    style={{
                        background: 'conic-gradient(from 150deg at 50% 0%, transparent 0deg, #4ade80 30deg, transparent 60deg)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            {/* ─── The Matrix Pedestal ─── */}
            <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none opacity-40">
                <div className="absolute inset-0 bg-[#4ade80]/10 blur-[40px] rounded-full scale-y-50 translate-y-20" />
                <div
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#4ade80] shadow-[0_0_20px_#4ade80]"
                    style={{ transform: 'perspective(500px) rotateX(60deg)' }}
                />
            </div>

            {/* ─── The Neural Core (The Orb) ─── */}
            <div
                className="relative z-10 w-40 h-40 animate-float"
            >
                {/* Core Glow */}
                <div className="absolute inset-[-20px] bg-[#4ade80] rounded-full blur-[40px] opacity-20 animate-pulse" />

                {/* The Orb Body */}
                <div className="relative w-full h-full rounded-full border border-[#4ade80]/50 bg-[#0a0f0a] overflow-hidden shadow-[inset_0_0_40px_rgba(74,222,128,0.2)]">
                    {/* Matrix Scanline (Inside the Orb) */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-[#4ade80] opacity-50 shadow-[0_0_10px_#4ade80] animate-scan-fast" />

                    {/* Inner Core SVG Graphics */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-24 h-24 opacity-80">
                            <defs>
                                <radialGradient id="orb-gradient" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                                </radialGradient>
                            </defs>
                            <circle cx="50" cy="50" r="45" stroke="#4ade80" strokeWidth="0.5" fill="none" opacity="0.3" />
                            <circle cx="50" cy="50" r="40" stroke="#4ade80" strokeWidth="1" fill="url(#orb-gradient)" strokeDasharray="3 3" className="animate-spin-slow" />

                            {/* Inner Rotating Rings */}
                            <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}>
                                <circle cx="50" cy="50" r="25" stroke="#4ade80" strokeWidth="2" fill="none" strokeDasharray="10 5" />
                            </g>
                            <g style={{ transform: `rotate(${-rotation * 1.5}deg)`, transformOrigin: 'center' }}>
                                <circle cx="50" cy="50" r="15" stroke="#4ade80" strokeWidth="1" fill="none" strokeDasharray="5 15" />
                            </g>

                            <text
                                x="50" y="55"
                                textAnchor="middle"
                                fill="#4ade80"
                                className="font-mono text-[10px] font-bold"
                                style={{ filter: 'drop-shadow(0 0 4px #4ade80)' }}
                            >
                                CORE_{level}
                            </text>
                        </svg>
                    </div>
                </div>

                {/* ─── External Orbiting Rings ─── */}
                {/* Horizontal Ring */}
                <div
                    className="absolute inset-[-40px] rounded-full border border-[#4ade80]/20 pointer-events-none"
                    style={{ transform: 'perspective(1000px) rotateX(75deg)' }}
                >
                    <div
                        className="absolute w-2 h-2 bg-[#4ade80] rounded-full shadow-[0_0_10px_#4ade80]"
                        style={{
                            left: '50%', top: '0%',
                            transform: `translateX(-50%) translateY(-50%) rotateY(${rotation}deg) translateZ(120px)`
                        }}
                    />
                </div>

                {/* Vertical Ring */}
                <div
                    className="absolute inset-[-20px] rounded-full border border-[#4ade80]/10 pointer-events-none"
                    style={{ transform: 'rotateY(75deg)' }}
                >
                    <div
                        className="absolute w-1.5 h-1.5 bg-[#4ade80]/50 rounded-full"
                        style={{
                            left: '50%', top: '0%',
                            transform: `translateX(-50%) translateY(-50%) rotateX(${rotation * 0.5}deg) translateZ(100px)`
                        }}
                    />
                </div>
            </div>

            {/* ─── HUD Labels ─── */}
            <div className="absolute top-8 left-8 flex flex-col gap-2 z-30">
                <div className="px-3 py-1 rounded bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-[10px] font-mono tracking-widest uppercase">
                    Status: Verified
                </div>
                <div className="px-3 py-1 rounded bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-[10px] font-mono tracking-widest uppercase">
                    Rank: {rank}
                </div>
            </div>

            <div className="absolute bottom-8 right-8 text-right z-30">
                <div className="text-[10px] text-[#4ade80]/60 font-mono tracking-[0.3em] font-bold uppercase mb-1">
                    System Level
                </div>
                <div className="text-4xl font-black text-white font-mono tracking-tighter shadow-glow">
                    0{level}
                </div>
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                }
                @keyframes scan-fast {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-scan-fast {
                    animation: scan-fast 1s linear infinite;
                }
                .animate-spin-slow {
                    animation: spin 8s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .shadow-glow {
                    text-shadow: 0 0 20px rgba(74,222,128,0.5);
                }
            `}</style>
        </div>
    );
}
