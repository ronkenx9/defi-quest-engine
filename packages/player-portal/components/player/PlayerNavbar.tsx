'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { Target, Zap, Users, Award, ListOrdered, BookOpen, Shield, Wine, Dices, Menu, X, Eye } from 'lucide-react';
import { useState } from 'react';

const mainNav = [
    { href: '/', label: 'Dashboard' },
    { href: '/missions', label: 'Missions', icon: Target },
    { href: '/swap', label: 'Swap', icon: Zap },
    { href: '/suit-up', label: 'Suit Up', icon: Shield },
];

const secondaryNav = [
    { href: '/guilds', label: 'Guilds', icon: Users },
    { href: '/badges', label: 'Badges', icon: Award },
    { href: '/leaderboard', label: 'Ranks', icon: ListOrdered },
    { href: '/tavern', label: 'Tavern', icon: Wine },
    { href: '/casino', label: 'Casino', icon: Dices },
    { href: '/story', label: 'Story', icon: BookOpen },
];

export default function PlayerNavbar() {
    const pathname = usePathname();
    const { walletAddress, connecting, connect, disconnect } = useWallet();
    const [mobileOpen, setMobileOpen] = useState(false);

    const truncateAddress = (address: string) =>
        `${address.slice(0, 4)}…${address.slice(-4)}`;

    const isActive = (href: string) => pathname === href;

    return (
        <>
            <nav className="sticky top-0 z-50 border-b border-[#4ade80]/10 bg-[#050507]/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* ── Logo ── */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <span className="text-[#4ade80] text-xl drop-shadow-[0_0_8px_#4ade80] group-hover:drop-shadow-[0_0_16px_#4ade80] transition-all">◆</span>
                            <span className="font-['Orbitron'] font-bold text-sm tracking-wider text-white">MATRIX</span>
                        </Link>

                        {/* ── Main Nav (desktop) ── */}
                        <div className="hidden md:flex items-center gap-1">
                            {mainNav.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${isActive(link.href)
                                            ? 'text-[#4ade80] bg-[#4ade80]/10 border border-[#4ade80]/20'
                                            : 'text-gray-400 hover:text-white hover:bg-[#0a0f0a]'
                                        }`}
                                >
                                    {link.icon && <link.icon className="w-3.5 h-3.5" />}
                                    {link.label}
                                </Link>
                            ))}

                            <div className="w-px h-6 bg-[#4ade80]/15 mx-1"></div>

                            <div className="hidden xl:flex items-center gap-0.5">
                                {secondaryNav.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide uppercase transition-all ${isActive(link.href)
                                                ? 'text-[#4ade80] bg-[#4ade80]/10'
                                                : 'text-gray-400 hover:text-white'
                                            }`}
                                    >
                                        <link.icon className="w-3 h-3" />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* ── Wallet + Mobile Toggle ── */}
                        <div className="flex items-center gap-2">
                            {walletAddress ? (
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-xs font-mono flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse"></span>
                                        {truncateAddress(walletAddress)}
                                    </div>
                                    <button
                                        onClick={disconnect}
                                        className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-xs hover:bg-red-500/10 transition-colors font-semibold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={connect}
                                    disabled={connecting}
                                    className="group relative px-4 py-1.5 rounded-lg bg-[#0a140a] border border-[#4ade80]/50 text-[#4ade80] font-['Orbitron'] font-bold text-[10px] tracking-widest uppercase overflow-hidden transition-all disabled:opacity-50 hover:bg-[#4ade80]/20 hover:shadow-[0_0_15px_rgba(74,222,128,0.2)]"
                                >
                                    <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -ml-4" />
                                    <span className="relative flex items-center gap-2">🪐 CONNECT</span>
                                </button>
                            )}

                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="md:hidden p-2 text-gray-400 hover:text-white"
                            >
                                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileOpen && (
                    <div className="md:hidden border-t border-[#4ade80]/10 bg-[#050507] p-4 space-y-1 animate-fade-in">
                        {[...mainNav, ...secondaryNav].map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive(link.href)
                                        ? 'text-[#4ade80] bg-[#4ade80]/10'
                                        : 'text-gray-400 hover:text-white hover:bg-[#0a0f0a]'
                                    }`}
                            >
                                {link.icon && <link.icon className="w-4 h-4" />}
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>
            <div className="neon-line"></div>
        </>
    );
}
