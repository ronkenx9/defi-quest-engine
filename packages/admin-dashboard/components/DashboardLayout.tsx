'use client';

import { LayoutDashboard, Target, Zap, BarChart2, Trophy, Activity } from 'lucide-react';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthGuard } from './AuthGuard';
import { UserMenu } from './UserMenu';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <AuthProvider>
            <AuthGuard>
                <div className="flex min-h-screen bg-background text-white selection:bg-primary/30 relative">

                    {/* Background Ambience - Optimized blur values */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-accent/15 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[60px]"></div>
                        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[50px]"></div>
                    </div>

                    {/* Sidebar */}
                    <aside className="w-72 hidden md:flex flex-col fixed h-full z-10 p-4">
                        <div className="flex-1 glass-panel rounded-2xl flex flex-col p-5 border border-white/[0.04] backdrop-blur-md bg-surface/80">
                            {/* Logo */}
                            <div className="mb-12 px-1 mt-1">
                                <h1 className="text-2xl font-bold font-display text-transparent bg-clip-text bg-glow-gradient filter drop-shadow-glow flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-glow-gradient flex items-center justify-center shadow-glow-sm">
                                        <Zap className="w-5 h-5 text-black" fill="currentColor" />
                                    </div>
                                    JVM QUEST
                                </h1>
                                <p className="text-[10px] text-secondary/70 font-display tracking-[0.2em] mt-2 uppercase pl-12">Engine v2.0</p>
                            </div>

                            {/* Nav */}
                            <nav className="flex-1 space-y-1.5">
                                <NavLink href="/" icon={<LayoutDashboard size={19} />} label="Dashboard" />
                                <NavLink href="/missions/manage" icon={<Target size={19} />} label="Missions" />
                                <NavLink href="/missions/create" icon={<Zap size={19} />} label="Create Mission" />
                                <NavLink href="/analytics" icon={<BarChart2 size={19} />} label="Analytics" />
                                <NavLink href="/leaderboard" icon={<Trophy size={19} />} label="Leaderboard" />
                            </nav>

                            {/* User Menu */}
                            <div className="mt-auto pt-6 border-t border-white/[0.04]">
                                <UserMenu />
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 md:ml-72 p-6 z-10 relative overflow-x-hidden min-h-screen">
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
