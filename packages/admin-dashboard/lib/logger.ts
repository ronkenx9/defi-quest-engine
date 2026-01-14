/**
 * Safe logging utilities
 * Prevents sensitive data from being logged in production
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Log an error safely without exposing sensitive details
 * In production, logs only a generic message
 * In development, logs full error for debugging
 */
export function logError(context: string, error?: unknown): void {
    if (isDev && error) {
        console.error(`[${context}]`, error);
    } else {
        console.error(`[${context}] An error occurred`);
    }
}

/**
 * Log a warning safely
 */
export function logWarn(context: string, message?: string): void {
    if (isDev && message) {
        console.warn(`[${context}] ${message}`);
    } else {
        console.warn(`[${context}] Warning`);
    }
}

/**
 * Safe stringify for logging - removes sensitive fields
 */
export function safeStringify(obj: unknown): string {
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential'];

    try {
        return JSON.stringify(obj, (key, value) => {
            if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
                return '[REDACTED]';
            }
            return value;
        }, 2);
    } catch {
        return '[Unable to stringify]';
    }
}
