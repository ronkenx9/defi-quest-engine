'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';
import { Target, Zap, Users, Award, ListOrdered, BookOpen, Shield, Wine, Dices, Menu, X } from 'lucide-react';
import { useState } from 'react';

const mainNav = [
    { href: '/', label: 'Hub', icon: Zap },
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
            <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--void)]/90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="flex items-center justify-between h-14">
                        {/* ── Logo ── */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--magenta)] flex items-center justify-center text-[var(--void)] font-black text-xs shadow-lg group-hover:shadow-[var(--glow-cyan)] transition-shadow">
                                DQ
                            </div>
                            <div className="hidden sm:block">
                                <span className="font-['Orbitron'] font-bold text-sm tracking-wider text-white">DEFI</span>
                                <span className="font-['Orbitron'] font-bold text-sm tracking-wider text-[var(--cyan)]">QUEST</span>
                            </div>
                        </Link>

                        {/* ── Main Nav (desktop) ── */}
                        <div className="hidden md:flex items-center gap-1">
                            {mainNav.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${isActive(link.href)
                                            ? 'text-[var(--cyan)] bg-[var(--cyan-dim)] border border-[var(--cyan)]/20'
                                            : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--void-elevated)]'
                                        }`}
                                >
                                    <link.icon className="w-3.5 h-3.5" />
                                    {link.label}
                                </Link>
                            ))}

                            {/* Separator */}
                            <div className="w-px h-6 bg-[var(--border)] mx-1"></div>

                            {/* Secondary nav (compressed) */}
                            <div className="hidden xl:flex items-center gap-0.5">
                                {secondaryNav.map(link => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide uppercase transition-all ${isActive(link.href)
                                                ? 'text-[var(--cyan)] bg-[var(--cyan-dim)]'
                                                : 'text-[var(--text-muted)] hover:text-white'
                                            }`}
                                    >
                                        <link.icon className="w-3 h-3" />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* ── Right: Wallet + Mobile Toggle ── */}
                        <div className="flex items-center gap-2">
                            {walletAddress ? (
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1.5 rounded-lg bg-[var(--cyan-dim)] border border-[var(--cyan)]/20 text-[var(--cyan)] text-xs font-mono flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse-glow"></span>
                                        {truncateAddress(walletAddress)}
                                    </div>
                                    <button
                                        onClick={disconnect}
                                        className="px-2.5 py-1.5 rounded-lg border border-[var(--magenta)]/20 text-[var(--magenta)] text-xs hover:bg-[var(--magenta-dim)] transition-colors font-semibold"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={connect}
                                    disabled={connecting}
                                    className="group relative px-4 py-1.5 rounded-lg bg-gradient-to-r from-[var(--cyan)] to-[#00c4cc] text-[var(--void)] font-['Orbitron'] font-bold text-[10px] tracking-widest uppercase overflow-hidden transition-all disabled:opacity-50 hover:shadow-[var(--glow-cyan)]"
                                >
                                    <span className="relative z-10">Connect</span>
                                </button>
                            )}

                            {/* Mobile hamburger */}
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="md:hidden p-2 text-[var(--text-muted)] hover:text-white"
                            >
                                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile dropdown ── */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-[var(--border)] bg-[var(--void)] p-4 space-y-1 animate-fade-in">
                        {[...mainNav, ...secondaryNav].map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${isActive(link.href)
                                        ? 'text-[var(--cyan)] bg-[var(--cyan-dim)]'
                                        : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--void-elevated)]'
                                    }`}
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                )}
            </nav>

            {/* Neon line under nav */}
            <div className="neon-line"></div>
        </>
    );
}
