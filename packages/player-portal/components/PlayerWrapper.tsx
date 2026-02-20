'use client';

import { ReactNode } from 'react';
import { WalletProvider } from '@/contexts/WalletContext';
import { PlayerProvider, usePlayer } from '@/contexts/PlayerContext';
import { ProgramProvider } from '@/contexts/ProgramContext';
import { ActivityTicker } from '@/components/player/ActivityTicker';
import { useWallet } from '@/contexts/WalletContext';
import OnboardingModal from '@/components/player/OnboardingModal';

/**
 * Inner gate that shows the onboarding modal for first-time users
 */
function OnboardingGate({ children }: { children: ReactNode }) {
    const { walletAddress } = useWallet();
    const { showOnboarding, completeOnboarding } = usePlayer();

    return (
        <>
            {children}
            {walletAddress && showOnboarding && (
                <OnboardingModal
                    walletAddress={walletAddress}
                    onComplete={(username, nftAddress) => {
                        completeOnboarding(username, nftAddress);
                    }}
                    onSkip={() => {
                        completeOnboarding('Anon');
                    }}
                />
            )}
        </>
    );
}

/**
 * Player Portal Wrapper - provides WalletContext/PlayerContext/ProgramContext and UI chrome
 */
export default function PlayerWrapper({ children }: { children: ReactNode }) {
    return (
        <WalletProvider>
            <ProgramProvider>
                <PlayerProvider>
                    <OnboardingGate>
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
                            <div className="relative z-10 pb-16">
                                {children}

                                {/* Activity Ticker - Fixed at bottom */}
                                <div className="fixed bottom-0 left-0 right-0 z-50">
                                    <ActivityTicker speed={40} showLive={true} />
                                </div>
                            </div>
                        </div>
                    </OnboardingGate>
                </PlayerProvider>
            </ProgramProvider>
        </WalletProvider>
    );
}
