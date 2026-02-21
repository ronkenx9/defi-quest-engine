'use client';

import PlayerNavbar from '@/components/player/PlayerNavbar';
import BadgeGallery from '@/components/player/BadgeGallery';

export default function BadgesPage() {
    return (
        <div className="min-h-screen bg-[#050507]">
            <PlayerNavbar />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // THE ARCHIVES
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">NFT </span>
                        <span className="text-[#4ade80]">BADGES</span>
                    </h1>
                    <p className="text-gray-400 text-sm font-mono">
                        Your Metaplex NFT achievement collection. Complete missions to decrypt each badge.
                    </p>
                </div>

                <BadgeGallery />
            </main>
        </div>
    );
}
