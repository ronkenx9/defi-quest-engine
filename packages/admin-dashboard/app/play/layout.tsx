'use client';

import { ReactNode } from 'react';
import { WalletProvider } from '@/contexts/WalletContext';

/**
 * Player Portal Layout
 * Public-facing layout for users to view their progress, missions, and badges
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
                </div>
            </div>
        </WalletProvider>
    );
}
