'use client';

import { BadgeGallery } from '@/components/BadgeGallery';

export default function BadgesPage() {
    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold font-mono text-white tracking-tight">SYSTEM ACCESS // BADGES</h1>
                <p className="text-[var(--text-secondary)] font-mono text-sm">
                    Unlock system privileges. Bypass the firewall. Escape the simulation.
                </p>
            </div>

            {/* Info banner */}
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
                <div className="flex items-start gap-4 relative z-10">
                    <span className="text-2xl animate-pulse">🐇</span>
                    <div>
                        <h3 className="font-bold font-mono text-green-400 text-sm tracking-wider uppercase">Escape the Matrix Edition</h3>
                        <p className="text-xs font-mono text-gray-400 mt-1 max-w-2xl">
                            Collect "Skill Tree" badges to prove your awakening. Each interaction with the blockchain decrypts a piece of the code.
                            Complete the full sequence to escape the simulation.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-3 text-[10px] font-mono uppercase tracking-wider">
                            <span className="text-red-400 flex items-center gap-1">⚡ Anomaly [Legendary]</span>
                            <span className="text-purple-400 flex items-center gap-1">🔮 Operator [Epic]</span>
                            <span className="text-blue-400 flex items-center gap-1">💻 Hacker [Rare]</span>
                            <span className="text-green-400 flex items-center gap-1">📺 Initiate [Common]</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Badge gallery */}
            <BadgeGallery showStats={true} />

            {/* How it works */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <div className="font-mono text-[10px] text-green-500 leading-3">
                        101010101
                        010101010
                        110010101
                    </div>
                </div>

                <h3 className="text-sm font-bold font-mono text-white mb-4 uppercase tracking-wider">DECRYPTION SEQUENCE</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2 relative">
                        <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center text-green-400 font-mono text-xs font-bold">
                            01
                        </div>
                        <h4 className="font-bold font-mono text-white text-sm">Execute Tasks</h4>
                        <p className="text-xs font-mono text-gray-500">
                            Perform on-chain actions (swaps, streaks, limits) to bypass security nodes.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center text-green-400 font-mono text-xs font-bold">
                            02
                        </div>
                        <h4 className="font-bold font-mono text-white text-sm">Mint Access Keys</h4>
                        <p className="text-xs font-mono text-gray-500">
                            Sign the transaction. Mint your skill badge directly to your wallet.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-8 h-8 bg-green-500/10 border border-green-500/30 rounded flex items-center justify-center text-green-400 font-mono text-xs font-bold">
                            03
                        </div>
                        <h4 className="font-bold font-mono text-white text-sm">Override System</h4>
                        <p className="text-xs font-mono text-gray-500">
                            Collect the "Source Code" and "Red Pill" badges to prove you are The One.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
