'use client';

import { useState, useEffect, useRef } from 'react';
import { Award, Clock, Gift, Check, Lock, ChevronRight, ChevronLeft, Zap, Sparkles, TrendingUp } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';
import { MatrixSounds } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';

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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

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
                    reward_track: (seasonData.reward_track as SeasonReward[]).sort((a, b) => a.tier - b.tier),
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

        MatrixSounds.click();
        const response = await fetch('/api/season/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, tier }),
        });

        if (response.ok && progress) {
            MatrixSounds.success();
            setProgress({
                ...progress,
                claimed_tiers: [...progress.claimed_tiers, tier],
            });
        }
    };

    const getRewardIcon = (type: string, rarity?: string) => {
        const colorClass = rarity === 'legendary' ? 'text-yellow-400' : rarity === 'rare' ? 'text-blue-400' : 'text-[#4ade80]';
        switch (type) {
            case 'badge': return <Award className={`w-8 h-8 ${colorClass}`} />;
            case 'xp': return <Zap className={`w-8 h-8 ${colorClass}`} />;
            case 'multiplier': return <TrendingUp className={`w-8 h-8 ${colorClass}`} />;
            default: return <Gift className={`w-8 h-8 ${colorClass}`} />;
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            MatrixSounds.click();
        }
    };

    // Calculate overall progress percentage across the track
    const totalTiers = season?.reward_track.length || 10;
    const currentTierIndex = season?.reward_track.findIndex(r => r.tier > (progress?.current_tier || 0));
    const activeTierIndex = currentTierIndex === -1 ? totalTiers : currentTierIndex;
    const trackPercentage = (activeTierIndex / totalTiers) * 100;

    return (
        <div className="min-h-screen bg-[#050507] crt-overlay">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {loading ? (
                    <div className="animate-pulse space-y-8 mt-12">
                        <div className="h-48 rounded-3xl bg-white/5 border border-white/5" />
                        <div className="h-96 rounded-3xl bg-white/5 border border-white/5" />
                    </div>
                ) : !season ? (
                    <div className="text-center py-24 opacity-50">
                        <Clock className="w-16 h-16 mx-auto mb-6 text-gray-600" />
                        <h2 className="text-2xl font-bold font-['Orbitron'] text-white">SEASON OFFLINE</h2>
                        <p className="mt-2 text-gray-500 font-mono">Archive protocols are currently restricted. Awaiting new orders.</p>
                    </div>
                ) : (
                    <>
                        {/* Season Dashboard Header */}
                        <div className="mb-12 relative overflow-hidden rounded-3xl border border-[#4ade80]/20 bg-black/40 p-8 group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                <TrendingUp className="w-64 h-64 text-[#4ade80]" />
                            </div>

                            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 rounded-md bg-[#4ade80]/10 border border-[#4ade80]/30">
                                            <Sparkles className="w-4 h-4 text-[#4ade80]" />
                                        </div>
                                        <span className="text-[10px] font-mono text-[#4ade80] tracking-[0.4em] uppercase">Season://Active</span>
                                    </div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2">
                                        {season.name}
                                    </h1>
                                    <p className="text-gray-400 max-w-xl text-sm leading-relaxed mb-6">
                                        {season.description}
                                    </p>

                                    <div className="flex flex-wrap gap-6 items-center">
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[160px]">
                                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Current Progress</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-white">{progress?.season_xp.toLocaleString()}</span>
                                                <span className="text-xs text-[#4ade80] font-mono">XP</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[160px]">
                                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Clearance Level</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-black text-[#4ade80]">Tier {progress?.current_tier}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-2 text-[#4ade80] font-mono text-xs mb-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        TIME LEFT IN CYCLE
                                    </div>
                                    <div className="flex gap-2">
                                        {[
                                            { label: 'DAYS', val: timeRemaining.days },
                                            { label: 'HRS', val: timeRemaining.hours },
                                            { label: 'MIN', val: timeRemaining.minutes }
                                        ].map(t => (
                                            <div key={t.label} className="bg-black/60 border border-white/10 p-2 px-4 rounded-xl text-center min-w-[80px]">
                                                <div className="text-2xl font-black text-white leading-none">{t.val.toString().padStart(2, '0')}</div>
                                                <div className="text-[8px] text-gray-500 mt-1 font-mono">{t.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Horizontal Battle Pass Track */}
                        <div className="relative mb-12">
                            <div className="flex items-center justify-between mb-6 px-2">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-black text-white tracking-widest uppercase">Reward Track</h2>
                                    <div className="h-[1px] w-24 bg-[#4ade80]/30 hidden md:block" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => scroll('left')} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-colors">
                                        <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                    </button>
                                    <button onClick={() => scroll('right')} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-colors">
                                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                    </button>
                                </div>
                            </div>

                            {/* Scroll Area */}
                            <div className="relative">
                                {/* Track Connection Line */}
                                <div className="absolute top-[84px] left-0 right-0 h-4 bg-white/5 border-y border-white/10 pointer-events-none" />
                                <div
                                    className="absolute top-[84px] left-0 h-4 bg-gradient-to-r from-[#4ade80]/40 to-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.5)] z-10 transition-all duration-1000 ease-out pointer-events-none"
                                    style={{ width: `${trackPercentage}%` }}
                                />

                                <div
                                    ref={scrollContainerRef}
                                    className="flex gap-6 overflow-x-auto pb-8 pt-4 px-2 no-scrollbar scroll-smooth"
                                >
                                    {season.reward_track.map((reward, idx) => {
                                        const isUnlocked = (progress?.season_xp || 0) >= reward.xp_required;
                                        const isClaimed = progress?.claimed_tiers.includes(reward.tier);
                                        const isNext = !isUnlocked && (idx === 0 || (season.reward_track[idx - 1].xp_required <= (progress?.season_xp || 0)));

                                        return (
                                            <div
                                                key={reward.tier}
                                                className={`flex-shrink-0 w-64 flex flex-col items-center group transition-all duration-500 ${!isUnlocked && !isNext ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
                                            >
                                                {/* Tier Bubble */}
                                                <div className="relative z-20 mb-10">
                                                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-xl ${isClaimed ? 'bg-[#4ade80] border-[#4ade80] text-black' :
                                                            isUnlocked ? 'bg-black border-[#4ade80] text-[#4ade80] glow-green' :
                                                                isNext ? 'bg-[#4ade80]/10 border-[#4ade80]/50 text-[#4ade80] animate-pulse-glow' :
                                                                    'bg-black border-white/20 text-gray-600'
                                                        }`}>
                                                        {isClaimed ? <Check className="w-6 h-6" /> : <span className="text-sm font-black font-mono">{reward.tier}</span>}
                                                    </div>

                                                    {/* XP Label above bubble */}
                                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                                        <span className={`text-[9px] font-mono leading-none ${isUnlocked ? 'text-[#4ade80]' : 'text-gray-600'}`}>
                                                            {reward.xp_required.toLocaleString()} XP
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Reward Card */}
                                                <motion.div
                                                    whileHover={{ y: -5 }}
                                                    className={`w-full relative rounded-2xl border p-5 overflow-hidden transition-all duration-300 ${isClaimed ? 'bg-[#4ade80]/5 border-[#4ade80]/30' :
                                                            isUnlocked ? 'bg-white/5 border-[#4ade80]/50 shadow-[0_10px_30px_rgba(74,222,128,0.05)]' :
                                                                isNext ? 'bg-white/5 border-[#4ade80]/20' :
                                                                    'bg-black/40 border-white/5'
                                                        }`}
                                                >
                                                    {/* Rarity Glow */}
                                                    {reward.rarity === 'legendary' && (
                                                        <div className="absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 bg-yellow-500/20 rounded-full blur-3xl pointer-events-none" />
                                                    )}

                                                    <div className="relative z-10 flex flex-col items-center text-center">
                                                        <div className={`w-16 h-16 rounded-2xl mb-4 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isUnlocked ? 'bg-[#4ade80]/10' : 'bg-white/5'
                                                            }`}>
                                                            {isUnlocked || isNext ? getRewardIcon(reward.reward_type, reward.rarity) : <Lock className="w-8 h-8 text-gray-700" />}
                                                        </div>

                                                        <div className="space-y-1 mb-4">
                                                            <div className={`text-[10px] font-mono uppercase tracking-[0.2em] ${reward.rarity === 'legendary' ? 'text-yellow-400' :
                                                                    reward.rarity === 'rare' ? 'text-blue-400' :
                                                                        'text-gray-500'
                                                                }`}>
                                                                {reward.rarity || 'Common'} {reward.reward_type}
                                                            </div>
                                                            <h4 className="font-black text-white leading-tight uppercase">
                                                                {reward.reward_value}
                                                            </h4>
                                                        </div>

                                                        {isUnlocked && !isClaimed && (
                                                            <button
                                                                onClick={() => handleClaim(reward.tier)}
                                                                className="w-full py-2 rounded-xl bg-[#4ade80] text-black font-black text-[10px] uppercase tracking-widest hover:bg-[#5bff95] transition-all shadow-[0_5px_15px_rgba(74,222,128,0.3)] hover:scale-[1.02]"
                                                            >
                                                                Claim Data
                                                            </button>
                                                        )}

                                                        {isClaimed && (
                                                            <div className="flex items-center gap-1.5 py-2 text-[#4ade80] font-mono text-[9px] uppercase tracking-widest">
                                                                <Check className="w-3 h-3" />
                                                                Secured
                                                            </div>
                                                        )}

                                                        {!isUnlocked && !isNext && (
                                                            <div className="flex items-center gap-1.5 py-2 text-gray-600 font-mono text-[9px] uppercase tracking-widest">
                                                                <Lock className="w-3 h-3" />
                                                                Restricted
                                                            </div>
                                                        )}

                                                        {isNext && !isUnlocked && (
                                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                                                                <div
                                                                    className="h-full bg-[#4ade80]/40"
                                                                    style={{ width: `${Math.min(((progress?.season_xp || 0) / reward.xp_required) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}

                                    {/* Final Stretch Placeholder */}
                                    <div className="flex-shrink-0 w-32 flex items-center justify-center opacity-20">
                                        <TrendingUp className="w-12 h-12 text-gray-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Season Achievements Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 mb-12 animate-slide-up">
                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-[#4ade80]/10 flex items-center justify-center mb-6">
                                    <TrendingUp className="w-7 h-7 text-[#4ade80]" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">XP Multipliers</h3>
                                <p className="text-xs text-gray-500 max-w-xs mb-6 font-mono uppercase tracking-tighter">Current Multiplier Efficiency</p>
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl font-black text-[#4ade80] font-mono">1.5x</div>
                                    <div className="w-[1px] h-10 bg-white/10" />
                                    <div className="text-left">
                                        <div className="text-[10px] text-gray-600 uppercase font-mono tracking-widest">Next Multiplier</div>
                                        <div className="text-xs text-white font-bold font-mono">Tier 15 // 2.0x</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col items-center text-center">
                                <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6">
                                    <Gift className="w-7 h-7 text-yellow-500" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">Claimed Rewards</h3>
                                <p className="text-xs text-gray-500 max-w-xs mb-6 font-mono uppercase tracking-tighter">Total Season Data Secured</p>
                                <div className="flex items-center gap-4">
                                    <div className="text-4xl font-black text-yellow-500 font-mono">{progress?.claimed_tiers.length || 0}</div>
                                    <div className="w-[1px] h-10 bg-white/10" />
                                    <div className="text-left">
                                        <div className="text-[10px] text-gray-600 uppercase font-mono tracking-widest">Total Available</div>
                                        <div className="text-xs text-white font-bold font-mono">{season.reward_track.length} Items</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .glow-green {
                    box-shadow: 0 0 15px rgba(74, 222, 128, 0.4), inset 0 0 5px rgba(74, 222, 128, 0.2);
                }
            `}</style>
        </div>
    );
}
