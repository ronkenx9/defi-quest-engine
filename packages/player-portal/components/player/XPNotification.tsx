'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface NotificationPayload {
    id: string;
    type: 'xp' | 'mint';
    xp?: number;
    multiplier?: number;
    streak?: number;
    badgeName?: string;
    badgeTier?: string;
    mintAddress?: string;
}

// Global emitter
export const triggerXPNotification = (payload: Omit<NotificationPayload, 'id'>) => {
    if (typeof window !== 'undefined') {
        const id = Math.random().toString(36).substr(2, 9);
        const event = new CustomEvent('xp-notification', { detail: { ...payload, id } });
        window.dispatchEvent(event);
    }
};

export function XPNotification() {
    const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleNotification = (e: CustomEvent<NotificationPayload>) => {
            setNotifications(prev => [...prev, e.detail]);

            // Auto remove after 4 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== e.detail.id));
            }, 4000);
        };

        window.addEventListener('xp-notification', handleNotification as EventListener);
        return () => window.removeEventListener('xp-notification', handleNotification as EventListener);
    }, []);

    return (
        <div
            ref={containerRef}
            className="fixed bottom-6 right-6 z-[100] flex flex-col gap-4 pointer-events-none"
        >
            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.9, transition: { duration: 0.2 } }}
                        className="pointer-events-auto relative w-80 bg-[#0a0a0a] border border-[#e60000] overflow-hidden rounded shadow-[0_0_15px_rgba(230,0,0,0.3)]"
                    >
                        {/* Matrix Grid / Scanline BG */}
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{
                            backgroundImage: `linear-gradient(rgba(0, 255, 0, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.2) 1px, transparent 1px)`,
                            backgroundSize: '20px 20px',
                            backgroundPosition: 'center center'
                        }}></div>

                        {/* Subtle green character rain simulation via CSS */}
                        <div className="absolute inset-0 z-0 opacity-5 font-mono text-[8px] text-green-500 leading-tight overflow-hidden select-none pointer-events-none">
                            {Array.from({ length: 15 }).map((_, i) => (
                                <div key={i} className="whitespace-nowrap opacity-50">
                                    01101001 00101011 10101010 11001100
                                </div>
                            ))}
                        </div>

                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#e60000] shadow-[0_0_10px_#e60000]"></div>

                        <div className="relative z-10 p-4 font-mono">
                            <h3 className="text-[#e60000] text-sm font-bold tracking-[0.2em] mb-2 flex items-center justify-between">
                                <span>OVERSEER SYSTEM</span>
                                <span className="w-2 h-2 rounded-full bg-[#e60000] animate-pulse shadow-[0_0_5px_#e60000]"></span>
                            </h3>

                            {n.type === 'xp' ? (
                                <div className="space-y-1">
                                    <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">[TRANSACTION VERIFIED]</div>
                                    <TypewriterText text={`+${n.xp || 0} XP CREDITED`} className="text-white text-base font-bold" />
                                    <TypewriterText text={`MULTIPLIER: ${n.multiplier || 1}x`} className="text-gray-500 text-xs" delay={300} />
                                    <TypewriterText text={`STREAK: ${n.streak || 0} DAYS`} className="text-gray-500 text-xs" delay={600} />
                                </div>
                            ) : (
                                <div className="space-y-1 flex gap-3 items-start">
                                    <div className="flex-1">
                                        <div className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">[ASSET MINTED]</div>
                                        <TypewriterText text={`${(n.badgeName || 'UNKNOWN').toUpperCase()} ACQUIRED`} className="text-white text-xs font-bold" />
                                        <TypewriterText text={`TIER: ${(n.badgeTier || 'ANOMALY').toUpperCase()}`} className="text-gray-500 text-xs" delay={300} />

                                        {n.mintAddress && (
                                            <motion.a
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.8 }}
                                                href={`https://explorer.solana.com/address/${n.mintAddress}?cluster=devnet`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1 mt-3 px-2 py-1 bg-white/5 hover:bg-white/10 text-[10px] text-[#e60000] border border-[#e60000]/30 transition-colors"
                                            >
                                                VIEW ON EXPLORER <span className="ml-1">→</span>
                                            </motion.a>
                                        )}
                                    </div>

                                    {/* 2D Silhouette Profile Art for Minted Badge */}
                                    <motion.div
                                        initial={{ filter: 'brightness(0)' }}
                                        animate={{ filter: 'brightness(1)' }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                        className="w-16 h-16 border border-white/10 shrink-0 relative overflow-hidden flex items-center justify-center bg-black"
                                    >
                                        <div className="absolute inset-0 bg-[url('/badges/red-pill.png')] bg-cover bg-center grayscale contrast-[2.0] brightness-[0.7] opacity-60"></div>
                                        <div className="absolute inset-0 bg-[#e60000] mix-blend-overlay opacity-50"></div>
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function TypewriterText({ text, className, delay = 0 }: { text: string, className?: string, delay?: number }) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let i = 0;
        let timeout: NodeJS.Timeout;
        const startTimeout = setTimeout(() => {
            timeout = setInterval(() => {
                setDisplayedText(text.substring(0, i + 1));
                i++;
                if (i === text.length) clearInterval(timeout);
            }, 30); // fast typing
        }, delay);

        return () => {
            clearTimeout(startTimeout);
            clearInterval(timeout);
        };
    }, [text, delay]);

    return <div className={className}>{displayedText}</div>;
}
