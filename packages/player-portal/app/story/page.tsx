'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Lock, Sparkles } from 'lucide-react';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

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

    const isUnlocked = (chapter: Chapter) => {
        return unlockedIds.has(chapter.id) || chapter.unlock_level <= userLevel;
    };

    return (
        <div className="min-h-screen">
            <PlayerNavbar />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <p className="text-[#4ade80] text-xs tracking-[0.3em] mb-2 font-mono">
                        // THE ARCHIVES
                    </p>
                    <h1 className="text-3xl font-bold mb-2">
                        <span className="text-white">MATRIX </span>
                        <span className="text-[#4ade80]">CHRONICLES</span>
                    </h1>
                    <p className="text-gray-400">
                        Your journey through the simulation. Each level reveals more of the truth.
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 rounded-xl bg-[#0a0f0a] border border-gray-800 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {chapters.map((chapter) => {
                            const unlocked = isUnlocked(chapter);

                            return (
                                <div
                                    key={chapter.id}
                                    onClick={() => unlocked && setSelectedChapter(chapter)}
                                    className={`p-6 rounded-xl border transition-all ${unlocked
                                            ? 'border-[#4ade80]/30 bg-[#4ade80]/5 cursor-pointer hover:border-[#4ade80]/50'
                                            : 'border-gray-800 bg-[#0a0f0a] opacity-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${unlocked
                                                ? 'bg-[#4ade80] text-black'
                                                : 'bg-gray-800 text-gray-500'
                                            }`}>
                                            {unlocked ? (
                                                <BookOpen className="w-6 h-6" />
                                            ) : (
                                                <Lock className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">CHAPTER {chapter.chapter_number}</span>
                                                {unlocked && chapter.unlock_feature && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-[#4ade80]/20 text-[#4ade80]">
                                                        <Sparkles className="w-3 h-3 inline mr-1" />
                                                        Unlocks: {chapter.unlock_feature}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-white">{chapter.title}</h3>
                                            <p className="text-sm text-gray-400">{chapter.description}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">Unlock at</p>
                                            <p className={`font-bold ${unlocked ? 'text-[#4ade80]' : 'text-gray-500'}`}>
                                                Level {chapter.unlock_level}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Chapter Modal */}
                {selectedChapter && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="max-w-2xl w-full bg-[#0a0f0a] border border-[#4ade80]/30 rounded-xl p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-[#4ade80] text-xs tracking-wider">
                                        CHAPTER {selectedChapter.chapter_number}
                                    </p>
                                    <h2 className="text-2xl font-bold text-white">
                                        {selectedChapter.title}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedChapter(null)}
                                    className="p-2 rounded-lg hover:bg-gray-800"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="prose prose-invert max-w-none">
                                <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                                    {selectedChapter.lore_text}
                                </p>
                            </div>

                            {selectedChapter.unlock_feature && (
                                <div className="mt-6 p-4 rounded-lg bg-[#4ade80]/10 border border-[#4ade80]/30">
                                    <p className="text-sm text-[#4ade80]">
                                        <Sparkles className="w-4 h-4 inline mr-2" />
                                        This chapter unlocked: <strong>{selectedChapter.unlock_feature}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Current Level Indicator */}
                {walletAddress && (
                    <div className="mt-8 text-center text-gray-500 text-sm">
                        Your current level: <span className="text-[#4ade80] font-bold">{userLevel}</span>
                    </div>
                )}
            </main>
        </div>
    );
}
