'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen, Lock, Sparkles, Terminal, Shield, ChevronRight, Search, Zap, Info } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';
import { MatrixSounds } from '@/lib/sounds';

interface Chapter {
    id: string;
    chapter_number: number;
    title: string;
    description: string;
    unlock_level: number;
    lore_text: string;
    unlock_feature: string | null;
}

export default function StoryPage() {
    const { walletAddress } = useWallet();
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
    const [userLevel, setUserLevel] = useState(1);
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
    const [loading, setLoading] = useState(true);
    const [decodingProgress, setDecodingProgress] = useState(0);
    const [isDecoding, setIsDecoding] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            // Fetch all chapters
            const { data: chapterData } = await supabase
                .from('narrative_chapters')
                .select('*')
                .order('chapter_number', { ascending: true });

            if (chapterData) {
                setChapters(chapterData);
            }

            // Fetch user unlocks and level
            if (walletAddress) {
                const { data: unlockData } = await supabase
                    .from('narrative_unlocks')
                    .select('chapter_id')
                    .eq('wallet_address', walletAddress);

                if (unlockData) {
                    setUnlockedIds(new Set(unlockData.map(u => u.chapter_id)));
                }

                const { data: statsData } = await supabase
                    .from('user_stats')
                    .select('level')
                    .eq('wallet_address', walletAddress)
                    .single();

                if (statsData) {
                    setUserLevel(statsData.level);
                }
            }

            setLoading(false);
        }

        fetchData();
    }, [walletAddress]);

    const isUnlocked = useCallback((chapter: Chapter) => {
        return unlockedIds.has(chapter.id) || chapter.unlock_level <= userLevel;
    }, [unlockedIds, userLevel]);

    const handleSelectChapter = (chapter: Chapter) => {
        if (!isUnlocked(chapter)) {
            MatrixSounds.error();
            return;
        }

        MatrixSounds.click();
        setSelectedChapter(chapter);
        setIsDecoding(true);
        setDecodingProgress(0);

        // Simulate decoding progress
        const interval = setInterval(() => {
            setDecodingProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsDecoding(false);
                    return 100;
                }
                return prev + 5;
            });
        }, 30);
    };

    return (
        <div className="min-h-screen crt-overlay bg-[#050507]">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
                {/* Immersive Header */}
                <div className="mb-12 animate-fade-in">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30 flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                            <Terminal className="w-5 h-5 text-[#4ade80]" />
                        </div>
                        <div>
                            <p className="text-[#4ade80] text-[10px] tracking-[0.4em] font-mono leading-none">
                                DECRYPTION_PROTOCOL://ARCHIVES
                            </p>
                            <h1 className="text-3xl font-black mt-1 tracking-tighter uppercase italic">
                                Matrix <span className="text-[#4ade80]">Chronicles</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
                    {/* Left Sidebar: Archive Nodes */}
                    <div className="lg:col-span-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">System Nodes</span>
                            <div className="text-[10px] font-mono text-[#4ade80] animate-pulse">LIVE://CONNECTED</div>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            chapters.map((chapter) => {
                                const unlocked = isUnlocked(chapter);
                                const isActive = selectedChapter?.id === chapter.id;

                                return (
                                    <button
                                        key={chapter.id}
                                        onClick={() => handleSelectChapter(chapter)}
                                        className={`w-full group relative overflow-hidden text-left p-4 rounded-xl border transition-all duration-300 ${unlocked
                                            ? isActive
                                                ? 'bg-[#4ade80]/10 border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                                                : 'bg-white/5 border-white/10 hover:border-[#4ade80]/40'
                                            : 'bg-black/40 border-white/5 opacity-40 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${unlocked
                                                ? isActive ? 'bg-[#4ade80] border-[#4ade80] text-black' : 'bg-black/60 border-[#4ade80]/30 text-[#4ade80]'
                                                : 'bg-black border-white/10 text-gray-600'
                                                }`}>
                                                {unlocked ? <BookOpen className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-[9px] font-mono font-bold ${unlocked ? 'text-[#4ade80]/60' : 'text-gray-600'}`}>
                                                        00{chapter.chapter_number}
                                                    </span>
                                                    {!unlocked && (
                                                        <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-mono">
                                                            LOCKED: LVL {chapter.unlock_level}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className={`font-bold transition-colors ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {chapter.title}
                                                </h3>
                                            </div>
                                            {unlocked && (
                                                <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-1 text-[#4ade80]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                                            )}
                                        </div>

                                        {/* Decode gradient sweep on active */}
                                        {isActive && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-[#4ade80]/5 to-transparent pointer-events-none" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Right Main: Decrypted Data Console */}
                    <div className="lg:col-span-8">
                        <div className="terminal-window h-full flex flex-col min-h-[500px]">
                            {/* Terminal Header */}
                            <div className="terminal-header">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                                </div>
                                <div className="text-[10px] font-mono text-[#4ade80]/50 tracking-[0.2em]">
                                    {selectedChapter ? `DATA_NODE://${selectedChapter.id.slice(0, 8)}` : 'IDLE://WAITING_FOR_INPUT'}
                                </div>
                                <div className="p-1 px-2 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-gray-500">
                                    SECURE://NEURAL_LINK
                                </div>
                            </div>

                            {/* Terminal Content Area */}
                            <div className="flex-1 relative overflow-hidden bg-black grid-bg">
                                <div className="scanline" />

                                <div className="absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                                    {selectedChapter ? (
                                        <div className="space-y-6">
                                            {/* Meta & Summary Section */}
                                            <div className="animate-fade-in border-l-2 border-[#4ade80]/30 pl-4 py-2 bg-[#4ade80]/5">
                                                <div className="flex flex-wrap gap-4 mb-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Shield className="w-3 h-3 text-[#4ade80]" />
                                                        <span className="text-[10px] font-mono text-gray-500 uppercase">Classified:</span>
                                                        <span className="text-[10px] font-mono text-[#4ade80] font-bold">ALPHA_CLEARANCE</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Zap className="w-3 h-3 text-[#4ade80]" />
                                                        <span className="text-[10px] font-mono text-gray-500 uppercase">Integrity:</span>
                                                        <span className="text-[10px] font-mono text-[#4ade80]">98.4%</span>
                                                    </div>
                                                </div>
                                                <h2 className="text-2xl font-black text-[#4ade80] tracking-tight uppercase glitch-text" data-text={selectedChapter.title}>
                                                    {selectedChapter.title}
                                                </h2>
                                                <p className="text-xs text-gray-400 mt-1 italic">
                                                    SUMMARY: {selectedChapter.description}
                                                </p>
                                            </div>

                                            {/* Lore Text with sequential reveal feel */}
                                            <div className="space-y-4">
                                                {isDecoding ? (
                                                    <div className="space-y-4 py-12 text-center text-[#4ade80] font-mono">
                                                        <div className="text-xs animate-pulse mb-2">BYPASSING FIREWALL... DECRYPTING BUFFER...</div>
                                                        <div className="w-64 h-2 bg-white/5 rounded-full mx-auto overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#4ade80] shadow-[0_0_10px_#4ade80]"
                                                                style={{ width: `${decodingProgress}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-[10px] opacity-60">{decodingProgress}% COMPLETE</div>
                                                    </div>
                                                ) : (
                                                    <div className="animate-fade-in text-matrix">
                                                        <div className="inline-block relative">
                                                            <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-[#4ade80]/20" />
                                                            <p className="text-sm leading-relaxed whitespace-pre-line text-gray-300 font-mono pl-2">
                                                                {selectedChapter.lore_text}
                                                            </p>
                                                        </div>

                                                        {selectedChapter.unlock_feature && (
                                                            <div className="mt-8 p-4 rounded-xl border border-dashed border-[#4ade80]/30 bg-[#4ade80]/5 animate-pulse-glow">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-[#4ade80]/20 flex items-center justify-center">
                                                                        <Sparkles className="w-4 h-4 text-[#4ade80]" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest leading-none mb-1">Decrypted Tech</div>
                                                                        <div className="text-sm font-bold text-[#4ade80]">Unlocks: {selectedChapter.unlock_feature}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                            <Search className="w-16 h-16 text-[#4ade80] mb-6 animate-pulse" />
                                            <h3 className="text-xl font-bold font-['Orbitron'] text-white">READY FOR INPUT</h3>
                                            <p className="text-sm text-gray-500 mt-2 max-w-xs font-mono">
                                                Select a decrypted system node from the left to access the lore archives.
                                            </p>
                                            <div className="mt-8 flex gap-3">
                                                <div className="animate-ping w-2 h-2 bg-[#4ade80] rounded-full" />
                                                <div className="animate-ping w-2 h-2 bg-[#4ade80] rounded-full delay-75" />
                                                <div className="animate-ping w-2 h-2 bg-[#4ade80] rounded-full delay-150" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Terminal Footer */}
                            <div className="p-3 bg-white/5 border-t border-white/10 flex justify-between items-center px-4">
                                <div className="text-[9px] font-mono text-gray-600 flex items-center gap-1.5 uppercase tracking-widest">
                                    <div className="w-1 h-1 rounded-full bg-green-500" />
                                    Terminal Status: Nominal
                                </div>
                                <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                                    Operator: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'ANONYMOUS'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Level Progress Sync */}
                <div className="mt-12 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black border border-[#4ade80]/20 flex items-center justify-center">
                            <Info className="w-6 h-6 text-[#4ade80]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-sm">ARCHIVE ACCESS RULES</h4>
                            <p className="text-xs text-gray-500 max-w-sm">
                                Nodes unlock as your Neural Link Level increases. Complete missions to increase clearance levels.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border border-white/5">
                        <div className="text-right">
                            <div className="text-[10px] text-gray-600 uppercase font-mono tracking-tighter leading-none mb-1">Clearance Level</div>
                            <div className="text-lg font-black text-white font-mono">T-LVL.{userLevel}</div>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <div className="text-[10px] font-mono text-[#4ade80] animate-pulse uppercase tracking-[0.2em]">Authorized</div>
                    </div>
                </div>
            </main>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(74, 222, 128, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(74, 222, 128, 0.4);
                }
            `}</style>
        </div>
    );
}
