'use client';

import React, { useState, useMemo } from 'react';
import {
    Lock,
    Terminal,
    Code,
    Cpu,
    Zap,
    Trophy,
    Eye,
    ExternalLink,
    Sparkles,
} from 'lucide-react';
import { MatrixSounds } from '@/lib/sounds';

// ─── Badge Types (mirrors core BadgeCollection.ts) ──────────────────────────
type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

interface Badge {
    id: string;
    type: string;
    name: string;
    description: string;
    rarity: BadgeRarity;
    image: string;
    owned: boolean;
    mintedAt?: string;
    mintAddress?: string;
    attributes: Array<{ traitType: string; value: string | number }>;
}

// ─── Matrix Badge Registry (shared with admin dashboard) ────────────────────
// Sources from @defi-quest/core BadgeCollection.ts narrative names
const MATRIX_BADGES: Badge[] = [
    {
        id: 'red_pill',
        type: 'first_swap',
        name: 'The Red Pill',
        description: 'You took the first step. You initiated a swap and woke up from the simulation.',
        rarity: 'common',
        image: '/badges/red-pill.png',
        owned: false,
        attributes: [
            { traitType: 'Status', value: 'Awakened' },
            { traitType: 'Category', value: 'Trading' },
            { traitType: 'Points', value: 50 },
        ],
    },
    {
        id: 'system_glitch',
        type: 'volume_trader',
        name: 'System Glitch',
        description: 'You moved enough volume to cause a ripple in the code. The agents are watching.',
        rarity: 'rare',
        image: '/badges/system-glitch.png',
        owned: false,
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
    },
];

// ─── Rarity Config ──────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<BadgeRarity, {
    color: string;
    bg: string;
    border: string;
    glow: string;
    icon: React.ReactNode;
    label: string;
}> = {
    common: {
        color: '#4ade80',
        bg: 'rgba(74, 222, 128, 0.08)',
        border: 'rgba(74, 222, 128, 0.3)',
        glow: '0 0 20px rgba(74, 222, 128, 0.15)',
        icon: <Terminal className="w-3 h-3" />,
        label: 'Initiate',
    },
    rare: {
        color: '#60a5fa',
        bg: 'rgba(96, 165, 250, 0.08)',
        border: 'rgba(96, 165, 250, 0.3)',
        glow: '0 0 20px rgba(96, 165, 250, 0.15)',
        icon: <Code className="w-3 h-3" />,
        label: 'Hacker',
    },
    epic: {
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.08)',
        border: 'rgba(192, 132, 252, 0.3)',
        glow: '0 0 20px rgba(192, 132, 252, 0.15)',
        icon: <Cpu className="w-3 h-3" />,
        label: 'Operator',
    },
    legendary: {
        color: '#f43f5e',
        bg: 'rgba(244, 63, 94, 0.08)',
        border: 'rgba(244, 63, 94, 0.3)',
        glow: '0 0 25px rgba(244, 63, 94, 0.2)',
        icon: <Zap className="w-3 h-3" />,
        label: 'Anomaly',
    },
};

// ─── Badge Card ─────────────────────────────────────────────────────────────
function BadgeCard({ badge, onClick }: { badge: Badge; onClick: () => void }) {
    const cfg = RARITY_CONFIG[badge.rarity];

    return (
        <div
            className={`
                group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden
                ${badge.owned
                    ? 'hover:translate-y-[-4px]'
                    : 'opacity-50 grayscale-[0.85]'
                }
            `}
            style={{
                background: 'rgba(8, 8, 12, 0.9)',
                border: `1px solid ${badge.owned ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                boxShadow: badge.owned ? cfg.glow : 'none',
            }}
            onClick={onClick}
        >
            {/* Matrix rain BG */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden font-mono text-[8px] leading-[10px] text-green-500 select-none">
                {Array(15).fill(null).map((_, i) => (
                    <div key={i} className="whitespace-nowrap" style={{ animationDelay: `${i * 0.15}s` }}>
                        01100101 100110 001101 110010 010101
                    </div>
                ))}
            </div>

            {/* Rarity badge */}
            <div
                className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold z-10"
                style={{
                    background: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                }}
            >
                {cfg.icon}
                {cfg.label}
            </div>

            {/* Lock overlay */}
            {!badge.owned && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-[2px] rounded-2xl">
                    <div className="flex flex-col items-center gap-2">
                        <Lock className="w-6 h-6 text-gray-500" />
                        <span className="text-[9px] font-mono text-gray-600 tracking-widest">ENCRYPTED</span>
                    </div>
                </div>
            )}

            {/* Badge image */}
            <div className="relative z-10 w-24 h-24 mx-auto rounded-xl mb-4 mt-2 overflow-hidden ring-1 ring-white/10 group-hover:ring-green-500/40 transition-all">
                <img
                    src={badge.image}
                    alt={badge.name}
                    className="w-full h-full object-cover"
                />
                {/* Diagonal sweep on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Info */}
            <h4 className="font-mono font-bold text-center text-white truncate text-sm tracking-tight relative z-10">
                {badge.name.toUpperCase()}
            </h4>
            <p className="text-[10px] text-center text-gray-500 mt-1 line-clamp-2 h-8 relative z-10 font-mono leading-relaxed">
                {badge.description}
            </p>

            {/* XP chip */}
            <div className="mt-3 flex justify-center relative z-10">
                <span
                    className="text-[10px] font-bold px-3 py-1 rounded-full font-mono"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                >
                    [{badge.attributes.find(a => a.traitType === 'Points')?.value || 0} XP]
                </span>
            </div>
        </div>
    );
}

// ─── Badge Detail Modal ─────────────────────────────────────────────────────
function BadgeDetailModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
    const cfg = RARITY_CONFIG[badge.rarity];

    return (
        <div
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#070709] border rounded-2xl p-6 max-w-sm w-full relative overflow-hidden"
                onClick={e => e.stopPropagation()}
                style={{
                    borderColor: cfg.border,
                    boxShadow: `0 0 60px ${cfg.color}15`,
                }}
            >
                {/* Scanlines */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-10 z-0"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
                    }}
                />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <h3 className="text-xl font-bold font-mono text-white tracking-tight">
                                {badge.name.toUpperCase()}
                            </h3>
                            <div
                                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold"
                                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                            >
                                {cfg.icon} {cfg.label}
                            </div>
                        </div>
                        <button onClick={onClose} className="text-xs font-mono text-gray-500 hover:text-white transition-colors">
                            [X]
                        </button>
                    </div>

                    {/* Image */}
                    <div
                        className="w-36 h-36 mx-auto mb-5 rounded-xl overflow-hidden border shadow-lg"
                        style={{ borderColor: cfg.border }}
                    >
                        <img
                            src={badge.image}
                            className="w-full h-full object-cover"
                            alt={badge.name}
                        />
                    </div>

                    {/* Description */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                        <p className="text-gray-300 text-xs font-mono leading-relaxed italic">
                            &ldquo;{badge.description}&rdquo;
                        </p>
                    </div>

                    {/* Attributes */}
                    <div className="space-y-2 mb-5">
                        {badge.attributes.map((attr, i) => (
                            <div key={i} className="flex justify-between items-center px-1 py-1.5 border-b border-white/5 last:border-0">
                                <span className="text-[11px] text-gray-500 font-mono">{attr.traitType}</span>
                                <span className="text-[11px] font-bold font-mono" style={{ color: cfg.color }}>{attr.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Mint status */}
                    {badge.owned ? (
                        <div className="space-y-2">
                            {badge.mintAddress && (
                                <div className="text-[10px] font-mono text-gray-600 flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Mint: {badge.mintAddress}
                                </div>
                            )}
                            <button
                                className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}10)`,
                                    color: cfg.color,
                                    border: `1px solid ${cfg.border}`,
                                }}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    View on Solana Explorer
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-4 rounded-xl bg-white/3 border border-white/5">
                            <Lock className="w-5 h-5 text-gray-600 mx-auto mb-2" />
                            <p className="text-[10px] font-mono text-gray-500 tracking-wider">BADGE LOCKED — COMPLETE MISSIONS TO DECRYPT</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Gallery Export ────────────────────────────────────────────────────
interface BadgeGalleryProps {
    ownedBadgeIds?: string[];
}

export default function BadgeGallery({ ownedBadgeIds = [] }: BadgeGalleryProps) {
    const [filter, setFilter] = useState<'all' | 'owned' | BadgeRarity>('all');
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

    // Mark badges as owned based on passed IDs
    const badges = useMemo(() =>
        MATRIX_BADGES.map(b => ({
            ...b,
            owned: ownedBadgeIds.includes(b.id) || ownedBadgeIds.includes(b.type),
        })),
        [ownedBadgeIds]
    );

    const ownedCount = badges.filter(b => b.owned).length;
    const totalCount = badges.length;

    const filteredBadges = badges.filter(badge => {
        if (filter === 'all') return true;
        if (filter === 'owned') return badge.owned;
        return badge.rarity === filter;
    });

    const playGlitch = () => {
        try { MatrixSounds.click(); } catch { /* no-op */ }
    };

    return (
        <div className="space-y-6">
            {/* Progress header */}
            <div className="p-4 rounded-2xl bg-white/3 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4ade80]/10 flex items-center justify-center border border-[#4ade80]/20">
                        <Trophy className="w-5 h-5 text-[#4ade80]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold font-mono text-white tracking-wider">SKILL TREE // BADGE ARCHIVE</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                            <span>DECRYPTED: {ownedCount}/{totalCount}</span>
                            <span className="text-gray-700">|</span>
                            <span className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-[#4ade80]" />
                                {ownedCount > 0 ? 'SYSTEM COMPROMISED' : 'FIREWALL INTACT'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="hidden sm:block w-32">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full transition-all duration-700"
                            style={{ width: `${(ownedCount / totalCount) * 100}%` }}
                        />
                    </div>
                    <div className="text-[9px] font-mono text-gray-600 mt-1 text-right">
                        {Math.round((ownedCount / totalCount) * 100)}%
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                    { value: 'all', label: 'ALL FILES' },
                    { value: 'owned', label: 'DECRYPTED' },
                    { value: 'legendary', label: '⚡ ANOMALY' },
                    { value: 'epic', label: '🔮 OPERATOR' },
                    { value: 'rare', label: '💻 HACKER' },
                    { value: 'common', label: '📺 INITIATE' },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => {
                            playGlitch();
                            setFilter(tab.value as typeof filter);
                        }}
                        className={`
                            px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all whitespace-nowrap
                            ${filter === tab.value
                                ? 'bg-[#4ade80] text-black shadow-[0_0_12px_rgba(74,222,128,0.4)]'
                                : 'bg-white/5 text-gray-500 hover:text-white border border-transparent hover:border-white/10'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredBadges.map(badge => (
                    <BadgeCard
                        key={badge.id}
                        badge={badge}
                        onClick={() => {
                            if (badge.owned) playGlitch();
                            setSelectedBadge(badge);
                        }}
                    />
                ))}
            </div>

            {/* Empty state */}
            {filteredBadges.length === 0 && (
                <div className="text-center py-16">
                    <Lock className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm font-mono text-gray-600">No badges match this filter.</p>
                </div>
            )}

            {/* Detail modal */}
            {selectedBadge && (
                <BadgeDetailModal
                    badge={selectedBadge}
                    onClose={() => setSelectedBadge(null)}
                />
            )}

            {/* Metaplex info footer */}
            <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="text-[10px] font-mono text-gray-600 tracking-wider">
                    BADGES MINTED AS METAPLEX CORE NFTs ON SOLANA · PROGRAMMABLE · COMPOSABLE · EVOLVING
                </p>
            </div>
        </div>
    );
}
