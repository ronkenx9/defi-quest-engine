'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { getAllBadges, BadgeRarity, RARITY_CONFIG, Badge } from '@/lib/badgeData';
import { useWallet } from '@/contexts/WalletContext';

// ─── Badge Card ─────────────────────────────────────────────────────────────
function BadgeCard({ badge, onClick }: { badge: Badge; onClick: () => void }) {
    const cfg = RARITY_CONFIG[badge.rarity];

    return (
        <div
            className={`
                group relative rounded-2xl p-4 transition-all duration-300 cursor-pointer overflow-hidden
                ${badge.owned
                    ? 'hover:translate-y-[-4px] hover:scale-[1.02]'
                    : 'grayscale-[0.5] hover:grayscale-[0.3] hover:translate-y-[-2px]'
                }
            `}
            style={{
                background: badge.owned ? 'rgba(8, 8, 12, 0.9)' : 'rgba(12, 12, 18, 0.95)',
                border: `1px solid ${badge.owned ? cfg.border : 'rgba(100, 100, 120, 0.2)'}`,
                boxShadow: badge.owned ? cfg.glow : 'inset 0 0 30px rgba(0,0,0,0.5)',
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
                className={`absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-bold z-30 ${!badge.owned ? 'opacity-60' : ''}`}
                style={{
                    background: badge.owned ? cfg.bg : 'rgba(40, 40, 50, 0.8)',
                    color: badge.owned ? cfg.color : '#666',
                    border: `1px solid ${badge.owned ? cfg.border : 'rgba(100,100,120,0.3)'}`,
                }}
            >
                {cfg.icon}
                {cfg.label}
            </div>

            {/* Locked overlay */}
            {!badge.owned && (
                <div className="absolute inset-0 z-20 rounded-2xl pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30 rounded-2xl" />
                    <div
                        className="absolute inset-0 opacity-[0.06] rounded-2xl"
                        style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(150,150,160,0.5) 12px, rgba(150,150,160,0.5) 13px)',
                        }}
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span className="text-[8px] font-mono text-gray-500 tracking-[0.15em] font-bold">LOCKED</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Badge image */}
            <div className={`relative z-10 w-24 h-24 mx-auto rounded-xl mb-4 mt-2 overflow-hidden transition-all ${badge.owned
                ? 'ring-1 ring-white/10 group-hover:ring-green-500/40'
                : 'ring-1 ring-white/5 opacity-40 hover:opacity-60 grayscale-[0.5]'
                }`}>
                <img
                    src={badge.image}
                    alt={badge.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/badges/red-pill.png';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {/* Info */}
            <h4 className={`font-mono font-bold text-center truncate text-sm tracking-tight relative z-10 ${badge.owned ? 'text-white' : 'text-gray-400'
                }`}>
                {badge.name.toUpperCase()}
            </h4>
            <p className={`text-[10px] text-center mt-1 line-clamp-2 h-8 relative z-10 font-mono leading-relaxed ${badge.owned ? 'text-gray-500' : 'text-gray-600'
                }`}>
                {badge.description}
            </p>

            {/* XP chip */}
            <div className="mt-3 flex justify-center relative z-10">
                <span
                    className={`text-[10px] font-bold px-3 py-1 rounded-full font-mono ${!badge.owned ? 'opacity-60' : ''}`}
                    style={{
                        background: badge.owned ? cfg.bg : 'rgba(40,40,50,0.5)',
                        color: badge.owned ? cfg.color : '#555',
                        border: `1px solid ${badge.owned ? cfg.border : 'rgba(80,80,100,0.2)'}`,
                    }}
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
                <div
                    className="absolute inset-0 pointer-events-none opacity-10 z-0"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.3) 1px, rgba(0,0,0,0.3) 2px)',
                    }}
                />

                <div className="relative z-10">
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

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-4">
                        <p className="text-gray-300 text-xs font-mono leading-relaxed italic">
                            &ldquo;{badge.description}&rdquo;
                        </p>
                    </div>

                    <div className="space-y-2 mb-5">
                        {badge.attributes.map((attr, i) => (
                            <div key={i} className="flex justify-between items-center px-1 py-1.5 border-b border-white/5 last:border-0">
                                <span className="text-[11px] text-gray-500 font-mono">{attr.traitType}</span>
                                <span className="text-[11px] font-bold font-mono" style={{ color: cfg.color }}>{attr.value}</span>
                            </div>
                        ))}
                    </div>

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
                                onClick={() => window.open(`https://explorer.solana.com/address/${badge.mintAddress}?cluster=devnet`, '_blank')}
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

export default function BadgeGallery({ ownedBadgeIds }: BadgeGalleryProps) {
    const [filter, setFilter] = useState<'all' | 'owned' | BadgeRarity>('all');
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const { walletAddress } = useWallet();
    const [onChainBadges, setOnChainBadges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        async function loadRealBadges() {
            if (!walletAddress) return;
            setIsLoading(true);
            try {
                const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
                const { DASClient } = await import('@defi-quest/core');
                const dasClient = new DASClient(rpcUrl);

                const assets = await dasClient.getAssetsByOwner(walletAddress);
                const badgeNFTs = assets.filter(asset =>
                    asset.content?.metadata?.name?.includes('Badge')
                );

                const realBadges = badgeNFTs.map((nftRaw: any) => {
                    const nft = nftRaw as any;
                    // Properly extract from DAS interface (attributeList)
                    const attrs = nft.attributes?.attributeList || [];
                    return {
                        id: nft.id, // Use mint address as ID
                        name: nft.content?.metadata?.name || 'Unknown Badge',
                        image: nft.content?.files?.[0]?.uri || '/badges/default.png',
                        description: nft.content?.metadata?.description || '',
                        rarity: (attrs.find((a: any) => a.trait_type?.toLowerCase() === 'rarity')?.value?.toLowerCase() || 'common') as BadgeRarity,
                        attributes: attrs.map((a: any) => ({ traitType: a.trait_type, value: a.value })),
                        owned: true,
                        mintAddress: nft.id,
                        isRealNFT: true
                    };
                });

                setOnChainBadges(realBadges);
            } catch (error) {
                console.error('Failed to load badges from Metaplex:', error);
            } finally {
                setIsLoading(false);
            }
        }
        loadRealBadges();
    }, [walletAddress]);

    const badges = useMemo(() => {
        const staticList = getAllBadges();
        let availableOnChain = [...onChainBadges];

        // Mark static badges as owned if they match an on-chain badge
        const mergedList = staticList.map(b => {
            const rarityLabel = RARITY_CONFIG[b.rarity].label;
            const matchIndex = availableOnChain.findIndex(oc =>
                oc.name === b.name ||
                oc.name.includes(b.name) ||
                b.name.includes(oc.name) ||
                oc.name.toLowerCase().includes(rarityLabel.toLowerCase())
            );

            if (matchIndex !== -1) {
                const onChainMatch = availableOnChain[matchIndex];
                // Remove it from available so we don't map one on-chain NFT to multiple static badges
                availableOnChain.splice(matchIndex, 1);
                // Keep the static image but use the on-chain mint data
                return { ...b, ...onChainMatch, owned: true, image: b.image, name: b.name };
            }

            // For hackathon preview respect local storage / mock IDs
            if (ownedBadgeIds && (ownedBadgeIds.includes(b.id) || ownedBadgeIds.includes(b.type))) {
                return { ...b, owned: true };
            }
            return { ...b, owned: false };
        });

        // Add any remaining on-chain badges that didn't match a static template
        return [...mergedList, ...availableOnChain];
    }, [onChainBadges, ownedBadgeIds]);

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
