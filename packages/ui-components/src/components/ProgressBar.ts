/**
 * DeFi Quest Engine - Progress Bar Component
 * Reusable progress visualization Web Component
 */

const TEMPLATE = `
<style>
  :host {
    --dqe-progress-bg: var(--dqe-progress-background, #2a2a3f);
    --dqe-progress-fill: var(--dqe-progress-color, linear-gradient(90deg, #7c3aed 0%, #a855f7 100%));
    --dqe-progress-height: var(--dqe-bar-height, 8px);
    --dqe-text: var(--dqe-text-color, #ffffff);
    --dqe-text-dim: var(--dqe-text-secondary, #8888aa);
    
    display: block;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .container {
    width: 100%;
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--dqe-text);
  }

  .value {
    font-size: 12px;
    color: var(--dqe-text-dim);
  }

  .progress-track {
    width: 100%;
    height: var(--dqe-progress-height);
    background: var(--dqe-progress-bg);
    border-radius: calc(var(--dqe-progress-height) / 2);
    overflow: hidden;
    position: relative;
  }

  .progress-fill {
    height: 100%;
    background: var(--dqe-progress-fill);
    border-radius: calc(var(--dqe-progress-height) / 2);
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.2) 50%,
      transparent 100%
    );
    animation: shimmer 2s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .progress-fill.completed {
    background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  }

  .progress-fill.completed::after {
    animation: none;
  }

  .milestones {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    position: relative;
  }

  .milestone {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .milestone-marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--dqe-progress-bg);
    border: 2px solid var(--dqe-progress-bg);
    transition: all 0.3s ease;
  }

  .milestone-marker.reached {
    background: #7c3aed;
    border-color: #7c3aed;
    animation: pop 0.3s ease;
  }

  @keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); }
    100% { transform: scale(1); }
  }

  .milestone-label {
    font-size: 10px;
    color: var(--dqe-text-dim);
    margin-top: 4px;
  }

  .milestone-label.reached {
    color: #a855f7;
    font-weight: 500;
  }

  /* Compact mode */
  :host([compact]) .label-row {
    margin-bottom: 4px;
  }

  :host([compact]) .label {
    font-size: 11px;
  }

  :host([compact]) .value {
    font-size: 10px;
  }

  :host([compact]) .milestones {
    display: none;
  }
</style>

<div class="container">
  <div class="label-row">
    <span class="label"></span>
    <span class="value"></span>
  </div>
  <div class="progress-track">
    <div class="progress-fill"></div>
  </div>
  <div class="milestones"></div>
</div>
`;

export interface ProgressBarMilestone {
    value: number;
    label: string;
}

export class ProgressBarElement extends HTMLElement {
    private shadow: ShadowRoot;
    private _value = 0;
    private _max = 100;
    private _label = '';
    private _milestones: ProgressBarMilestone[] = [];

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
        this.shadow.innerHTML = TEMPLATE;
    }

    static get observedAttributes() {
        return ['value', 'max', 'label', 'color', 'height'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'value':
                this._value = parseFloat(newValue) || 0;
                this.updateProgress();
                break;
            case 'max':
                this._max = parseFloat(newValue) || 100;
                this.updateProgress();
                break;
            case 'label':
                this._label = newValue || '';
                this.updateLabel();
                break;
            case 'color':
                this.style.setProperty('--dqe-progress-color', newValue);
                break;
            case 'height':
                this.style.setProperty('--dqe-bar-height', newValue);
                break;
        }
    }

    connectedCallback() {
        this.updateProgress();
        this.updateLabel();
        this.renderMilestones();
    }

    /**
     * Set progress value programmatically
     */
    set value(val: number) {
        this._value = val;
        this.updateProgress();
    }

    get value(): number {
        return this._value;
    }

    /**
     * Set maximum value
     */
    set max(val: number) {
        this._max = val;
        this.updateProgress();
    }

    get max(): number {
        return this._max;
    }

    /**
     * Set milestones
     */
    setMilestones(milestones: ProgressBarMilestone[]) {
        this._milestones = milestones;
        this.renderMilestones();
    }

    /**
     * Update progress bar
     */
    private updateProgress() {
        const fill = this.shadow.querySelector('.progress-fill') as HTMLElement;
        const valueEl = this.shadow.querySelector('.value') as HTMLElement;

        if (!fill || !valueEl) return;

        const percent = Math.min(100, (this._value / this._max) * 100);
        fill.style.width = `${percent}%`;

        // Add completed class
        if (percent >= 100) {
            fill.classList.add('completed');
        } else {
            fill.classList.remove('completed');
        }

        // Update value text
        valueEl.textContent = `${this._value} / ${this._max}`;

        // Update milestones
        this.updateMilestones();

        // Dispatch progress event
        this.dispatchEvent(
            new CustomEvent('progress', {
                detail: { value: this._value, max: this._max, percent },
                bubbles: true,
            })
        );
    }

    /**
     * Update label
     */
    private updateLabel() {
        const labelEl = this.shadow.querySelector('.label') as HTMLElement;
        if (labelEl) {
            labelEl.textContent = this._label;
        }
    }

    /**
     * Render milestones
     */
    private renderMilestones() {
        const container = this.shadow.querySelector('.milestones') as HTMLElement;
        if (!container || this._milestones.length === 0) {
            if (container) container.innerHTML = '';
            return;
        }

        container.innerHTML = this._milestones
            .map((m) => {
                const reached = this._value >= m.value;
                return `
          <div class="milestone" data-value="${m.value}">
            <div class="milestone-marker ${reached ? 'reached' : ''}"></div>
            <span class="milestone-label ${reached ? 'reached' : ''}">${m.label}</span>
          </div>
        `;
            })
            .join('');
    }

    /**
     * Update milestone states
     */
    private updateMilestones() {
        const milestones = this.shadow.querySelectorAll('.milestone');
        milestones.forEach((m) => {
            const value = parseFloat((m as HTMLElement).dataset.value || '0');
            const reached = this._value >= value;

            const marker = m.querySelector('.milestone-marker');
            const label = m.querySelector('.milestone-label');

            if (marker) {
                marker.classList.toggle('reached', reached);
            }
            if (label) {
                label.classList.toggle('reached', reached);
            }
        });
    }
}

// Register the custom element
customElements.define('quest-progress-bar', ProgressBarElement);
