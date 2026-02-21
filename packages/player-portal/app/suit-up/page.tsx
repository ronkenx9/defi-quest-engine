'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Shield, Sword, Box, Award, ChevronRight, Zap, Trophy, Star, Pencil, Camera, Check, X as XIcon } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { MatrixSounds } from '@/lib/sounds';
import NFTForge from '@/components/player/NFTForge';
import CosmeticsStore from '@/components/player/CosmeticsStore';
import OnChainExplorer from '@/components/player/OnChainExplorer';
import ProfileNFTVisualizer from '@/components/player/ProfileNFTVisualizer';
import BadgeGallery from '@/components/player/BadgeGallery';

const PROFILE_STORAGE_KEY = 'matrix-player-profile';

interface PlayerProfile {
    displayName: string;
    avatarUrl: string | null;
}

export default function SuitUpPage() {
    const { walletAddress, connect, connecting } = useWallet();
    const { userStats, loading } = usePlayer();
    const [activeTab, setActiveTab] = useState<'stats' | 'badges' | 'inventory' | 'explorer' | 'store'>('stats');

    // Profile state
    const [profile, setProfile] = useState<PlayerProfile>({ displayName: '', avatarUrl: null });
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load profile from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined' && walletAddress) {
            const stored = localStorage.getItem(`${PROFILE_STORAGE_KEY}-${walletAddress}`);
            if (stored) {
                try {
                    setProfile(JSON.parse(stored));
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }, [walletAddress]);

    // Save profile to localStorage
    const saveProfile = (newProfile: PlayerProfile) => {
        if (typeof window !== 'undefined' && walletAddress) {
            localStorage.setItem(`${PROFILE_STORAGE_KEY}-${walletAddress}`, JSON.stringify(newProfile));
            setProfile(newProfile);
            MatrixSounds.success();
        }
    };

    const handleNameSave = () => {
        if (tempName.trim()) {
            saveProfile({ ...profile, displayName: tempName.trim() });
        }
        setIsEditingName(false);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Convert to base64 for localStorage storage
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                saveProfile({ ...profile, avatarUrl: dataUrl });
            };
            reader.readAsDataURL(file);
        }
    };

    const displayName = profile.displayName || (userStats as any)?.username || `${walletAddress?.slice(0, 6)}...${walletAddress?.slice(-4)}`;

    if (!walletAddress) {
        return (
            <div className="min-h-screen">
                <PlayerNavbar />
                <main className="max-w-4xl mx-auto px-4 py-20 text-center">
                    <div className="p-12 rounded-3xl border border-[#22c55e]/30 bg-gradient-to-b from-[#22c55e]/10 to-transparent relative overflow-hidden group">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-[#22c55e]/10 blur-[80px] pointer-events-none" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 mb-6 relative">
                                <div className="absolute inset-0 bg-[#22c55e] blur-xl opacity-20 animate-pulse rounded-full" />
                                <div className="relative w-full h-full bg-[#050507] rounded-full border border-[#22c55e]/50 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)] overflow-hidden">
                                    <img src="/images/default-avatar.svg" alt="Matrix Avatar" className="w-16 h-16" />
                                </div>
                            </div>
                            <h2 className="text-3xl font-bold mb-4 text-white">ACCESS DENIED</h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto text-lg space-y-2">
                                You must authenticate your operator status. <br />
                                <span className="text-[#22c55e]">Jupiter Mobile connection recommended.</span>
                            </p>
                            <button
                                onClick={connect}
                                disabled={connecting}
                                className="relative overflow-hidden w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-[#22c55e] via-[#10b981] to-[#3b82f6] text-white font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 group/btn shadow-[0_0_40px_rgba(34,197,94,0.2)]"
                            >
                                <div className="absolute inset-0 bg-white/20 group-hover/btn:translate-x-full transition-transform duration-700 -skew-x-12 -ml-8" />
                                <span className="relative flex items-center justify-center gap-2">
                                    {connecting ? 'Establishing Link...' : 'Connect Jupiter Mobile'}
                                </span>
                            </button>
                            <button
                                onClick={connect}
                                className="mt-6 text-sm text-gray-500 hover:text-gray-300 transition-colors underline decoration-dotted underline-offset-4"
                            >
                                Use other wallets
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507]">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Hidden file input for avatar upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    {/* Visual NFT Hero Section */}
                    <div className="w-full lg:w-2/3">
                        <ProfileNFTVisualizer
                            level={userStats?.level || 1}
                            rank={userStats?.total_points && userStats.total_points > 5000 ? 'OPERATOR' : 'NOVICE'}
                            avatarUrl={profile.avatarUrl}
                        />
                    </div>

                    <div className="w-full lg:w-1/3 flex flex-col gap-6">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <button
                                    onClick={() => setActiveTab('explorer')}
                                    className="bg-[#4ade80]/10 hover:bg-[#4ade80]/20 text-[#4ade80] px-3 py-1 rounded text-[10px] font-bold tracking-widest border border-[#4ade80]/20 transition-all"
                                >
                                    VIEW ON-CHAIN
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative group/avatar cursor-pointer" onClick={handleAvatarClick}>
                                    <div className="absolute -inset-1 bg-gradient-to-r from-[#4ade80] to-[#22c55e] rounded-full blur opacity-25 group-hover/avatar:opacity-50 transition duration-1000"></div>
                                    <div className="relative w-20 h-20 rounded-full bg-[#0a0f0a] border border-[#4ade80]/30 flex items-center justify-center overflow-hidden">
                                        {profile.avatarUrl ? (
                                            <Image src={profile.avatarUrl} alt="Avatar" fill className="object-cover" />
                                        ) : (
                                            <img src="/images/default-avatar.svg" alt="Avatar" className="w-12 h-12" />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white">{displayName}</h2>
                                        <button onClick={() => { setTempName(displayName); setIsEditingName(true); }} className="hover:text-[#4ade80] transition-colors">
                                            <Pencil className="w-3 h-3 text-gray-500" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-[#4ade80] font-mono tracking-widest uppercase opacity-60">ID://SYS_{walletAddress?.slice(0, 8)}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500 uppercase tracking-widest">Progress to Level {(userStats?.level || 1) + 1}</span>
                                    <span className="text-[#4ade80] font-mono">{userStats?.total_points || 0} XP</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#4ade80] to-[#22c55e] shadow-[0_0_10px_#4ade80]"
                                        style={{ width: `${Math.min((userStats?.total_points || 0) % 1000 / 10, 100)}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                        <div className="text-[10px] text-gray-600 uppercase mb-1">Total Rank</div>
                                        <div className="text-sm font-bold text-white">#1,242</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                                        <div className="text-[10px] text-gray-600 uppercase mb-1">Missions</div>
                                        <div className="text-sm font-bold text-white">{userStats?.total_missions_completed || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] mb-4 text-purple-400 flex items-center gap-2 uppercase">
                                <Award className="w-3 h-3" />
                                Recent Badges
                            </h3>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center grayscale opacity-40">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center grayscale opacity-40">
                                    <Star className="w-5 h-5 text-purple-500" />
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-black/20 border border-white/5 flex items-center justify-center text-[10px] text-gray-600">
                                    +0
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 mb-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'stats' ? 'text-[#4ade80]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        STATS
                        {activeTab === 'stats' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4ade80] shadow-[0_0_10px_#4ade80]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('badges')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'badges' ? 'text-[#f43f5e]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        BADGES
                        {activeTab === 'badges' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#f43f5e] shadow-[0_0_10px_#f43f5e]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'inventory' ? 'text-[#4ade80]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        THE FORGE
                        {activeTab === 'inventory' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4ade80] shadow-[0_0_10px_#4ade80]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('explorer')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'explorer' ? 'text-[#4ade80]' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        EXPLORER
                        {activeTab === 'explorer' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#4ade80] shadow-[0_0_10px_#4ade80]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`px-8 py-4 text-sm font-bold tracking-widest transition-all relative ${activeTab === 'store' ? 'text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        STORE
                        {activeTab === 'store' && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,1)]"></div>}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'stats' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">DEFENSE</h3>
                                        <Shield className="w-5 h-5 text-[#4ade80] opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">0 <span className="text-xs text-gray-500">INITIATED</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[10%] h-full bg-[#4ade80]"></div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">OFFENSE</h3>
                                        <Sword className="w-5 h-5 text-[#4ade80] opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">0 <span className="text-xs text-gray-500">INITIATED</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[15%] h-full bg-[#4ade80]"></div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">LUCK</h3>
                                        <Star className="w-5 h-5 text-yellow-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">5 <span className="text-xs text-gray-400">BASE</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[5%] h-full bg-yellow-500"></div>
                                    </div>
                                </div>
                                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#4ade80]/50 transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-bold tracking-widest text-[#4ade80]">HACKING</h3>
                                        <Zap className="w-5 h-5 text-[#4ade80] opacity-50 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2">0 <span className="text-xs text-gray-500">INITIATED</span></div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="w-[12%] h-full bg-[#4ade80]"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'badges' && (
                            <BadgeGallery />
                        )}

                        {activeTab === 'inventory' && (
                            <NFTForge />
                        )}

                        {activeTab === 'explorer' && (
                            <OnChainExplorer />
                        )}

                        {activeTab === 'store' && (
                            <CosmeticsStore />
                        )}
                    </div>

                    {/* Sidebar / Equipment Area */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#4ade80]/10 to-transparent border border-[#4ade80]/20">
                            <h3 className="text-sm font-bold tracking-[0.2em] mb-6 text-white flex items-center gap-2">
                                <ChevronRight className="w-4 h-4 text-[#4ade80]" />
                                ACTIVE EFFECTS
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-[#4ade80]/10">
                                    <div>
                                        <div className="text-xs font-bold text-[#4ade80] mb-1">STREAK_BONUS</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider">Passive Multiplier</div>
                                    </div>
                                    <div className="text-[#4ade80] font-bold">1.2x</div>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 animate-pulse">
                                    <div className="text-xs font-bold text-gray-500 mb-1">EMPTY_SLOT</div>
                                    <div className="text-[10px] text-gray-700 uppercase tracking-wider">No Augment Active</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                            <h3 className="text-sm font-bold tracking-[0.2em] mb-4 text-white">UPCOMING REWARDS</h3>
                            <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#4ade80]/20 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-[#4ade80]" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-gray-300">Level 10 Badge</div>
                                        <div className="text-[10px] text-[#4ade80] uppercase tracking-wider">Locked</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
                .animate-scan {
                    animation: scan 4s linear infinite;
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
