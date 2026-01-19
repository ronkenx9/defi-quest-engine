'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/contexts/WalletContext';

const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/missions', label: 'Missions' },
    { href: '/swap', label: 'Swap' },
    { href: '/skills', label: 'Skills' },
    { href: '/leaderboard', label: 'Ranks' },
    { href: '/prophecies', label: 'Prophecies' },
    { href: '/season', label: 'Season' },
    { href: '/story', label: 'Story' },
    { href: '/badges', label: 'Badges' },
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
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-[#4ade80] text-xl">◆</span>
                    <span className="font-bold text-lg tracking-wide">MATRIX</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden lg:flex items-center gap-1 text-sm">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`px-3 py-1.5 rounded-lg transition-colors ${pathname === link.href
                                ? 'text-[#4ade80] bg-[#4ade80]/10'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Wallet Connection */}
                {walletAddress ? (
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 text-[#4ade80] text-sm font-mono">
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
                    <button
                        onClick={connect}
                        disabled={connecting}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#22c55e] to-[#10b981] text-black font-bold text-sm hover:shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all disabled:opacity-50"
                    >
                        {connecting ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                )}
            </div>
        </nav>
    );
}
