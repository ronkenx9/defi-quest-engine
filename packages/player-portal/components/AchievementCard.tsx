'use client';

import { useState } from 'react';
import { Share2, Twitter, Copy, Check, Award } from 'lucide-react';

interface Badge {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    earned_at?: string;
    rarity?: string;
}

interface AchievementCardProps {
    badge: Badge;
    walletAddress?: string;
}

export default function AchievementCard({ badge, walletAddress }: AchievementCardProps) {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://defi-quest-engine-player-portal.vercel.app'}/badges/${badge.id}`;
    const shareText = `🏆 I just earned the "${badge.name}" badge on JupiterQuest!\n\nComplete DeFi quests and earn XP on Solana 🚀\n\n${shareUrl}`;

    const handleCopyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleTwitterShare = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    };

    const getRarityColor = (rarity?: string) => {
        switch (rarity?.toLowerCase()) {
            case 'legendary': return 'from-yellow-400 via-orange-500 to-red-500';
            case 'epic': return 'from-purple-400 to-purple-600';
            case 'rare': return 'from-blue-400 to-blue-600';
            default: return 'from-[#4ade80] to-[#22c55e]';
        }
    };

    return (
        <div className="relative group">
            {/* Achievement Card */}
            <div className={`relative rounded-xl border border-gray-800 bg-[#0a0f0a] p-4 overflow-hidden transition-all hover:border-[#4ade80]/50 hover:shadow-lg hover:shadow-[#4ade80]/10`}>
                {/* Glow effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${getRarityColor(badge.rarity)}`} />

                {/* Badge Image */}
                <div className="relative flex justify-center mb-4">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getRarityColor(badge.rarity)} p-1`}>
                        <div className="w-full h-full rounded-full bg-[#0a0f0a] flex items-center justify-center">
                            {badge.image_url ? (
                                <img
                                    src={badge.image_url}
                                    alt={badge.name}
                                    className="w-16 h-16 object-contain"
                                />
                            ) : (
                                <Award className="w-12 h-12 text-[#4ade80]" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Badge Info */}
                <div className="text-center mb-4">
                    <h3 className="font-bold text-white mb-1">{badge.name}</h3>
                    {badge.description && (
                        <p className="text-sm text-gray-400 line-clamp-2">{badge.description}</p>
                    )}
                    {badge.rarity && (
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white`}>
                            {badge.rarity}
                        </span>
                    )}
                </div>

                {/* Share Button */}
                <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#4ade80]/10 text-[#4ade80] hover:bg-[#4ade80]/20 transition-colors font-bold text-sm"
                >
                    <Share2 className="w-4 h-4" />
                    Share Achievement
                </button>

                {/* Share Menu */}
                {showShareMenu && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg p-2 shadow-xl z-10">
                        <button
                            onClick={handleTwitterShare}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 text-sm text-white"
                        >
                            <Twitter className="w-4 h-4 text-[#1DA1F2]" />
                            Share on Twitter
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-800 text-sm text-white"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-[#4ade80]" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    Copy Link
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Earned Date */}
                {badge.earned_at && (
                    <p className="text-center text-xs text-gray-500 mt-2">
                        Earned {new Date(badge.earned_at).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    );
}
