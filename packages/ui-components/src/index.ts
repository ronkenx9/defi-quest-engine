/**
 * DeFi Quest Engine - UI Components Entry Point
 * Exports all Web Components and helper utilities
 */

// Export all components
export { MissionListElement } from './components/MissionList';
export { ProgressBarElement, ProgressBarMilestone } from './components/ProgressBar';
export { LeaderboardElement } from './components/Leaderboard';
export {
    NotificationToastElement,
    ToastOptions,
    ToastType
} from './components/NotificationToast';

// Re-export types from core for convenience
export {
    Mission,
    MissionProgress,
    MissionStatus,
    MissionType,
    Difficulty,
    UserStats,
} from '@defi-quest/core';

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
    if (existing) return existing;

    const toast = document.createElement('quest-notification-toast');
    toast.setAttribute('position', position);
    document.body.appendChild(toast);
    return toast;
}

/**
 * Shorthand to show a toast
 */
export function showToast(options: ToastOptions): string {
    const toast = createToastManager() as any;
    return toast.show(options);
}

// Import types
import { ToastOptions } from './components/NotificationToast';
