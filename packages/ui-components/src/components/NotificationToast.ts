/**
 * DeFi Quest Engine - Notification Toast Component
 * Animated toast notifications for achievements and events
 */

const TEMPLATE = `
<style>
  :host {
    --dqe-toast-bg: var(--dqe-toast-background, rgba(20, 20, 31, 0.95));
    --dqe-border: var(--dqe-border-color, #2a2a3f);
    --dqe-text: var(--dqe-text-color, #ffffff);
    --dqe-text-dim: var(--dqe-text-secondary, #8888aa);
    --dqe-success: #10b981;
    --dqe-warning: #f59e0b;
    --dqe-error: #ef4444;
    --dqe-info: #3b82f6;
    --dqe-radius: var(--dqe-border-radius, 12px);
    
    position: fixed;
    z-index: 10000;
    pointer-events: none;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  :host([position="top-right"]) {
    top: 16px;
    right: 16px;
  }

  :host([position="top-left"]) {
    top: 16px;
    left: 16px;
  }

  :host([position="bottom-right"]) {
    bottom: 16px;
    right: 16px;
  }

  :host([position="bottom-left"]) {
    bottom: 16px;
    left: 16px;
  }

  :host([position="top-center"]) {
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
  }

  :host([position="bottom-center"]) {
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
  }

  .toast-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 380px;
    width: 100vw;
    padding: 0 16px;
  }

  @media (min-width: 420px) {
    .toast-container {
      width: 380px;
      padding: 0;
    }
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: var(--dqe-toast-bg);
    border: 1px solid var(--dqe-border);
    border-radius: var(--dqe-radius);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(10px);
    pointer-events: auto;
    animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .toast.exiting {
    animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }

  :host([position="top-left"]) .toast,
  :host([position="bottom-left"]) .toast {
    animation-name: slideInLeft;
  }

  :host([position="top-left"]) .toast.exiting,
  :host([position="bottom-left"]) .toast.exiting {
    animation-name: slideOutLeft;
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideOutLeft {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-100%);
    }
  }

  .toast.success { border-left: 3px solid var(--dqe-success); }
  .toast.warning { border-left: 3px solid var(--dqe-warning); }
  .toast.error { border-left: 3px solid var(--dqe-error); }
  .toast.info { border-left: 3px solid var(--dqe-info); }
  .toast.achievement { 
    border: 2px solid var(--dqe-warning);
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(20, 20, 31, 0.95) 100%);
  }

  .icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .icon.achievement {
    animation: bounce 0.6s ease infinite;
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: var(--dqe-text);
    margin-bottom: 2px;
  }

  .message {
    font-size: 13px;
    color: var(--dqe-text-dim);
    line-height: 1.4;
  }

  .reward {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding: 4px 8px;
    background: rgba(251, 191, 36, 0.2);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--dqe-warning);
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: var(--dqe-text-dim);
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--dqe-border);
    color: var(--dqe-text);
  }

  .progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: var(--dqe-success);
    animation: progress linear forwards;
  }

  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
</style>

<div class="toast-container"></div>
`;

export type ToastType = 'success' | 'warning' | 'error' | 'info' | 'achievement';

export interface ToastOptions {
    title: string;
    message?: string;
    type?: ToastType;
    duration?: number;
    icon?: string;
    reward?: string;
    closable?: boolean;
}

interface ToastItem extends ToastOptions {
    id: string;
    element: HTMLElement;
}

export class NotificationToastElement extends HTMLElement {
    private shadow: ShadowRoot;
    private toasts: Map<string, ToastItem> = new Map();
    private idCounter = 0;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = TEMPLATE;
    }

    static get observedAttributes() {
        return ['position'];
    }

    connectedCallback() {
        // Set default position if not specified
        if (!this.hasAttribute('position')) {
            this.setAttribute('position', 'top-right');
        }
    }

    /**
     * Show a toast notification
     */
    show(options: ToastOptions): string {
        const id = `toast-${++this.idCounter}`;
        const container = this.shadow.querySelector('.toast-container');
        if (!container) return id;

        const duration = options.duration ?? 5000;
        const type = options.type || 'info';
        const icon = options.icon || this.getDefaultIcon(type);
        const closable = options.closable !== false;

        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.innerHTML = `
      <span class="icon ${type === 'achievement' ? 'achievement' : ''}">${icon}</span>
      <div class="content">
        <div class="title">${options.title}</div>
        ${options.message ? `<div class="message">${options.message}</div>` : ''}
        ${options.reward ? `<div class="reward">⭐ ${options.reward}</div>` : ''}
      </div>
      ${closable ? '<button class="close-btn">✕</button>' : ''}
      ${duration > 0 ? `<div class="progress-bar" style="animation-duration: ${duration}ms"></div>` : ''}
    `;

        // Add close button listener
        if (closable) {
            toastEl.querySelector('.close-btn')?.addEventListener('click', () => {
                this.dismiss(id);
            });
        }

        container.appendChild(toastEl);

        const toastItem: ToastItem = {
            ...options,
            id,
            element: toastEl,
        };

        this.toasts.set(id, toastItem);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(id), duration);
        }

        // Dispatch event
        this.dispatchEvent(
            new CustomEvent('toast-shown', {
                detail: { id, ...options },
                bubbles: true,
                composed: true,
            })
        );

        return id;
    }

    /**
     * Dismiss a toast
     */
    dismiss(id: string): void {
        const toast = this.toasts.get(id);
        if (!toast) return;

        toast.element.classList.add('exiting');

        setTimeout(() => {
            toast.element.remove();
            this.toasts.delete(id);

            this.dispatchEvent(
                new CustomEvent('toast-dismissed', {
                    detail: { id },
                    bubbles: true,
                    composed: true,
                })
            );
        }, 300);
    }

    /**
     * Dismiss all toasts
     */
    dismissAll(): void {
        for (const id of this.toasts.keys()) {
            this.dismiss(id);
        }
    }

    /**
     * Show success toast
     */
    success(title: string, message?: string): string {
        return this.show({ title, message, type: 'success' });
    }

    /**
     * Show error toast
     */
    error(title: string, message?: string): string {
        return this.show({ title, message, type: 'error' });
    }

    /**
     * Show warning toast
     */
    warning(title: string, message?: string): string {
        return this.show({ title, message, type: 'warning' });
    }

    /**
     * Show info toast
     */
    info(title: string, message?: string): string {
        return this.show({ title, message, type: 'info' });
    }

    /**
     * Show achievement toast
     */
    achievement(title: string, reward?: string): string {
        return this.show({
            title,
            message: 'Mission completed!',
            type: 'achievement',
            icon: '🏆',
            reward,
            duration: 7000,
        });
    }

    /**
     * Get default icon for toast type
     */
    private getDefaultIcon(type: ToastType): string {
        const icons: Record<ToastType, string> = {
            success: '✓',
            warning: '⚠',
            error: '✕',
            info: 'ℹ',
            achievement: '🏆',
        };
        return icons[type];
    }
}

// Register the custom element
customElements.define('quest-notification-toast', NotificationToastElement);
