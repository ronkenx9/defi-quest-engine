'use client';

import React, { useRef, useCallback, useState } from 'react';
import { Share2, Download, Check, Copy } from 'lucide-react';

interface AchievementCardProps {
    /** Badge/achievement name */
    name: string;
    /** Badge image URL */
    image: string;
    /** XP amount earned */
    xp: number;
    /** Rarity tier */
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    /** Wallet address (truncated) */
    wallet?: string;
    /** Date earned */
    date?: Date;
}

const RARITY_COLORS: Record<AchievementCardProps['rarity'], { primary: string; glow: string }> = {
    common: { primary: '#4ade80', glow: 'rgba(74, 222, 128, 0.4)' },
    rare: { primary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)' },
    epic: { primary: '#c084fc', glow: 'rgba(192, 132, 252, 0.4)' },
    legendary: { primary: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)' },
};

const RARITY_LABELS: Record<AchievementCardProps['rarity'], string> = {
    common: 'INITIATE',
    rare: 'HACKER',
    epic: 'OPERATOR',
    legendary: 'ANOMALY',
};

/**
 * Generates a shareable achievement card image
 * Design philosophy: Image only, let players add their own voice
 */
export function AchievementCard({
    name,
    image,
    xp,
    rarity,
    wallet,
    date = new Date()
}: AchievementCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const colors = RARITY_COLORS[rarity];

    // Generate image using html2canvas (would need to be installed)
    const handleDownload = useCallback(async () => {
        if (!cardRef.current) return;

        setDownloading(true);

        try {
            // Dynamic import for html2canvas
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0a0a0f',
                scale: 2,
            } as any);

            // Convert to blob
            canvas.toBlob((blob) => {
                if (!blob) return;

                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `achievement-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 'image/png');
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setDownloading(false);
        }
    }, [name]);

    // Copy image to clipboard
    const handleCopyImage = useCallback(async () => {
        if (!cardRef.current) return;

        try {
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#0a0a0f',
                scale: 2,
            } as any);

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                } catch (err) {
                    console.error('Failed to copy image:', err);
                }
            }, 'image/png');
        } catch (error) {
            console.error('Failed to generate image:', error);
        }
    }, []);

    return (
        <div className="flex flex-col gap-4">
            {/* The shareable card */}
            <div
                ref={cardRef}
                className="relative w-[400px] h-[500px] rounded-2xl overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, #0f0f18 0%, #0a0a0f 100%)',
                    border: `2px solid ${colors.primary}40`,
                    boxShadow: `0 0 60px ${colors.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
                }}
            >
                {/* Matrix code rain background */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden font-mono text-[8px] leading-[10px] select-none"
                    style={{ color: colors.primary }}
                >
                    {Array(50).fill(null).map((_, i) => (
                        <div key={i} className="whitespace-nowrap">
                            {Array(50).fill(null).map((_, j) => (
                                <span key={j}>{Math.random() > 0.5 ? '1' : '0'}</span>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Rarity tag */}
                <div
                    className="absolute top-6 right-6 px-4 py-1.5 rounded-full font-mono text-[10px] font-bold tracking-widest z-10"
                    style={{
                        background: `${colors.primary}20`,
                        color: colors.primary,
                        border: `1px solid ${colors.primary}40`,
                    }}
                >
                    {RARITY_LABELS[rarity]}
                </div>

                {/* Main content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full p-8">
                    {/* Badge image */}
                    <div
                        className="relative w-48 h-48 mb-8 rounded-xl overflow-hidden"
                        style={{
                            border: `2px solid ${colors.primary}60`,
                            boxShadow: `0 10px 40px ${colors.glow}`,
                        }}
                    >
                        <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                            style={{ imageRendering: 'pixelated' }}
                        />
                    </div>

                    {/* Achievement name */}
                    <h2
                        className="font-mono font-bold text-2xl tracking-wide text-center mb-4"
                        style={{
                            color: '#fff',
                            textShadow: `0 0 20px ${colors.glow}`,
                        }}
                    >
                        {name.toUpperCase()}
                    </h2>

                    {/* XP earned */}
                    <div
                        className="px-6 py-2 rounded-full font-mono font-bold text-lg"
                        style={{
                            background: `${colors.primary}15`,
                            color: colors.primary,
                            border: `1px solid ${colors.primary}30`,
                        }}
                    >
                        +{xp} XP
                    </div>

                    {/* Footer with branding (subtle) */}
                    <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 opacity-50">
                        <span className="font-mono text-[10px] text-gray-500 tracking-wider">
                            DeFi Quest × Jupiter Mobile
                        </span>
                    </div>
                </div>

                {/* Gradient border glow effect */}
                <div
                    className="absolute inset-0 pointer-events-none rounded-2xl"
                    style={{
                        background: `linear-gradient(135deg, ${colors.primary}10, transparent, ${colors.primary}05)`,
                    }}
                />
            </div>

            {/* Action buttons - NOT part of the exported image */}
            <div className="flex gap-3 justify-center">
                <button
                    onClick={handleCopyImage}
                    disabled={copied}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy Image
                        </>
                    )}
                </button>

                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 font-mono text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Generating...' : 'Download'}
                </button>
            </div>

            {/* Hint text */}
            <p className="text-center text-xs text-gray-500 font-mono">
                Image only — add your own voice when sharing
            </p>
        </div>
    );
}

export default AchievementCard;
