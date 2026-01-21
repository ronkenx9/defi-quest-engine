'use client';

import { ReactNode } from 'react';
import { WalletProvider } from '@/contexts/WalletContext';
import { ActivityTicker } from '@/components/player/ActivityTicker';

/**
 * Player Portal Layout
 * Public-facing layout for users to view their progress, missions, and badges
 * 
 * TODO: Upgrade to Wallet Standard when monorepo module resolution is fixed
 * See: solana-dev skill - frontend-framework-kit.md
 */
export default function PlayerLayout({ children }: { children: ReactNode }) {
    return (
        <WalletProvider>
            <div className="min-h-screen bg-[#050507] text-white font-mono">
                {/* Matrix-style background grid */}
                <div
                    className="fixed inset-0 pointer-events-none opacity-5"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(74, 222, 128, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(74, 222, 128, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Main content */}
                <div className="relative z-10">
                    {children}

                    {/* Activity Ticker - Fixed at bottom */}
                    <div className="fixed bottom-0 left-0 right-0 z-50">
                        <ActivityTicker speed={40} showLive={true} />
                    </div>
                </div>
            </div>
        </WalletProvider>
    );
}
