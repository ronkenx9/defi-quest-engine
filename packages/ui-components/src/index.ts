/**
 * DeFi Quest Engine - UI Components Entry Point
 * Exports all Web Components and helper utilities
 */

// Export all components
export { MissionListElement } from './components/MissionList';
export { ProgressBarElement } from './components/ProgressBar';
export type { ProgressBarMilestone } from './components/ProgressBar';
export { LeaderboardElement } from './components/Leaderboard';
export { NotificationToastElement } from './components/NotificationToast';
export type { ToastOptions, ToastType } from './components/NotificationToast';

// Re-export types from core for convenience
export type {
    Mission,
    MissionProgress,
    MissionStatus,
    MissionType,
    Difficulty,
    UserStats,
} from '@defi-quest/core';

// Import types for use in functions
import type { ToastOptions } from './components/NotificationToast';

/**
 * Initialize all UI components
 * Call this to ensure all components are registered
 */
export function initializeComponents(): void {
    // Components auto-register when imported
    // This function exists for explicit initialization
    console.log('DeFi Quest UI Components initialized');
}

/**
 * Helper to create toast manager
 */
export function createToastManager(
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' = 'top-right'
): HTMLElement {
    const existing = document.querySelector('quest-notification-toast');
    if (existing) return existing as HTMLElement;

    const toast = document.createElement('quest-notification-toast');
    toast.setAttribute('position', position);
    document.body.appendChild(toast);
    return toast as HTMLElement;
}

/**
 * Shorthand to show a toast
 */
export function showToast(options: ToastOptions): string {
    const toast = createToastManager() as unknown as { show: (opts: ToastOptions) => string };
    return toast.show(options);
}
