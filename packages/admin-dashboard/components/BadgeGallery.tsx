'use client';

import React, { useState } from 'react';
import {
    Sparkles,
    Lock,
    ExternalLink,
    Trophy,
} from 'lucide-react';
import { getAllBadges, Badge, BadgeRarity, RARITY_CONFIG } from '@/lib/badgeData';

// Sound effect utility for badge unlocks
const playGlitchSound = () => {
    if (typeof window !== 'undefined') {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.15);
        oscillator.frequency.exponentialRampToValueAtTime(110, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.25);
    }
};
        owned: true,
        mintedAt: '2026-01-11T09:15:00Z',
        mintAddress: '9yLMn...kPq42',
        attributes: [
            { traitType: 'Class', value: 'Anomaly' },
            { traitType: 'Volume', value: '$100+' },
            { traitType: 'Points', value: 200 },
        ],
    },
    {
        id: 'white_rabbit',
        type: 'streak_starter',
        name: 'White Rabbit',
        description: 'You followed the trail for 7 days straight. How deep does the rabbit hole go?',
        rarity: 'common',
        image: '/badges/white-rabbit.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Seeker' },
            { traitType: 'Streak', value: '7 Days' },
            { traitType: 'Points', value: 100 },
        ],
    },
    {
        id: 'operator',
        type: 'limit_order',
        name: 'The Operator',
        description: 'You bypassed the manual controls. Precision limit orders executed directly into the mainframe.',
        rarity: 'epic',
        image: '/badges/operator.png',
        owned: false,
        attributes: [
            { traitType: 'Class', value: 'Hacker' },
            { traitType: 'Skill', value: 'Automation' },
            { traitType: 'Points', value: 300 },
        ],
    },
    {
        id: 'the_one',
        type: 'swap_master',
        name: 'The One',
        description: 'You have become The One. 100+ on-chain interactions. You see the code now.',
        rarity: 'legendary',
        image: '/badges/the-one.png',
        owned: false,
        attributes: [
            { traitType: 'Status', value: 'Awakened' },
            { traitType: 'Swaps', value: '100+' },
            { traitType: 'Points', value: 2000 },
        ],
    },
    {
        id: 'escape_sim',
        type: 'hackathon_participant',
        name: 'Escape Simulation',
        description: 'Matrix Hackathon 2026 Survivor. You built the tools to break free.',
        rarity: 'legendary',
        image: '/badges/escape.png',
        owned: false,
        attributes: [
            { traitType: 'Event', value: 'Matrix Hackathon' },
            { traitType: 'Role', value: 'Architect' },
            { traitType: 'Points', value: 1000 },
        ],
];

interface BadgeCardProps {
    badge: Badge;
    onClick?: () => void;
}

function BadgeCard({ badge, onClick }: BadgeCardProps) {
    const config = RARITY_CONFIG[badge.rarity];

    return (
        <div
            className={`
                group relative rounded-xl p-4 transition-all duration-300 cursor-pointer overflow-hidden
                ${badge.owned
                    ? 'hover:translate-y-[-4px] hover:shadow-[0_0_20px_rgba(74,222,128,0.2)]'
                    : 'opacity-60 grayscale-[0.8]'
                }
            `}
            style={{
                background: 'rgba(10, 10, 15, 0.8)',
                border: `1px solid ${badge.owned ? config.border : '#333'}`,
            }}
            onClick={onClick}
        >
            {/* Matrix Code Background Effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden font-mono text-[10px] leading-3 text-green-500 select-none">
                {Array(20).fill('01100101 100110 001101 110010 010101').map((line, i) => (
                    <div key={i} className="whitespace-nowrap animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>
                        {line}
                    </div>
                ))}
            </div>

            {/* Rarity Label */}
            <div
                className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold z-10"
                style={{
                    background: config.bg,
                    color: config.color,
                    border: `1px solid ${config.border}40`
                }}
            >
                {config.icon}
                {config.label}
            </div>

            {/* Lock Overlay */}
            {!badge.owned && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-[1px]">
                    <Lock className="w-6 h-6 text-gray-400" />
                </div>
            )}

            {/* Badge Image */}
            <div className="relative z-10 w-20 h-20 mx-auto rounded-lg mb-4 mt-2 overflow-hidden ring-1 ring-white/10 group-hover:ring-green-400/50 transition-all">
                <img
                    src={badge.image}
                    alt={badge.name}
                    className="w-full h-full object-cover rendering-pixelated"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>

            {/* Info */}
            <h4 className="font-mono font-bold text-center text-white truncate text-sm tracking-tight relative z-10">
                {badge.name.toUpperCase()}
            </h4>

            <p className="text-[10px] text-center text-gray-400 mt-1 line-clamp-2 h-8 relative z-10 font-mono">
                {badge.description}
            </p>

            {/* XP Value */}
            <div className="mt-3 flex justify-center relative z-10">
                <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                    style={{ background: 'rgba(255,255,255,0.05)', color: config.color }}
                >
                    [{badge.attributes.find(a => a.traitType === 'Points')?.value || 0} XP]
                </span>
            </div>
        </div>
    );
}

interface BadgeGalleryProps {
    walletAddress?: string;
    showStats?: boolean;
    compact?: boolean;
}

export function BadgeGallery({ walletAddress, showStats = true, compact = false }: BadgeGalleryProps) {
    const [badges, setBadges] = useState<Badge[]>(getAllBadges());
    const [filter, setFilter] = useState<'all' | 'owned' | BadgeRarity>('all');
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    // Calculate stats
    const ownedCount = badges.filter(b => b.owned).length;
    const totalCount = badges.length;

    // Filter badges
    const filteredBadges = badges.filter(badge => {
        if (filter === 'all') return true;
        if (filter === 'owned') return badge.owned;
        return badge.rarity === filter;
    });

    return (
        <div className="space-y-6">
            {/* Stats Header */}
            {showStats && (
                <div className="bg-black/40 border border-green-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-green-900/20 flex items-center justify-center border border-green-500/30">
                            <Terminal className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold font-mono text-green-400">SKILL TREE PROGRESS</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                                <span>UNLOCKED: {ownedCount}/{totalCount}</span>
                                <span className="text-gray-600">|</span>
                                <span>SYSTEM STATUS: {ownedCount > 0 ? 'COMPROMISED' : 'SECURE'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                    { value: 'all', label: 'ALL FILES' },
                    { value: 'owned', label: 'DECRYPTED' },
                    { value: 'legendary', label: 'ANOMALY' },
                    { value: 'epic', label: 'OPERATOR' },
                    { value: 'rare', label: 'HACKER' },
                    { value: 'common', label: 'INITIATE' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setFilter(tab.value as typeof filter)}
                        className={`
                            px-3 py-1.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider transition-all
                            ${filter === tab.value
                                ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(74,222,128,0.4)]'
                                : 'bg-white/5 text-gray-400 hover:text-white border border-transparent hover:border-white/10'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className={`
                grid gap-4
                ${compact
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
                }
            `}>
                {filteredBadges.map(badge => (
                    <BadgeCard
                        key={badge.id}
                        badge={badge}
                        onClick={() => {
                            if (badge.owned) playGlitchSound();
                            setSelectedBadge(badge);
                        }}
                    />
                ))}
            </div>

            {/* Modal */}
            {selectedBadge && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedBadge(null)}
                >
                    <div
                        className="bg-[#0a0a0f] border border-green-500/30 rounded-xl p-6 max-w-sm w-full relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{
                            boxShadow: `0 0 50px ${RARITY_CONFIG[selectedBadge.rarity].color}20`
                        }}
                    >
                        {/* Scanline effect */}
                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] contrast-125 opacity-20"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-bold font-mono text-white tracking-tighter">
                                    {selectedBadge.name.toUpperCase()}
                                </h3>
                                <button onClick={() => setSelectedBadge(null)}>
                                    <span className="text-xs font-mono text-gray-500 hover:text-white">[CLOSE]</span>
                                </button>
                            </div>

                            <div className="w-32 h-32 mx-auto mb-6 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                <img
                                    src={selectedBadge.image}
                                    className="w-full h-full object-cover"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            </div>

                            <div className="space-y-4 font-mono text-xs">
                                <div className="bg-white/5 p-3 rounded border border-white/5">
                                    <p className="text-gray-300 leading-relaxed">
                                        "{selectedBadge.description}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {selectedBadge.attributes.map((attr, i) => (
                                        <div key={i} className="flex justify-between border-b border-white/5 pb-1">
                                            <span className="text-gray-500">{attr.traitType}:</span>
                                            <span className="text-green-400 font-bold">{attr.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {selectedBadge.owned && (
                                    <button className="w-full py-3 mt-4 bg-green-500 hover:bg-green-400 text-black font-bold uppercase tracking-wider text-xs rounded transition-colors shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                                        View On-Chain Data
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BadgeGallery;
