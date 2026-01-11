/**
 * DeFi Quest Engine - Leaderboard Component
 * Web Component for displaying user rankings
 */

import { UserStats } from '@defi-quest/core';

const TEMPLATE = `
<style>
  :host {
    --dqe-bg: var(--dqe-background, #0a0a0f);
    --dqe-card: var(--dqe-card-bg, #14141f);
    --dqe-border: var(--dqe-border-color, #2a2a3f);
    --dqe-text: var(--dqe-text-color, #ffffff);
    --dqe-text-dim: var(--dqe-text-secondary, #8888aa);
    --dqe-primary: var(--dqe-primary-color, #7c3aed);
    --dqe-gold: #fbbf24;
    --dqe-silver: #94a3b8;
    --dqe-bronze: #d97706;
    --dqe-radius: var(--dqe-border-radius, 12px);
    
    display: block;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--dqe-text);
    background: var(--dqe-bg);
    border-radius: var(--dqe-radius);
    overflow: hidden;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .container {
    padding: 16px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .title {
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-icon {
    font-size: 20px;
  }

  .refresh-btn {
    padding: 8px;
    background: var(--dqe-card);
    border: 1px solid var(--dqe-border);
    border-radius: 8px;
    color: var(--dqe-text-dim);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .refresh-btn:hover {
    color: var(--dqe-text);
    border-color: var(--dqe-primary);
  }

  .refresh-btn.loading {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .podium {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 8px;
    margin-bottom: 24px;
    padding: 0 20px;
  }

  .podium-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    max-width: 100px;
  }

  .podium-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--dqe-card);
    border: 3px solid var(--dqe-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 8px;
    position: relative;
  }

  .podium-item.first .podium-avatar {
    width: 56px;
    height: 56px;
    border-color: var(--dqe-gold);
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
  }

  .podium-item.second .podium-avatar {
    border-color: var(--dqe-silver);
  }

  .podium-item.third .podium-avatar {
    border-color: var(--dqe-bronze);
  }

  .podium-rank {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #000;
  }

  .podium-item.first .podium-rank { background: var(--dqe-gold); }
  .podium-item.second .podium-rank { background: var(--dqe-silver); }
  .podium-item.third .podium-rank { background: var(--dqe-bronze); }

  .podium-name {
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
    margin-bottom: 4px;
  }

  .podium-points {
    font-size: 11px;
    color: var(--dqe-text-dim);
  }

  .podium-base {
    width: 100%;
    border-radius: 4px 4px 0 0;
    margin-top: 8px;
  }

  .podium-item.first .podium-base {
    height: 60px;
    background: linear-gradient(180deg, #fbbf24 0%, #d97706 100%);
  }

  .podium-item.second .podium-base {
    height: 40px;
    background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
  }

  .podium-item.third .podium-base {
    height: 28px;
    background: linear-gradient(180deg, #d97706 0%, #b45309 100%);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--dqe-card);
    border: 1px solid var(--dqe-border);
    border-radius: 10px;
    transition: all 0.2s ease;
  }

  .list-item:hover {
    border-color: var(--dqe-primary);
  }

  .list-item.current-user {
    border-color: var(--dqe-primary);
    background: rgba(124, 58, 237, 0.1);
  }

  .rank {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--dqe-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--dqe-primary) 0%, #a855f7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-address {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-stats {
    font-size: 11px;
    color: var(--dqe-text-dim);
    display: flex;
    gap: 12px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .points {
    font-size: 14px;
    font-weight: 700;
    color: var(--dqe-primary);
    flex-shrink: 0;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--dqe-text-dim);
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }
</style>

<div class="container">
  <div class="header">
    <h2 class="title">
      <span class="title-icon">🏆</span>
      Leaderboard
    </h2>
    <button class="refresh-btn" title="Refresh">🔄</button>
  </div>
  
  <div class="podium"></div>
  <div class="list"></div>
</div>
`;

export class LeaderboardElement extends HTMLElement {
    private shadow: ShadowRoot;
    private users: UserStats[] = [];
    private currentUserAddress: string | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = TEMPLATE;
        this.setupEventListeners();
    }

    static get observedAttributes() {
        return ['current-user'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'current-user' && oldValue !== newValue) {
            this.currentUserAddress = newValue;
            this.render();
        }
    }

    private setupEventListeners() {
        const refreshBtn = this.shadow.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.dispatchEvent(
                    new CustomEvent('refresh', { bubbles: true, composed: true })
                );
                refreshBtn.classList.add('loading');
                setTimeout(() => refreshBtn.classList.remove('loading'), 1000);
            });
        }
    }

    /**
     * Set leaderboard data
     */
    setData(users: UserStats[], currentUserAddress?: string) {
        this.users = users;
        if (currentUserAddress) {
            this.currentUserAddress = currentUserAddress;
        }
        this.render();
    }

    /**
     * Set loading state
     */
    setLoading(loading: boolean) {
        const refreshBtn = this.shadow.querySelector('.refresh-btn');
        if (refreshBtn) {
            refreshBtn.classList.toggle('loading', loading);
        }
    }

    /**
     * Render the leaderboard
     */
    private render() {
        this.renderPodium();
        this.renderList();
    }

    /**
     * Render top 3 podium
     */
    private renderPodium() {
        const container = this.shadow.querySelector('.podium') as HTMLElement;
        if (!container) return;

        const top3 = this.users.slice(0, 3);

        if (top3.length < 3) {
            container.innerHTML = '';
            return;
        }

        // Reorder for display: 2nd, 1st, 3rd
        const orderedTop3 = [top3[1], top3[0], top3[2]];
        const positions = ['second', 'first', 'third'];

        container.innerHTML = orderedTop3
            .map((user, i) => {
                const shortAddress = this.shortenAddress(user.walletAddress);
                const emoji = this.getAvatarEmoji(user.walletAddress);
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;

                return `
          <div class="podium-item ${positions[i]}">
            <div class="podium-avatar">
              ${emoji}
              <span class="podium-rank">${rank}</span>
            </div>
            <span class="podium-name">${shortAddress}</span>
            <span class="podium-points">${this.formatPoints(user.totalPoints)} pts</span>
            <div class="podium-base"></div>
          </div>
        `;
            })
            .join('');
    }

    /**
     * Render list items (4th place onwards)
     */
    private renderList() {
        const container = this.shadow.querySelector('.list') as HTMLElement;
        if (!container) return;

        const remaining = this.users.slice(3);

        if (remaining.length === 0 && this.users.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🏅</div>
          <p>No rankings yet. Be the first!</p>
        </div>
      `;
            return;
        }

        if (remaining.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = remaining
            .map((user, i) => {
                const rank = i + 4;
                const shortAddress = this.shortenAddress(user.walletAddress);
                const emoji = this.getAvatarEmoji(user.walletAddress);
                const isCurrentUser = user.walletAddress === this.currentUserAddress;

                return `
          <div class="list-item ${isCurrentUser ? 'current-user' : ''}" data-address="${user.walletAddress}">
            <div class="rank">${rank}</div>
            <div class="avatar">${emoji}</div>
            <div class="user-info">
              <div class="user-address">${shortAddress}${isCurrentUser ? ' (You)' : ''}</div>
              <div class="user-stats">
                <span class="stat">🎯 ${user.totalMissionsCompleted} missions</span>
                <span class="stat">🔥 ${user.currentStreak} streak</span>
              </div>
            </div>
            <span class="points">${this.formatPoints(user.totalPoints)}</span>
          </div>
        `;
            })
            .join('');

        // Add click listeners
        container.querySelectorAll('.list-item').forEach((item) => {
            item.addEventListener('click', () => {
                const address = (item as HTMLElement).dataset.address;
                if (address) {
                    this.dispatchEvent(
                        new CustomEvent('user-click', {
                            detail: { walletAddress: address },
                            bubbles: true,
                            composed: true,
                        })
                    );
                }
            });
        });
    }

    /**
     * Shorten wallet address for display
     */
    private shortenAddress(address: string): string {
        if (address.length <= 12) return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    /**
     * Get consistent emoji for address
     */
    private getAvatarEmoji(address: string): string {
        const emojis = ['🦁', '🐯', '🦊', '🐺', '🦅', '🦈', '🐉', '🦄', '🐙', '🦋'];
        const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return emojis[hash % emojis.length];
    }

    /**
     * Format points with K/M suffix
     */
    private formatPoints(points: number): string {
        if (points >= 1000000) {
            return (points / 1000000).toFixed(1) + 'M';
        }
        if (points >= 1000) {
            return (points / 1000).toFixed(1) + 'K';
        }
        return points.toString();
    }
}

// Register the custom element
customElements.define('quest-leaderboard', LeaderboardElement);
