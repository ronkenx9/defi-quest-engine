'use client';

import { useState } from 'react';
import { LayoutDashboard, Target, Zap, BarChart2, Trophy, Menu, X, Award, Terminal, Gamepad2, Brain } from 'lucide-react';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthGuard } from './AuthGuard';
import { UserMenu } from './UserMenu';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex min-h-screen bg-background text-white selection:bg-primary/30 relative">

                    {/* Background Ambience */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-accent/15 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[60px]"></div>
                        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[50px]"></div>
                    </div>

                    {/* Mobile Header */}
                    <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/[0.04] px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 flex items-center gap-2 tracking-tighter">
                                <div className="w-8 h-8 rounded-lg bg-green-900/20 border border-green-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                                    <Terminal className="w-4 h-4 text-green-400" />
                                </div>
                                MATRIX PROTOCOL
                            </h1>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </header>

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-16">
                            <nav className="p-4 space-y-2">
                                <MobileNavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/missions/manage" icon={<Target size={20} />} label="Missions" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/missions/create" icon={<Zap size={20} />} label="Create Mission" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/badges" icon={<Award size={20} />} label="NFT Badges" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/analytics" icon={<BarChart2 size={20} />} label="Analytics" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/overseer" icon={<Brain size={20} />} label="Overseer AI" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/leaderboard" icon={<Trophy size={20} />} label="Leaderboard" onClick={() => setMobileMenuOpen(false)} />
                            </nav>
                            <div className="p-4 border-t border-white/[0.06]">
                                <UserMenu />
                            </div>
                        </div>
                    )}

                    {/* Bottom Navigation (Mobile) */}
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/[0.04] px-2 py-2 safe-area-bottom">
                        <div className="flex items-center justify-around">
                            <BottomNavItem href="/" icon={<LayoutDashboard size={20} />} label="Home" />
                            <BottomNavItem href="/missions/manage" icon={<Target size={20} />} label="Missions" />
                            <BottomNavItem href="/missions/create" icon={<Zap size={20} />} label="Create" highlight />
                            <BottomNavItem href="/analytics" icon={<BarChart2 size={20} />} label="Stats" />
                            <BottomNavItem href="/overseer" icon={<Brain size={20} />} label="AI" />
                        </div>
                    </nav>

                    {/* Desktop Sidebar */}
                    <aside className="w-72 hidden md:flex flex-col fixed h-full z-10 p-4">
                        <div className="flex-1 glass-panel rounded-2xl flex flex-col p-5 border border-white/[0.04] backdrop-blur-md bg-surface/80">
                            {/* Logo */}
                            <div className="mb-12 px-1 mt-1">
                                <h1 className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 filter drop-shadow-[0_0_15px_rgba(74,222,128,0.3)] flex items-center gap-3 tracking-tighter">
                                    <div className="w-9 h-9 rounded-xl bg-green-900/20 border border-green-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.2)]">
                                        <Terminal className="w-5 h-5 text-green-400" />
                                    </div>
                                    MATRIX PROTOCOL
                                </h1>
                                <p className="text-[10px] text-secondary/70 font-display tracking-[0.2em] mt-2 uppercase pl-12">Engine v2.0</p>
                            </div>

                            {/* Nav */}
                            <nav className="flex-1 space-y-1.5">
                                <NavLink href="/" icon={<LayoutDashboard size={19} />} label="Dashboard" />
                                <NavLink href="/missions/manage" icon={<Target size={19} />} label="Missions" />
                                <NavLink href="/missions/create" icon={<Zap size={19} />} label="Create Mission" />
                                <NavLink href="/badges" icon={<Award size={19} />} label="NFT Badges" />
                                <NavLink href="/analytics" icon={<BarChart2 size={19} />} label="Analytics" />
                                <NavLink href="/leaderboard" icon={<Trophy size={19} />} label="Leaderboard" />
                                <NavLink href="/overseer" icon={<Brain size={19} />} label="Overseer AI" />
                            </nav>

                            {/* User Menu */}
                            <div className="mt-auto pt-6 border-t border-white/[0.04]">
                                <UserMenu />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 md:ml-72 p-4 md:p-6 z-10 relative overflow-x-hidden min-h-screen pt-16 md:pt-6 pb-24 md:pb-6">
                        {children}
                    </main>
                </div>
            </AuthGuard>
        </AuthProvider>
    );
}

function NavLink({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <a
            href={href}
            className={`
                group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden
                ${active
                    ? 'text-white shadow-glow bg-white/5 border border-primary/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:border hover:border-white/10'}
            `}
        >
            {/* Hover Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${active ? 'opacity-100' : ''}`}></div>

            <span className={`relative z-10 group-hover:scale-110 transition-transform duration-300 ${active ? 'scale-110 drop-shadow-[0_0_8px_rgba(199,242,132,0.5)]' : ''}`}>{icon}</span>
            <span className={`relative z-10 font-medium tracking-wide font-display ${active ? 'text-primary' : ''}`}>{label}</span>

            {/* Active Indicator */}
            {active && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full shadow-[0_0_10px_#C7F284]"></div>
            )}
        </a>
    );
}

function MobileNavLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <a
            href={href}
            onClick={onClick}
            className="flex items-center gap-4 px-4 py-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-all"
        >
            <span className="text-primary">{icon}</span>
            <span className="font-medium font-display text-lg">{label}</span>
        </a>
    );
}

function BottomNavItem({ href, icon, label, highlight = false }: { href: string; icon: React.ReactNode; label: string; highlight?: boolean }) {
    return (
        <a
            href={href}
            className={`
                flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
                ${highlight
                    ? 'text-black bg-glow-gradient shadow-glow-sm'
                    : 'text-gray-400 hover:text-white'}
            `}
        >
            {icon}
            <span className="text-[10px] font-medium">{label}</span>
        </a>
    );
}



