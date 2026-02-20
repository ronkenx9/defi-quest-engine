'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { Terminal, Shield, Wallet, Gamepad2, ChevronRight, Rocket, Wine, Dices, Target, Zap, Users, Award, ListOrdered, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

const navLinks = [
    { href: '/missions', label: 'Missions', icon: Target },
    { href: '/swap', label: 'Swap', icon: Zap },
    { href: '/guilds', label: 'Guilds', icon: Users },
    { href: '/badges', label: 'Badges', icon: Award },
    { href: '/leaderboard', label: 'Ranks', icon: ListOrdered },
    { href: '/story', label: 'Story', icon: BookOpen },
];

/**
 * Player Navbar with persistent wallet connection
 */
export default function PlayerNavbar() {
    const pathname = usePathname();
    const { walletAddress, connecting, connect, disconnect } = useWallet();

    const truncateAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <nav className="border-b border-[#4ade80]/10 bg-[#050507]/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mr-6">
                    <span className="text-[#4ade80] text-xl drop-shadow-[0_0_8px_#4ade80]">◆</span>
                    <span className="font-bold text-lg tracking-wide text-white">MATRIX</span>
                </Link>
                <div className="hidden md:flex items-center gap-4">
                    <Link
                        href="/"
                        className={`flex items-center gap-1.5 text-xs font-bold tracking-wide transition-colors
                            ${pathname === '/' ? 'text-[#4ade80]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        DASHBOARD
                    </Link>
                    <Link
                        href="/suit-up"
                        className={`flex items-center gap-1.5 text-xs font-bold tracking-wide transition-colors
                            ${pathname === '/suit-up' ? 'text-[#4ade80]' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Shield className="w-3.5 h-3.5" />
                        SUIT UP
                    </Link>
                    <Link
                        href="/tavern"
                        className={`flex items-center gap-1.5 text-xs font-bold tracking-wide transition-colors
                            ${pathname === '/tavern' ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Wine className="w-3.5 h-3.5" />
                        TAVERN
                    </Link>
                    <Link
                        href="/casino"
                        className={`flex items-center gap-1.5 text-xs font-bold tracking-wide transition-colors
                            ${pathname === '/casino' ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Dices className="w-3.5 h-3.5" />
                        CASINO
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className="hidden xl:flex items-center gap-0.5 text-xs border-l border-[#4ade80]/20 pl-4 ml-2">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors font-bold tracking-wide ${pathname === link.href
                                ? 'text-[#4ade80] bg-[#4ade80]/10'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            <link.icon className="w-3.5 h-3.5" />
                            {link.label.toUpperCase()}
                        </Link>
                    ))}
                </div>

                {/* Wallet Connection */}
                {walletAddress ? (
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-sm font-mono flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
                            {truncateAddress(walletAddress)}
                        </div>
                        <button
                            onClick={disconnect}
                            className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={connect}
                            disabled={connecting}
                            className="relative group px-4 py-1.5 rounded-lg bg-[#0a140a] border border-[#4ade80]/50 text-[#4ade80] font-bold text-xs uppercase tracking-widest overflow-hidden transition-all disabled:opacity-50 hover:bg-[#4ade80]/20 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                        >
                            <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -ml-4" />
                            <span className="relative flex items-center gap-2">
                                🪐 CONNECT
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
