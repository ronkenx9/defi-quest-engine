'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface ProfileNFTVisualizerProps {
    level?: number;
    rank?: string;
    avatarUrl?: string | null;
    className?: string;
}

/**
 * Neural Core — Profile NFT Visualizer
 * 
 * A holographic display pedestal for the player's evolving profile NFT.
 * When the player uploads a PFP, it replaces the synthetic core with their actual face,
 * framed by the same data orbits and spotlight — feels like their identity IS the NFT.
 * 
 * Aesthetic: Cyberpunk specimen display. The PFP floats inside a containment field.
 * Think: sci-fi movie where someone's face is projected inside a holographic sphere.
 */
export default function ProfileNFTVisualizer({
    level = 1,
    rank = 'NOVICE',
    avatarUrl = null,
    className = ''
}: ProfileNFTVisualizerProps) {
    const [rotation, setRotation] = useState(0);
    const [pulse, setPulse] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Rotation engine
    useEffect(() => {
        let frame: number;
        let angle = 0;
        const tick = () => {
            angle = (angle + 0.6) % 360;
            setRotation(angle);
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, []);

    // Particle field (ambient floating specks)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                vx: (Math.random() - 0.5) * 0.3,
                vy: -Math.random() * 0.4 - 0.1,
                size: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.4 + 0.1,
            });
        }

        let animFrame: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < -5) { p.y = canvas.offsetHeight + 5; p.x = Math.random() * canvas.offsetWidth; }
                if (p.x < -5 || p.x > canvas.offsetWidth + 5) p.vx *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(74, 222, 128, ${p.alpha})`;
                ctx.fill();
            }
            animFrame = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animFrame);
    }, []);

    // Periodic pulse effect
    useEffect(() => {
        const interval = setInterval(() => {
            setPulse(true);
            setTimeout(() => setPulse(false), 600);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const hasPFP = !!avatarUrl;

    return (
        <div className={`relative w-full h-[420px] flex items-center justify-center rounded-3xl overflow-hidden ${className}`}
            style={{ background: 'radial-gradient(ellipse at 50% 20%, #0a1a0f 0%, #050507 60%, #020204 100%)' }}>

            {/* ─── Particle Canvas ─── */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

            {/* ─── Volumetric Spotlight (2 beams for depth) ─── */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-[5]"
                style={{
                    width: '260px', height: '420px',
                    background: 'linear-gradient(180deg, rgba(74,222,128,0.15) 0%, rgba(74,222,128,0.03) 40%, transparent 70%)',
                    clipPath: 'polygon(35% 0%, 65% 0%, 85% 100%, 15% 100%)',
                }} />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none z-[5] opacity-40"
                style={{
                    width: '180px', height: '300px',
                    background: 'linear-gradient(180deg, rgba(74,222,128,0.25) 0%, transparent 60%)',
                    clipPath: 'polygon(40% 0%, 60% 0%, 75% 100%, 25% 100%)',
                    filter: 'blur(8px)',
                }} />

            {/* ─── Pedestal Glow (Ground Plane) ─── */}
            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 pointer-events-none z-[1]">
                <div className="w-56 h-8 rounded-full opacity-60"
                    style={{ background: 'radial-gradient(ellipse, rgba(74,222,128,0.3) 0%, transparent 70%)', filter: 'blur(16px)' }} />
                <div className="w-48 h-[1px] mx-auto bg-gradient-to-r from-transparent via-[#4ade80]/60 to-transparent mt-1 shadow-[0_0_12px_rgba(74,222,128,0.4)]" />
            </div>

            {/* ═══════════════════════════════════════════════════
                THE NEURAL CORE — The floating sphere / PFP display
            ═══════════════════════════════════════════════════ */}
            <div className="relative z-10 animate-float">

                {/* Outer glow ring (intensifies on pulse) */}
                <div className={`absolute inset-[-28px] rounded-full transition-opacity duration-500 ${pulse ? 'opacity-40' : 'opacity-15'}`}
                    style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)', filter: 'blur(30px)' }} />

                {/* ─── Orbiting Ring 1: Equatorial (perspective tilt) ─── */}
                <div className="absolute inset-[-36px] rounded-full pointer-events-none"
                    style={{
                        border: '1px solid rgba(74,222,128,0.15)',
                        transform: 'perspective(800px) rotateX(72deg)',
                    }}>
                    <div className="absolute w-2 h-2 rounded-full bg-[#4ade80] shadow-[0_0_8px_#4ade80,0_0_20px_rgba(74,222,128,0.5)]"
                        style={{
                            top: '50%', left: '50%',
                            transform: `translate(-50%, -50%) rotate(${rotation}deg) translateX(78px)`,
                        }} />
                    <div className="absolute w-1 h-1 rounded-full bg-[#4ade80]/60"
                        style={{
                            top: '50%', left: '50%',
                            transform: `translate(-50%, -50%) rotate(${rotation + 180}deg) translateX(78px)`,
                        }} />
                </div>

                {/* ─── Orbiting Ring 2: Polar (vertical) ─── */}
                <div className="absolute inset-[-24px] rounded-full pointer-events-none"
                    style={{
                        border: '1px solid rgba(74,222,128,0.08)',
                        transform: 'rotateY(80deg)',
                    }}>
                    <div className="absolute w-1.5 h-1.5 rounded-full bg-[#86efac]/70 shadow-[0_0_6px_#86efac]"
                        style={{
                            top: '50%', left: '50%',
                            transform: `translate(-50%, -50%) rotate(${-rotation * 0.7}deg) translateX(64px)`,
                        }} />
                </div>

                {/* ─── Orbiting Ring 3: Diagonal ─── */}
                <div className="absolute inset-[-44px] rounded-full pointer-events-none"
                    style={{
                        border: '1px dashed rgba(74,222,128,0.06)',
                        transform: 'rotate(35deg) perspective(600px) rotateX(65deg)',
                    }}>
                    <div className="absolute w-1 h-1 rounded-full bg-[#4ade80]/40"
                        style={{
                            top: '50%', left: '50%',
                            transform: `translate(-50%, -50%) rotate(${rotation * 1.3}deg) translateX(92px)`,
                        }} />
                </div>

                {/* ═══ THE ORB ITSELF ═══ */}
                <div className="relative w-40 h-40 rounded-full overflow-hidden"
                    style={{
                        border: '1.5px solid rgba(74,222,128,0.35)',
                        boxShadow: `
                             inset 0 0 40px rgba(74,222,128,0.15),
                             inset 0 -20px 40px rgba(0,0,0,0.6),
                             0 0 30px rgba(74,222,128,0.1),
                             0 0 60px rgba(74,222,128,0.05)
                         `,
                    }}>

                    {/* PFP Image (if uploaded) */}
                    {hasPFP ? (
                        <>
                            <Image
                                src={avatarUrl!}
                                alt="Profile NFT"
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            {/* Holographic overlay on PFP */}
                            <div className="absolute inset-0"
                                style={{
                                    background: `linear-gradient(${rotation}deg, transparent 40%, rgba(74,222,128,0.12) 50%, transparent 60%)`,
                                    mixBlendMode: 'screen',
                                }} />
                            {/* Scanline on PFP */}
                            <div className="absolute left-0 w-full h-[2px] bg-[#4ade80]/30 shadow-[0_0_8px_rgba(74,222,128,0.4)] animate-scan-fast" />
                            {/* Top highlight arc */}
                            <div className="absolute top-0 left-0 w-full h-1/3"
                                style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)' }} />
                        </>
                    ) : (
                        /* Generic SVG Core (no PFP uploaded) */
                        <div className="absolute inset-0 bg-[#060a06] flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-28 h-28">
                                <defs>
                                    <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="transparent" />
                                    </radialGradient>
                                </defs>
                                <circle cx="50" cy="50" r="44" stroke="#4ade80" strokeWidth="0.4" fill="none" opacity="0.2" />
                                <circle cx="50" cy="50" r="38" stroke="#4ade80" strokeWidth="0.8" fill="url(#core-glow)" strokeDasharray="4 4" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }} />
                                <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}>
                                    <circle cx="50" cy="50" r="24" stroke="#4ade80" strokeWidth="1.5" fill="none" strokeDasharray="8 6" />
                                </g>
                                <g style={{ transform: `rotate(${-rotation * 1.4}deg)`, transformOrigin: 'center' }}>
                                    <circle cx="50" cy="50" r="14" stroke="#86efac" strokeWidth="0.8" fill="none" strokeDasharray="3 10" />
                                </g>
                                <text x="50" y="48" textAnchor="middle" fill="#4ade80" fontSize="6" fontFamily="monospace" fontWeight="bold" style={{ filter: 'drop-shadow(0 0 3px #4ade80)' }}>
                                    NEURAL
                                </text>
                                <text x="50" y="58" textAnchor="middle" fill="#86efac" fontSize="8" fontFamily="monospace" fontWeight="900" style={{ filter: 'drop-shadow(0 0 3px #4ade80)' }}>
                                    CORE
                                </text>
                            </svg>
                            {/* Scanline for generic core */}
                            <div className="absolute left-0 w-full h-[1px] bg-[#4ade80]/40 shadow-[0_0_6px_rgba(74,222,128,0.5)] animate-scan-fast" />
                        </div>
                    )}
                </div>
            </div>

            {/* ─── HUD: Top-Left Status Tags ─── */}
            <div className="absolute top-6 left-6 flex flex-col gap-1.5 z-30">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#4ade80]/8 border border-[#4ade80]/20 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                    <span className="text-[#4ade80] text-[9px] font-mono tracking-[0.2em] uppercase font-semibold">
                        {hasPFP ? 'PFP Synced' : 'Awaiting PFP'}
                    </span>
                </div>
                <div className="px-2.5 py-1 rounded bg-black/40 border border-white/5 backdrop-blur-sm">
                    <span className="text-[#86efac]/70 text-[9px] font-mono tracking-[0.15em] uppercase">
                        Rank: {rank}
                    </span>
                </div>
            </div>

            {/* ─── HUD: Bottom-Right Level Display ─── */}
            <div className="absolute bottom-6 right-6 text-right z-30">
                <div className="text-[8px] text-[#4ade80]/40 font-mono tracking-[0.4em] uppercase mb-0.5">
                    System Level
                </div>
                <div className="text-3xl font-black text-white font-mono tracking-[-0.05em]"
                    style={{ textShadow: '0 0 20px rgba(74,222,128,0.4), 0 0 40px rgba(74,222,128,0.15)' }}>
                    {String(level).padStart(2, '0')}
                </div>
            </div>

            {/* ─── HUD: Bottom-Left Upload Hint ─── */}
            {!hasPFP && (
                <div className="absolute bottom-6 left-6 z-30">
                    <div className="text-[8px] text-gray-600 font-mono tracking-widest uppercase animate-pulse">
                        ↑ Upload PFP to activate
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-16px); }
                }
                @keyframes scan-fast {
                    0% { top: -2px; }
                    100% { top: calc(100% + 2px); }
                }
                .animate-float {
                    animation: float 5s ease-in-out infinite;
                }
                .animate-scan-fast {
                    animation: scan-fast 2.5s linear infinite;
                }
            `}</style>
        </div>
    );
}
