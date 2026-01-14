/**
 * Narrative Progression System
 * Story unlocks at level milestones
 */

import { createClient } from '@supabase/supabase-js';


function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export interface NarrativeChapter {
    id: string;
    chapter_number: number;
    title: string;
    description: string;
    unlock_level: number;
    lore_text: string;
    unlock_feature: string | null;
}

export interface NarrativeState {
    currentChapter: NarrativeChapter | null;
    unlockedChapters: NarrativeChapter[];
    nextChapter: NarrativeChapter | null;
    progressToNext: number; // 0-100%
}

/**
 * Get all narrative chapters
 */
export async function getAllChapters(): Promise<NarrativeChapter[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('narrative_chapters')
        .select('*')
        .order('chapter_number', { ascending: true });

    if (error) return [];
    return data || [];
}

/**
 * Get user's unlocked chapters
 */
export async function getUnlockedChapters(walletAddress: string): Promise<NarrativeChapter[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('narrative_unlocks')
        .select(`
            narrative_chapters (*)
        `)
        .eq('wallet_address', walletAddress)
        .order('unlocked_at', { ascending: true });

    if (error || !data) return [];

    return data.map(d => d.narrative_chapters as unknown as NarrativeChapter);
}

/**
 * Get full narrative state for a user
 */
export async function getNarrativeState(walletAddress: string, userLevel: number): Promise<NarrativeState> {
    const supabase = getSupabase();

    // Get all chapters
    const allChapters = await getAllChapters();

    // Get unlocked chapters
    const unlockedChapters = await getUnlockedChapters(walletAddress);
    const unlockedIds = new Set(unlockedChapters.map(c => c.id));

    // Current chapter is the highest unlocked
    const currentChapter = unlockedChapters.length > 0
        ? unlockedChapters[unlockedChapters.length - 1]
        : null;

    // Next chapter is the first locked one the user is eligible for
    const lockedChapters = allChapters.filter(c => !unlockedIds.has(c.id));
    const nextChapter = lockedChapters.length > 0 ? lockedChapters[0] : null;

    // Progress to next
    let progressToNext = 100;
    if (nextChapter) {
        const currentLevelReq = currentChapter?.unlock_level || 1;
        const nextLevelReq = nextChapter.unlock_level;
        const range = nextLevelReq - currentLevelReq;
        const progress = userLevel - currentLevelReq;
        progressToNext = range > 0 ? Math.min(Math.round((progress / range) * 100), 99) : 0;
    }

    return {
        currentChapter,
        unlockedChapters,
        nextChapter,
        progressToNext,
    };
}

/**
 * Check and unlock new chapters based on level
 */
export async function checkNarrativeUnlocks(
    walletAddress: string,
    userLevel: number
): Promise<NarrativeChapter[]> {
    const supabase = getSupabase();

    // Get all chapters eligible for this level
    const { data: eligibleChapters } = await supabase
        .from('narrative_chapters')
        .select('*')
        .lte('unlock_level', userLevel);

    if (!eligibleChapters) return [];

    // Get already unlocked
    const { data: alreadyUnlocked } = await supabase
        .from('narrative_unlocks')
        .select('chapter_id')
        .eq('wallet_address', walletAddress);

    const unlockedIds = new Set(alreadyUnlocked?.map(u => u.chapter_id) || []);

    // Find new unlocks
    const newUnlocks: NarrativeChapter[] = [];

    for (const chapter of eligibleChapters) {
        if (!unlockedIds.has(chapter.id)) {
            // Unlock this chapter
            await supabase.from('narrative_unlocks').insert({
                wallet_address: walletAddress,
                chapter_id: chapter.id,
            });

            // Update user stats with new chapter
            await supabase
                .from('user_stats')
                .update({ narrative_chapter: chapter.chapter_number })
                .eq('wallet_address', walletAddress);

            // Log activity
            await supabase.from('activity_log').insert({
                wallet_address: walletAddress,
                action: 'chapter_unlocked',
                details: {
                    chapter_number: chapter.chapter_number,
                    chapter_title: chapter.title,
                    unlock_feature: chapter.unlock_feature,
                },
            });

            newUnlocks.push(chapter);
        }
    }

    return newUnlocks;
}

/**
 * Get the lore text for a specific chapter
 */
export async function getChapterLore(chapterId: string): Promise<string | null> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('narrative_chapters')
        .select('lore_text')
        .eq('id', chapterId)
        .single();

    if (error || !data) return null;
    return data.lore_text;
}

/**
 * Check if a feature is unlocked for the user
 */
export async function isFeatureUnlocked(
    walletAddress: string,
    featureName: string
): Promise<boolean> {
    const supabase = getSupabase();

    const { data } = await supabase
        .from('narrative_unlocks')
        .select(`
            narrative_chapters!inner (unlock_feature)
        `)
        .eq('wallet_address', walletAddress)
        .eq('narrative_chapters.unlock_feature', featureName)
        .limit(1);

    return (data?.length || 0) > 0;
}
