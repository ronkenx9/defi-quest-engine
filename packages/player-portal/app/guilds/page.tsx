'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Trophy, Crown, Plus, LogIn, LogOut, Shield, Zap, Search, ChevronRight, Activity, Filter, Globe, Info } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { MatrixSounds } from '@/lib/sounds';
import { motion, AnimatePresence } from 'framer-motion';

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

const FACTION_TYPES = [
    { id: 'resistance', name: 'The Resistance', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.05)', border: 'rgba(74, 222, 128, 0.3)', icon: Shield },
    { id: 'architects', name: 'System Architects', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.05)', border: 'rgba(96, 165, 250, 0.3)', icon: Zap },
    { id: 'nomads', name: 'Digital Nomads', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.05)', border: 'rgba(167, 139, 250, 0.3)', icon: Globe },
    { id: 'enforcers', name: 'Matrix Enforcers', color: '#f87171', bg: 'rgba(248, 113, 113, 0.05)', border: 'rgba(248, 113, 113, 0.3)', icon: Activity },
];

export default function GuildsPage() {
    const { walletAddress } = useWallet();
    const [guilds, setGuilds] = useState<Guild[]>([]);
    const [loading, setLoading] = useState(true);
    const [userGuild, setUserGuild] = useState<Guild | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGuildName, setNewGuildName] = useState('');
    const [newGuildDesc, setNewGuildDesc] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBy, setFilterBy] = useState<'all' | 'top' | 'new'>('all');

    const fetchGuilds = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/guilds');
            const data = await res.json();
            const fetchedGuilds = data.guilds || [];
            setGuilds(fetchedGuilds);

            // Check if user is in a guild
            if (walletAddress) {
                const userG = fetchedGuilds.find((g: Guild) =>
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
        MatrixSounds.click();
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

            MatrixSounds.success();
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
        MatrixSounds.click();
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

            MatrixSounds.success();
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
        MatrixSounds.click();
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

    const filteredGuilds = useMemo(() => {
        let result = [...guilds];

        if (searchQuery) {
            result = result.filter(g =>
                g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterBy === 'top') {
            result.sort((a, b) => b.total_xp - a.total_xp);
        } else if (filterBy === 'new') {
            result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }

        return result;
    }, [guilds, searchQuery, filterBy]);

    const getFaction = (guildId: string) => {
        // Deterministic faction assignment based on ID
        const index = parseInt(guildId.slice(-1), 16) % FACTION_TYPES.length;
        return FACTION_TYPES[index];
    };

    return (
        <div className="min-h-screen bg-[#050507] crt-overlay">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {/* Immersive Header */}
                <div className="mb-12 flex flex-col md:flex-row justify-between items-end gap-8 animate-fade-in">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-1.5 rounded-md bg-[#4ade80]/10 border border-[#4ade80]/30">
                                <Users className="w-4 h-4 text-[#4ade80]" />
                            </div>
                            <span className="text-[10px] font-mono text-[#4ade80] tracking-[0.4em] uppercase">Security://Factions</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mb-2 italic">
                            Guild <span className="text-[#4ade80]">Wars</span>
                        </h1>
                        <p className="text-gray-400 max-w-xl text-sm leading-relaxed">
                            Form alliances, secure the network, and dominate the simulation.
                            Active guilds receive priority data feeds and exclusive reward protocols.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-auto">
                        {walletAddress && !userGuild && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 bg-[#4ade80] text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#5bff95] transition-all shadow-[0_5px_20px_rgba(74,222,128,0.2)] hover:scale-[1.02]"
                            >
                                <Plus className="w-4 h-4" />
                                Create Faction
                            </button>
                        )}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                            <div className="text-right">
                                <div className="text-[8px] text-gray-500 uppercase font-mono leading-none mb-1">Active Guilds</div>
                                <div className="text-sm font-black text-white font-mono">{guilds.length}</div>
                            </div>
                            <div className="w-[1px] h-6 bg-white/10" />
                            <div className="text-left">
                                <div className="text-[8px] text-gray-500 uppercase font-mono leading-none mb-1">Total Network XP</div>
                                <div className="text-sm font-black text-[#4ade80] font-mono">
                                    {guilds.reduce((acc, g) => acc + g.total_xp, 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

                    {/* Active Faction Sidebar (Left) */}
                    <div className="lg:col-span-4 space-y-6">
                        {userGuild ? (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group relative overflow-hidden rounded-3xl border-2 border-[#4ade80] bg-[#4ade80]/5 p-8"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                    <Crown className="w-32 h-32 text-[#4ade80]" />
                                </div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-14 h-14 rounded-2xl bg-[#4ade80] text-black shadow-[0_0_20px_rgba(74,222,128,0.4)] flex items-center justify-center">
                                            <Crown className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-mono text-[#4ade80] uppercase tracking-widest">Your Faction</span>
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">{userGuild.name}</h2>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-end border-b border-[#4ade80]/10 pb-2">
                                            <span className="text-xs text-gray-500 uppercase font-mono">Current XP</span>
                                            <span className="text-xl font-black text-[#4ade80]">{userGuild.total_xp.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#4ade80]/10 pb-2">
                                            <span className="text-xs text-gray-500 uppercase font-mono">Deployments</span>
                                            <span className="text-xl font-black text-white">{userGuild.member_count} Members</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-[#4ade80]/10 pb-2">
                                            <span className="text-xs text-gray-500 uppercase font-mono">Leader</span>
                                            <span className="text-xs font-mono text-gray-300">{truncateAddress(userGuild.leader_wallet)}</span>
                                        </div>
                                    </div>

                                    {userGuild.leader_wallet !== walletAddress ? (
                                        <button
                                            onClick={handleLeaveGuild}
                                            disabled={actionLoading}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" /> De-Authorize Faction
                                        </button>
                                    ) : (
                                        <div className="text-center py-2 px-4 rounded-lg bg-[#4ade80]/10 text-[#4ade80] text-[9px] font-mono uppercase tracking-[0.2em] border border-[#4ade80]/20">
                                            Faction Sovereign Authority
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                                <Globe className="w-16 h-16 text-gray-700 mb-6" />
                                <h3 className="text-lg font-black text-white uppercase mb-2">Un-Aligned Account</h3>
                                <p className="text-xs text-gray-500 font-mono leading-relaxed mb-6">
                                    You have not yet synchronized with a faction protocol. Join an existing archive or initialize your own.
                                </p>
                                {!walletAddress && (
                                    <div className="text-[10px] text-red-500/60 uppercase font-mono tracking-widest animate-pulse">
                                        Neural Link Required
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Recent Activity Mini-Feed */}
                        <div className="rounded-3xl border border-white/5 bg-black/40 p-6 overflow-hidden">
                            <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-[#4ade80]" />
                                Network Traffic
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex gap-3 py-2 border-l border-white/5 pl-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] mt-1 shrink-0" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                                                <span className="text-[#4ade80]">GUILD_TX_{Math.floor(Math.random() * 1000)}</span>: Contribution detected from Agent_{Math.floor(Math.random() * 1000)}
                                            </p>
                                            <span className="text-[8px] text-gray-600 font-mono">2 MINUTES AGO</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Faction Protocols Table (Right) */}
                    <div className="lg:col-span-8 flex flex-col space-y-4">
                        {/* Search & Filter Controls */}
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search Protocols..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2 rounded-xl text-xs text-white focus:outline-none focus:border-[#4ade80]/50 font-mono"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                                {(['all', 'top', 'new'] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => { setFilterBy(f); MatrixSounds.click(); }}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${filterBy === f ? 'bg-[#4ade80]/20 border-[#4ade80] text-[#4ade80]' : 'border-white/10 text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dense Leaderboard Table */}
                        <div className="flex-1 rounded-3xl border border-white/10 bg-black/40 overflow-hidden flex flex-col">
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 text-[9px] font-mono text-gray-500 uppercase tracking-widest bg-white/[0.02]">
                                <div className="col-span-1">RNK</div>
                                <div className="col-span-6">PROTOCOL IDENTIFIER</div>
                                <div className="col-span-2 text-center">AGENTS</div>
                                <div className="col-span-3 text-right">XP_ACCUMULATION</div>
                            </div>

                            <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar divide-y divide-white/5">
                                {loading ? (
                                    <div className="p-12 text-center text-gray-500 animate-pulse font-mono uppercase tracking-[0.3em]">
                                        Scanning Network...
                                    </div>
                                ) : filteredGuilds.length === 0 ? (
                                    <div className="p-24 text-center">
                                        <Search className="w-12 h-12 text-gray-800 mx-auto mb-4" />
                                        <p className="text-gray-600 font-mono text-xs uppercase">No protocols found matching current link criteria.</p>
                                    </div>
                                ) : (
                                    filteredGuilds.map((guild, idx) => {
                                        const faction = getFaction(guild.id);
                                        const FactionIcon = faction.icon;
                                        const isMyGuild = guild.id === userGuild?.id;

                                        return (
                                            <motion.div
                                                key={guild.id}
                                                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                                                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center group transition-colors ${isMyGuild ? 'bg-[#4ade80]/5' : ''
                                                    }`}
                                            >
                                                <div className="col-span-1">
                                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black font-mono ${idx === 0 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' :
                                                        idx === 1 ? 'bg-gray-300 text-black' :
                                                            idx === 2 ? 'bg-orange-400 text-black' :
                                                                'bg-white/5 text-gray-500'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                </div>

                                                <div className="col-span-6 flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-500 group-hover:scale-110"
                                                        style={{ backgroundColor: faction.bg, borderColor: faction.border, color: faction.color }}>
                                                        <FactionIcon className="w-5 h-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h4 className={`font-black uppercase tracking-tight truncate ${isMyGuild ? 'text-[#4ade80]' : 'text-white'}`}>
                                                                {guild.name}
                                                            </h4>
                                                            {isMyGuild && <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">{faction.name}</span>
                                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-[8px] font-mono text-gray-600 truncate">{truncateAddress(guild.leader_wallet)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Users className="w-3 h-3 text-gray-600" />
                                                        <span className="text-xs font-black text-white font-mono">{guild.member_count}</span>
                                                    </div>
                                                </div>

                                                <div className="col-span-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="text-sm font-black text-[#4ade80] font-mono tracking-tighter">
                                                            {guild.total_xp.toLocaleString()}
                                                        </div>
                                                        {!userGuild && walletAddress && (
                                                            <button
                                                                onClick={() => handleJoinGuild(guild.id)}
                                                                className="mt-1 flex items-center gap-1 text-[8px] font-black text-gray-500 hover:text-[#4ade80] uppercase tracking-[0.2em] transition-colors"
                                                            >
                                                                Initialize Link <ChevronRight className="w-2.5 h-2.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Guild Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-[#0a0f0a] border-2 border-[#4ade80]/30 rounded-3xl p-8 w-full max-w-lg relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#4ade80]/20 overflow-hidden">
                                <motion.div
                                    className="h-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]"
                                    animate={{ left: ['-100%', '100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    style={{ width: '40%', position: 'absolute' }}
                                />
                            </div>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-[#4ade80]" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Foundation Protocol</h2>
                                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Registering New Faction Identity</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-mono text-gray-500 mb-2 block uppercase tracking-widest">Protocol Identifier (Name)</label>
                                    <input
                                        type="text"
                                        value={newGuildName}
                                        onChange={(e) => setNewGuildName(e.target.value)}
                                        maxLength={50}
                                        placeholder="REQUIRED: SYSTEM_NAME"
                                        className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80]/20 outline-none font-mono text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="text-[9px] font-mono text-gray-500 mb-2 block uppercase tracking-widest">Operation Briefing (Description)</label>
                                    <textarea
                                        value={newGuildDesc}
                                        onChange={(e) => setNewGuildDesc(e.target.value)}
                                        placeholder="OPTIONAL: Define faction purpose..."
                                        rows={3}
                                        className="w-full px-5 py-4 rounded-xl bg-black/60 border border-white/10 text-white focus:border-[#4ade80] focus:ring-1 focus:ring-[#4ade80]/20 outline-none font-mono text-sm resize-none"
                                    />
                                </div>

                                <div className="p-4 rounded-2xl bg-[#4ade80]/5 border border-dashed border-[#4ade80]/30">
                                    <div className="flex gap-3 items-center">
                                        <Info className="w-4 h-4 text-[#4ade80]" />
                                        <p className="text-[9px] font-mono text-gray-500 leading-relaxed uppercase tracking-widest">
                                            Founding a faction establishes your wallet as the Sovereign Authority. You will be responsible for network expansions and allocation.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-4 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-gray-600 rounded-xl hover:bg-white/5 transition-all"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleCreateGuild}
                                    disabled={actionLoading || !newGuildName.trim()}
                                    className="flex-2 px-10 py-4 bg-[#4ade80] text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-[#5bff95] disabled:opacity-50 transition-all shadow-[0_5px_15px_rgba(74,222,128,0.2)]"
                                >
                                    {actionLoading ? 'Initializing...' : 'Foundation_Execute'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(74, 222, 128, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(74, 222, 128, 0.3);
                }
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .glow-green {
                    box-shadow: 0 0 15px rgba(74, 222, 128, 0.2);
                }
            `}</style>
        </div>
    );
}
