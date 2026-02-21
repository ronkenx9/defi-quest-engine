/**
 * Badge Storage Utility
 * Stores earned badge IDs per wallet in localStorage.
 * Shared between BadgeGallery and onboarding/mission systems.
 */

const BADGE_STORAGE_KEY = 'matrix-earned-badges';

/** Get all earned badge IDs for a wallet */
export function getEarnedBadges(walletAddress: string): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(`${BADGE_STORAGE_KEY}-${walletAddress}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/** Add a badge to the earned list (idempotent) */
export function earnBadge(walletAddress: string, badgeId: string): string[] {
    if (typeof window === 'undefined') return [];
    const current = getEarnedBadges(walletAddress);
    if (current.includes(badgeId)) return current;
    const updated = [...current, badgeId];
    localStorage.setItem(`${BADGE_STORAGE_KEY}-${walletAddress}`, JSON.stringify(updated));
    return updated;
}

/** Check if a badge has been earned */
export function hasBadge(walletAddress: string, badgeId: string): boolean {
    return getEarnedBadges(walletAddress).includes(badgeId);
}
