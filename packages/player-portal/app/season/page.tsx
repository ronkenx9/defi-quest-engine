'use client';

import { useState, useEffect } from 'react';
import { Award, Clock, Gift, Check, Lock } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface SeasonReward {
    tier: number;
    xp_required: number;
    reward_type: string;
    reward_value: string | number;
    rarity?: string;
}

interface Season {
    id: string;
    name: string;
    description: string;
    theme: string;
    end_date: string;
    reward_track: SeasonReward[];
}

interface SeasonProgress {
    season_xp: number;
    current_tier: number;
    claimed_tiers: number[];
}

export default function SeasonPage() {
    const { walletAddress } = useWallet();
    const [season, setSeason] = useState<Season | null>(null);
    const [progress, setProgress] = useState<SeasonProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            // Fetch current season
            const { data: seasonData } = await supabase
                .from('seasons')
                .select('*')
                .eq('is_active', true)
                .single();

            if (seasonData) {
                setSeason({
                    ...seasonData,
                    reward_track: seasonData.reward_track as SeasonReward[],
                });

                // Fetch user progress
                if (walletAddress) {
                    const { data: progressData } = await supabase
                        .from('season_progress')
                        .select('season_xp, current_tier, claimed_tiers')
                        .eq('wallet_address', walletAddress)
                        .eq('season_id', seasonData.id)
                        .single();

                    if (progressData) {
                        setProgress(progressData);
                    } else {
                        setProgress({ season_xp: 0, current_tier: 0, claimed_tiers: [] });
                    }
                }
            }

            setLoading(false);
        }

        fetchData();
    }, [walletAddress]);

    useEffect(() => {
        if (!season) return;

        const updateTimer = () => {
            const diff = new Date(season.end_date).getTime() - Date.now();
            if (diff <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeRemaining({ days, hours, minutes });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [season]);

    const handleClaim = async (tier: number) => {
        if (!walletAddress || !season) return;

        const response = await fetch('/api/season/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, tier }),
        });

        if (response.ok && progress) {
            setProgress({
                ...progress,
                claimed_tiers: [...progress.claimed_tiers, tier],
            });
        }
    };

    const getRewardIcon = (type: string) => {
        switch (type) {
            case 'badge': return <Award className="w-5 h-5" />;
            case 'xp': return <Gift className="w-5 h-5" />;
            default: return <Gift className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-40 rounded-xl bg-[#0a0f0a] border border-gray-800" />
                        <div className="h-96 rounded-xl bg-[#0a0f0a] border border-gray-800" />
                    </div>
                ) : !season ? (
                    <div className="text-center py-16 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4" />
                        <p>No active season</p>
                    </div>
                ) : (
                    <>
                        {/* Season Header */}
                        <div className="mb-8 p-6 rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-yellow-400 text-xs tracking-[0.3em] mb-1 font-mono">
                                        // BATTLE PASS
                                    </p>
                                    <h1 className="text-3xl font-bold text-white">{season.name}</h1>
                                    <p className="text-gray-400">{season.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">ENDS IN</p>
                                    <p className="text-2xl font-bold text-yellow-400">
                                        {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                                    </p>
                                </div>
                            </div>

                            {/* XP Progress */}
                            {progress && (
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Season XP: {progress.season_xp.toLocaleString()}</span>
                                        <span className="text-yellow-400">Tier {progress.current_tier}</span>
                                    </div>
                                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                                            style={{
                                                width: `${Math.min((progress.season_xp / 25000) * 100, 100)}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reward Track */}
                        <div className="space-y-3">
                            {season.reward_track.sort((a, b) => a.tier - b.tier).map((reward) => {
                                const isUnlocked = (progress?.season_xp || 0) >= reward.xp_required;
                                const isClaimed = progress?.claimed_tiers.includes(reward.tier);

                                return (
                                    <div
                                        key={reward.tier}
                                        className={`p-4 rounded-xl border transition-all ${isClaimed
                                                ? 'border-green-500/30 bg-green-500/5'
                                                : isUnlocked
                                                    ? 'border-yellow-500/30 bg-yellow-500/5'
                                                    : 'border-gray-800 bg-[#0a0f0a] opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isClaimed
                                                        ? 'bg-green-500 text-black'
                                                        : isUnlocked
                                                            ? 'bg-yellow-500 text-black'
                                                            : 'bg-gray-800 text-gray-500'
                                                    }`}>
                                                    {isClaimed ? (
                                                        <Check className="w-6 h-6" />
                                                    ) : isUnlocked ? (
                                                        getRewardIcon(reward.reward_type)
                                                    ) : (
                                                        <Lock className="w-5 h-5" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white">Tier {reward.tier}</p>
                                                    <p className="text-sm text-gray-400">
                                                        {reward.reward_type === 'badge' && `Badge: ${reward.reward_value}`}
                                                        {reward.reward_type === 'xp' && `${reward.reward_value} Bonus XP`}
                                                        {reward.reward_type === 'multiplier' && `${reward.reward_value}x Multiplier`}
                                                        {reward.reward_type === 'title' && `Title: ${reward.reward_value}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500">Required</p>
                                                    <p className="font-bold text-yellow-400">{reward.xp_required.toLocaleString()} XP</p>
                                                </div>

                                                {isUnlocked && !isClaimed && walletAddress && (
                                                    <button
                                                        onClick={() => handleClaim(reward.tier)}
                                                        className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors"
                                                    >
                                                        Claim
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
