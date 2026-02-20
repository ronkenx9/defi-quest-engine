/**
 * DeFi Quest Engine - Mission List Component
 * Embeddable Web Component for displaying missions
 */

import {
  Mission,
  MissionProgress,
  MissionStatus,
  MissionType,
  Difficulty,
} from '@defi-quest/core';

const TEMPLATE = `
<style>
  :host {
    --dqe-bg: var(--dqe-background, #0a0a0f);
    --dqe-card: var(--dqe-card-bg, #14141f);
    --dqe-border: var(--dqe-border-color, #2a2a3f);
    --dqe-text: var(--dqe-text-color, #ffffff);
    --dqe-text-dim: var(--dqe-text-secondary, #8888aa);
    --dqe-primary: var(--dqe-primary-color, #7c3aed);
    --dqe-success: var(--dqe-success-color, #10b981);
    --dqe-warning: var(--dqe-warning-color, #f59e0b);
    --dqe-error: var(--dqe-error-color, #ef4444);
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
    max-height: 500px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--dqe-border) transparent;
  }

  .container::-webkit-scrollbar {
    width: 6px;
  }

  .container::-webkit-scrollbar-thumb {
    background: var(--dqe-border);
    border-radius: 3px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .title {
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--dqe-primary) 0%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tabs {
    display: flex;
    gap: 4px;
    background: var(--dqe-card);
    padding: 4px;
    border-radius: 8px;
  }

  .tab {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    background: transparent;
    color: var(--dqe-text-dim);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .tab:hover {
    color: var(--dqe-text);
  }

  .tab.active {
    background: var(--dqe-primary);
    color: white;
  }

  .mission-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .mission-card {
    background: var(--dqe-card);
    border: 1px solid var(--dqe-border);
    border-radius: var(--dqe-radius);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .mission-card:hover {
    border-color: var(--dqe-primary);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.15);
  }

  .mission-card.completed {
    border-color: var(--dqe-success);
    opacity: 0.85;
  }

  .mission-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .mission-info {
    flex: 1;
    min-width: 0;
  }

  .mission-name {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mission-type {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--dqe-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .mission-type::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--dqe-primary);
  }

  .difficulty {
    padding: 4px 8px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .difficulty.easy { background: #10b98133; color: #10b981; }
  .difficulty.medium { background: #3b82f633; color: #3b82f6; }
  .difficulty.hard { background: #f59e0b33; color: #f59e0b; }
  .difficulty.legendary { background: #7c3aed33; color: #a855f7; }

  .mission-description {
    font-size: 13px;
    color: var(--dqe-text-dim);
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .progress-container {
    margin-bottom: 12px;
  }

  .progress-bar {
    height: 6px;
    background: var(--dqe-border);
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--dqe-primary) 0%, #a855f7 100%);
    border-radius: 3px;
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .progress-fill.completed {
    background: linear-gradient(90deg, var(--dqe-success) 0%, #34d399 100%);
  }

  .progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--dqe-text-dim);
  }

  .mission-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .reward {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--dqe-warning);
  }

  .reward-icon {
    font-size: 14px;
  }

  .action-btn {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .action-btn.start {
    background: var(--dqe-primary);
    color: white;
  }

  .action-btn.start:hover {
    background: #6d28d9;
  }

  .action-btn.claim {
    background: var(--dqe-success);
    color: white;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
    50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  }

  .action-btn.claimed {
    background: var(--dqe-border);
    color: var(--dqe-text-dim);
    cursor: default;
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

  .empty-text {
    font-size: 14px;
  }
</style>

<div class="container">
  <div class="header">
    <h2 class="title">Missions</h2>
    <div class="tabs">
      <button class="tab active" data-tab="active">Active</button>
      <button class="tab" data-tab="completed">Completed</button>
    </div>
  </div>
  <div class="mission-list"></div>
</div>
`;

export class MissionListElement extends HTMLElement {
  private shadow: ShadowRoot;
  private missions: Mission[] = [];
  private progress: Map<string, MissionProgress> = new Map();
  private activeTab: 'active' | 'completed' = 'active';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.innerHTML = TEMPLATE;
    this.setupEventListeners();
  }

  static get observedAttributes() {
    return ['theme'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'theme' && oldValue !== newValue) {
      this.applyTheme(newValue);
    }
  }

  connectedCallback() {
    const theme = this.getAttribute('theme') || 'dark';
    this.applyTheme(theme);
  }

  private applyTheme(theme: string) {
    if (theme === 'light') {
      this.style.setProperty('--dqe-background', '#f5f5f7');
      this.style.setProperty('--dqe-card-bg', '#ffffff');
      this.style.setProperty('--dqe-border-color', '#e5e5ea');
      this.style.setProperty('--dqe-text-color', '#1c1c1e');
      this.style.setProperty('--dqe-text-secondary', '#8e8e93');
    } else {
      this.style.setProperty('--dqe-background', '#0a0a0f');
      this.style.setProperty('--dqe-card-bg', '#14141f');
      this.style.setProperty('--dqe-border-color', '#2a2a3f');
      this.style.setProperty('--dqe-text-color', '#ffffff');
      this.style.setProperty('--dqe-text-secondary', '#8888aa');
    }
  }

  private setupEventListeners() {
    // Tab switching
    const tabs = this.shadow.querySelectorAll('.tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab as 'active' | 'completed';

        tabs.forEach((t) => t.classList.remove('active'));
        target.classList.add('active');

        this.activeTab = tabName;
        this.render();
      });
    });
  }

  /**
   * Set missions to display
   */
  setMissions(missions: Mission[], progress: Map<string, MissionProgress>) {
    this.missions = missions;
    this.progress = progress;
    this.render();
  }

  /**
   * Update a single mission's progress
   */
  updateProgress(missionId: string, progress: MissionProgress) {
    this.progress.set(missionId, progress);
    this.render();
  }

  /**
   * Render the mission list
   */
  private render() {
    const listContainer = this.shadow.querySelector('.mission-list');
    if (!listContainer) return;

    const filteredMissions = this.missions.filter((m) => {
      const prog = this.progress.get(m.id);
      const isCompleted =
        prog?.status === MissionStatus.COMPLETED ||
        prog?.status === MissionStatus.CLAIMED;

      return this.activeTab === 'completed' ? isCompleted : !isCompleted;
    });

    if (filteredMissions.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${this.activeTab === 'completed' ? '🏆' : '🎯'}</div>
          <p class="empty-text">
            ${this.activeTab === 'completed'
          ? 'No completed missions yet. Start earning!'
          : 'No active missions available.'}
          </p>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = filteredMissions
      .map((mission) => this.renderMissionCard(mission))
      .join('');

    // Attach event listeners to action buttons
    listContainer.querySelectorAll('.action-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const missionId = target.dataset.missionId;
        const action = target.dataset.action;

        if (missionId && action) {
          this.dispatchEvent(
            new CustomEvent('mission-action', {
              detail: { missionId, action },
              bubbles: true,
              composed: true,
            })
          );
        }
      });
    });

    // Attach click listeners to cards
    listContainer.querySelectorAll('.mission-card').forEach((card) => {
      card.addEventListener('click', () => {
        const missionId = (card as HTMLElement).dataset.missionId;
        if (missionId) {
          this.dispatchEvent(
            new CustomEvent('mission-click', {
              detail: { missionId },
              bubbles: true,
              composed: true,
            })
          );
        }
      });
    });
  }

  /**
   * Render a single mission card
   */
  private renderMissionCard(mission: Mission): string {
    const prog = this.progress.get(mission.id);
    const progressPercent = prog?.progressPercent || 0;
    const isCompleted = prog?.status === MissionStatus.COMPLETED;
    const isClaimed = prog?.status === MissionStatus.CLAIMED;
    const isInProgress = prog?.status === MissionStatus.IN_PROGRESS;

    const typeIcon = this.getMissionTypeIcon(mission.type);
    const difficultyClass = mission.difficulty.toLowerCase();

    let actionButton = '';
    if (isClaimed) {
      actionButton = `<button class="action-btn claimed" disabled>Claimed ✓</button>`;
    } else if (isCompleted) {
      actionButton = `<button class="action-btn claim" data-mission-id="${mission.id}" data-action="claim">Claim Reward</button>`;
    } else if (isInProgress) {
      actionButton = `<span class="progress-label">${Math.round(progressPercent)}%</span>`;
    } else {
      actionButton = `<button class="action-btn start" data-mission-id="${mission.id}" data-action="start">Start</button>`;
    }

    return `
      <div class="mission-card ${isCompleted || isClaimed ? 'completed' : ''}" data-mission-id="${mission.id}">
        <div class="mission-header">
          <div class="mission-info">
            <h3 class="mission-name">${mission.name}</h3>
            <span class="mission-type">${typeIcon} ${mission.type}</span>
          </div>
          <span class="difficulty ${difficultyClass}">${mission.difficulty}</span>
        </div>
        
        <p class="mission-description">${mission.description}</p>
        
        ${isInProgress || isCompleted ? `
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill ${isCompleted ? 'completed' : ''}" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">
              <span>${prog?.currentValue || 0} / ${prog?.targetValue || 1}</span>
              <span>${Math.round(progressPercent)}%</span>
            </div>
          </div>
        ` : ''}
        
        <div class="mission-footer">
          <div class="reward">
            <span class="reward-icon">⭐</span>
            <span>${mission.reward.points} pts</span>
          </div>
          ${actionButton}
        </div>
      </div>
    `;
  }

  /**
   * Get icon for mission type
   */
  private getMissionTypeIcon(type: MissionType): string {
    const icons: Record<MissionType, string> = {
      [MissionType.SWAP]: '🔄',
      [MissionType.VOLUME]: '📊',
      [MissionType.STREAK]: '🔥',
      [MissionType.PRICE]: '💰',
      [MissionType.ROUTING]: '🛣️',
      [MissionType.LIMIT_ORDER]: '📋',
      [MissionType.DCA]: '⏰',
      [MissionType.PREDICTION]: '🔮',
      [MissionType.STAKING]: '🥩',
    };
    return icons[type] || '🎯';
  }
}

// Register the custom element
customElements.define('quest-mission-list', MissionListElement);
