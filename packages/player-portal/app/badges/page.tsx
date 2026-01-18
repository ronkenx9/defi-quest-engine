'use client';

import { useState, useEffect, useCallback } from 'react';
import { Crown, Gem, Star, Medal, Trophy } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface Badge {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    image_url: string;
    mint_address?: string;
    earned_at: string;
}

const rarityStyles: Record<string, { border: string; bg: string; glow: string }> = {
    common: { border: 'border-gray-500', bg: 'bg-gray-500/10', glow: '' },
    rare: { border: 'border-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]' },
    epic: { border: 'border-purple-500', bg: 'bg-purple-500/10', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' },
    legendary: { border: 'border-yellow-500', bg: 'bg-yellow-500/10', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]' },
};

export default function BadgesPage() {
    const { walletAddress } = useWallet();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchBadges = useCallback(async (address: string) => {
        setLoading(true);

        const { data, error } = await supabase
            .from('user_badges')
            .select('*')
            .eq('wallet_address', address)
            .order('earned_at', { ascending: false });

        if (!error) {
            setBadges(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchBadges(walletAddress);
        } else {
            setBadges([]);
        }
    }, [walletAddress, fetchBadges]);

    const sampleBadges: Badge[] = [
        { id: '1', name: 'First Swap', description: 'Complete your first Jupiter swap', rarity: 'common', image_url: '', earned_at: '' },
        { id: '2', name: 'Volume King', description: 'Trade $10,000 in volume', rarity: 'rare', image_url: '', earned_at: '' },
        { id: '3', name: 'Streak Master', description: 'Maintain a 30-day streak', rarity: 'epic', image_url: '', earned_at: '' },
        { id: '4', name: 'The One', description: 'Reach Level 50', rarity: 'legendary', image_url: '', earned_at: '' },
    ];

    const displayBadges = walletAddress ? badges : sampleBadges;

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // THE ARCHIVES
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">NFT </span>
                        <span className="text-[#4ade80]">BADGES</span>
                    </h1>
                    <p className="text-gray-400">
                        Your Metaplex NFT achievement collection. Each badge is minted on Solana.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse"
                            />
                        ))}
                    </div>
                ) : displayBadges.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {displayBadges.map((badge) => {
                            const style = rarityStyles[badge.rarity] || rarityStyles.common;
                            return (
                                <div
                                    key={badge.id}
                                    className={`
                                        aspect-square rounded-xl border-2 ${style.border} ${style.bg} ${style.glow}
                                        p-4 flex flex-col items-center justify-center text-center
                                        transition-transform hover:scale-105 cursor-pointer
                                        ${!walletAddress ? 'opacity-50' : ''}
                                    `}
                                >
                                    <div className="mb-3">
                                        {badge.rarity === 'legendary' ? <Crown className="w-10 h-10 text-yellow-400 mx-auto" /> :
                                            badge.rarity === 'epic' ? <Gem className="w-10 h-10 text-purple-400 mx-auto" /> :
                                                badge.rarity === 'rare' ? <Star className="w-10 h-10 text-blue-400 mx-auto" /> :
                                                    <Medal className="w-10 h-10 text-gray-400 mx-auto" />}
                                    </div>

                                    <h3 className="font-bold text-white text-sm mb-1">{badge.name}</h3>

                                    <span className={`text-xs uppercase font-bold ${badge.rarity === 'legendary' ? 'text-yellow-400' :
                                        badge.rarity === 'epic' ? 'text-purple-400' :
                                            badge.rarity === 'rare' ? 'text-blue-400' : 'text-gray-400'
                                        }`}>
                                        {badge.rarity}
                                    </span>

                                    {badge.mint_address && (
                                        <a
                                            href={`https://solscan.io/token/${badge.mint_address}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 text-xs text-[#4ade80] hover:underline"
                                        >
                                            View on Solscan →
                                        </a>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Trophy className="w-12 h-12 text-[#4ade80] mx-auto mb-4" />
                        <p className="text-gray-500">No badges earned yet.</p>
                        <p className="text-sm text-gray-600 mt-2">Complete missions to unlock NFT badges!</p>
                    </div>
                )}

                <div className="mt-12 p-6 rounded-xl border border-[#4ade80]/10 bg-[#0a0f0a]/50">
                    <h3 className="text-sm font-bold text-gray-400 mb-4">RARITY LEVELS</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(rarityStyles).map(([rarity, style]) => (
                            <div
                                key={rarity}
                                className={`p-3 rounded-lg border ${style.border} ${style.bg} text-center`}
                            >
                                <span className="text-sm font-bold capitalize">{rarity}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {!walletAddress && (
                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Connect your wallet to view your earned badges
                    </div>
                )}
            </main>
        </div>
    );
}
