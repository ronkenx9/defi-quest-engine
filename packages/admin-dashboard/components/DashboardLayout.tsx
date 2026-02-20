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

                    {/* Grid Background Ambience */}
                    <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]">
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'linear-gradient(to right, #4ade80 1px, transparent 1px), linear-gradient(to bottom, #4ade80 1px, transparent 1px)',
                            backgroundSize: '40px 40px'
                        }}></div>
                    </div>

                    {/* Mobile Header */}
                    <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#000000] border-b border-[#4ade80]/30 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <h1 className="text-lg font-bold font-mono text-[#4ade80] flex items-center gap-2 tracking-tighter">
                                <Terminal className="w-4 h-4" />
                                MATRIX_ADMIN
                            </h1>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 text-[#4ade80]/50 hover:text-[#4ade80] transition-colors"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </header>

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div className="md:hidden fixed inset-0 z-40 bg-[#000000]/95 backdrop-blur-sm pt-16 border-r border-[#4ade80]/30">
                            <nav className="p-4 flex flex-col gap-1">
                                <MobileNavLink href="/" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/missions/manage" icon={<Target size={18} />} label="Missions" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/missions/create" icon={<Zap size={18} />} label="Create_Mission" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/badges" icon={<Award size={18} />} label="NFT_Badges" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/analytics" icon={<BarChart2 size={18} />} label="Analytics" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/overseer" icon={<Brain size={18} />} label="Overseer_AI" onClick={() => setMobileMenuOpen(false)} />
                                <MobileNavLink href="/leaderboard" icon={<Trophy size={18} />} label="Leaderboard" onClick={() => setMobileMenuOpen(false)} />
                            </nav>
                            <div className="p-4 border-t border-[#4ade80]/20 mt-4">
                                <UserMenu />
                            </div>
                        </div>
                    )}

                    {/* Bottom Navigation (Mobile) */}
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#000000] border-t border-[#4ade80]/30 px-2 py-2 safe-area-bottom">
                        <div className="flex items-center justify-around">
                            <BottomNavItem href="/" icon={<LayoutDashboard size={20} />} label="SYS_HOME" />
                            <BottomNavItem href="/missions/manage" icon={<Target size={20} />} label="DB_OPS" />
                            <BottomNavItem href="/missions/create" icon={<Zap size={20} />} label="EXEC_NEW" highlight />
                            <BottomNavItem href="/analytics" icon={<BarChart2 size={20} />} label="METRICS" />
                            <BottomNavItem href="/overseer" icon={<Brain size={20} />} label="AI_CORE" />
                        </div>
                    </nav>

                    {/* Desktop Sidebar */}
                    <aside className="w-72 hidden md:flex flex-col fixed h-full z-10 p-0 border-r border-[#4ade80]/20 bg-[#000000]">
                        <div className="flex-1 flex flex-col p-6">
                            {/* Logo */}
                            <div className="mb-12 mt-2">
                                <h1 className="text-2xl font-black font-mono text-[#4ade80] flex items-center gap-3 tracking-tighter uppercase whitespace-nowrap">
                                    <Terminal className="w-6 h-6" />
                                    MATRIX_ADMIN
                                </h1>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 bg-[#4ade80] animate-pulse"></div>
                                    <p className="text-[10px] text-[#4ade80]/60 font-mono tracking-[0.2em] uppercase">V2.0_SECURE_LINK</p>
                                </div>
                            </div>

                            {/* Nav */}
                            <nav className="flex-1 flex flex-col gap-1.5">
                                <NavLink href="/" icon={<LayoutDashboard size={16} />} label="Dashboard" />
                                <NavLink href="/missions/manage" icon={<Target size={16} />} label="Missions_DB" />
                                <NavLink href="/missions/create" icon={<Zap size={16} />} label="Inject_Payload" />
                                <NavLink href="/badges" icon={<Award size={16} />} label="NFT_Archive" />
                                <NavLink href="/analytics" icon={<BarChart2 size={16} />} label="Telemetry" />
                                <NavLink href="/leaderboard" icon={<Trophy size={16} />} label="Global_Rank" />
                                <NavLink href="/overseer" icon={<Brain size={16} />} label="Overseer_AI" />
                            </nav>

                            {/* User Menu */}
                            <div className="mt-auto pt-6 border-t border-[#4ade80]/20 border-dashed">
                                <UserMenu />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 md:ml-72 p-4 md:p-8 z-10 relative overflow-x-hidden min-h-screen pt-16 md:pt-8 pb-24 md:pb-8 bg-[#000000]">
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
                group flex items-center gap-4 px-4 py-3 transition-all font-mono tracking-widest text-xs uppercase
                ${active
                    ? 'text-[#000000] bg-[#4ade80] font-bold border-l-4 border-white'
                    : 'text-[#4ade80]/50 hover:text-[#4ade80] border-l-[1px] border-[#4ade80]/10 hover:border-[#4ade80]/50 hover:bg-[#4ade80]/5'}
            `}
        >
            <span className={`relative z-10 transition-transform duration-200 ${active ? 'scale-110' : ''}`}>{icon}</span>
            <span className="relative z-10">{label}</span>
            {active && <span className="ml-auto font-mono text-[10px] tracking-tighter opacity-70">_ACTIVE</span>}
        </a>
    );
}

function MobileNavLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <a
            href={href}
            onClick={onClick}
            className="flex items-center gap-4 px-4 py-3 font-mono text-sm uppercase text-[#4ade80]/60 hover:text-[#4ade80] hover:bg-[#4ade80]/10 transition-all border-l border-transparent hover:border-[#4ade80]"
        >
            <span>{icon}</span>
            <span>{label}</span>
        </a>
    );
}

function BottomNavItem({ href, icon, label, highlight = false }: { href: string; icon: React.ReactNode; label: string; highlight?: boolean }) {
    return (
        <a
            href={href}
            className={`
                flex flex-col items-center justify-center p-2 rounded-none transition-all font-mono tracking-tight text-[10px] uppercase gap-1
                ${highlight
                    ? 'text-[#000000] bg-[#4ade80] border border-[#4ade80]'
                    : 'text-[#4ade80]/40 hover:text-[#4ade80]'}
            `}
        >
            {icon}
            <span>{label}</span>
        </a>
    );
}
