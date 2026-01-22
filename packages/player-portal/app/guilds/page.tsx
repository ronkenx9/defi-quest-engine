'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Trophy, Crown, Plus, LogIn, LogOut } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';

interface Guild {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    leader_wallet: string;
    total_xp: number;
    member_count: number;
    created_at: string;
    guild_members?: GuildMember[];
}

interface GuildMember {
    wallet_address: string;
    role: string;
    xp_contributed: number;
}

export default function GuildsPage() {
    const { walletAddress } = useWallet();
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [loading, setLoading] = useState(true);
    const [userGuild, setUserGuild] = useState<Guild | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildDesc, setNewGuildDesc] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchGuilds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/guilds');
            const data = await res.json();
            setGuilds(data.guilds || []);

            // Check if user is in a guild
            if (walletAddress) {
                const userG = data.guilds?.find((g: Guild) =>
                    g.guild_members?.some(m => m.wallet_address === walletAddress)
                );
                setUserGuild(userG || null);
            }
        } catch (error) {
            console.error('Error fetching guilds:', error);
        } finally {
            setLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchGuilds();
    }, [fetchGuilds]);

    const handleCreateGuild = async () => {
        if (!walletAddress || !newGuildName.trim()) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/guilds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newGuildName.trim(),
                    description: newGuildDesc.trim(),
                    leaderWallet: walletAddress,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to create guild');
                return;
            }

            setShowCreateModal(false);
            setNewGuildName('');
            setNewGuildDesc('');
            fetchGuilds();
        } catch (error) {
            console.error('Error creating guild:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinGuild = async (guildId: string) => {
        if (!walletAddress) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/guilds/${guildId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress }),
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to join guild');
                return;
            }

            fetchGuilds();
        } catch (error) {
            console.error('Error joining guild:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveGuild = async () => {
        if (!walletAddress || !userGuild) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/guilds/${userGuild.id}?wallet=${walletAddress}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Failed to leave guild');
                return;
            }

            setUserGuild(null);
            fetchGuilds();
        } catch (error) {
            console.error('Error leaving guild:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                            // TEAM UP
                        </p>
                        <h1 className="text-3xl font-bold mb-2">
                            <span className="text-white">GUILD </span>
                            <span className="text-[#4ade80]">WARS</span>
                        </h1>
                        <p className="text-gray-400">
                            Join a guild, compete together, share rewards.
                        </p>
                    </div>

                    {walletAddress && !userGuild && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#4ade80] text-black font-bold rounded-lg hover:bg-[#22c55e] transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Guild
                        </button>
                    )}
                </div>

                {/* User's Guild Card */}
                {userGuild && (
                    <div className="mb-8 p-6 rounded-xl border-2 border-[#4ade80] bg-[#4ade80]/10">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                                    <Crown className="w-8 h-8 text-[#4ade80]" />
                                </div>
                                <div>
                                    <p className="text-sm text-[#4ade80]">Your Guild</p>
                                    <h2 className="text-2xl font-bold text-white">{userGuild.name}</h2>
                                    <p className="text-sm text-gray-400">{userGuild.member_count} members</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-[#4ade80]">
                                    {userGuild.total_xp.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">Total XP</p>
                                {userGuild.leader_wallet !== walletAddress && (
                                    <button
                                        onClick={handleLeaveGuild}
                                        disabled={actionLoading}
                                        className="mt-2 flex items-center gap-1 text-sm text-red-400 hover:text-red-300"
                                    >
                                        <LogOut className="w-4 h-4" /> Leave
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Guild Leaderboard */}
                <div className="rounded-xl border border-gray-800 overflow-hidden">
                    <div className="bg-[#0a0f0a] p-4 border-b border-gray-800">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Guild Leaderboard
                        </h3>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading guilds...</div>
                    ) : guilds.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No guilds yet. Be the first to create one!
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800">
                            {guilds.map((guild, idx) => (
                                <div
                                    key={guild.id}
                                    className={`p-4 flex items-center justify-between ${guild.id === userGuild?.id ? 'bg-[#4ade80]/5' : 'hover:bg-gray-800/30'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? 'bg-yellow-500 text-black' :
                                            idx === 1 ? 'bg-gray-300 text-black' :
                                                idx === 2 ? 'bg-orange-400 text-black' :
                                                    'bg-gray-700 text-gray-300'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white">{guild.name}</h4>
                                            <p className="text-sm text-gray-500">
                                                <Users className="w-3 h-3 inline mr-1" />
                                                {guild.member_count} members • Leader: {truncateAddress(guild.leader_wallet)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="font-bold text-[#4ade80]">
                                                {guild.total_xp.toLocaleString()} XP
                                            </p>
                                        </div>

                                        {walletAddress && !userGuild && (
                                            <button
                                                onClick={() => handleJoinGuild(guild.id)}
                                                disabled={actionLoading}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-[#4ade80]/20 text-[#4ade80] rounded-lg hover:bg-[#4ade80]/30 text-sm font-bold"
                                            >
                                                <LogIn className="w-4 h-4" /> Join
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!walletAddress && (
                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Connect your wallet to create or join a guild
                    </div>
                )}
            </main>

            {/* Create Guild Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-[#0a0f0a] border border-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Create Guild</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Guild Name</label>
                                <input
                                    type="text"
                                    value={newGuildName}
                                    onChange={(e) => setNewGuildName(e.target.value)}
                                    maxLength={50}
                                    placeholder="Enter guild name..."
                                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-[#4ade80] outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Description</label>
                                <textarea
                                    value={newGuildDesc}
                                    onChange={(e) => setNewGuildDesc(e.target.value)}
                                    placeholder="What's your guild about?"
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-[#4ade80] outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGuild}
                                disabled={actionLoading || !newGuildName.trim()}
                                className="flex-1 px-4 py-2 bg-[#4ade80] text-black font-bold rounded-lg hover:bg-[#22c55e] disabled:opacity-50"
                            >
                                {actionLoading ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
