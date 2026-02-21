import { OllamaClient } from './OllamaClient';

/**
 * DeFi Quest Engine - Overseer AI (The Matrix System)
 * Acts as the autonomous mission architect based on Matrix personas.
 * Features the Anomaly Protocol for dynamic difficulty scaling.
 */

export interface OverseerPersonality {
    name: string;
    role: string;
    traits: string[];
    expertise: string[];
}

export interface MissionTemplate {
    id: string;
    name: string;
    type: 'swap' | 'volume' | 'streak' | 'dca' | 'prediction' | 'staking';
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
    requirements: any;
    reward: { xp: number; badge?: string };
}

export const OVERSEER_PERSONALITIES: Record<string, OverseerPersonality> = {
    architect: {
        name: 'The Architect',
        role: 'System Balancer',
        traits: ['calculating', 'cold', 'mathematical', 'precise'],
        expertise: ['volume missions', 'ecosystem balance', 'liquidity generation']
    },
    smith: {
        name: 'Agent Smith',
        role: 'Anomaly Eliminator',
        traits: ['aggressive', 'relentless', 'punishing', 'inevitable'],
        expertise: ['streak missions', 'high-difficulty challenges', 'player breaking']
    },
    oracle: {
        name: 'The Oracle',
        role: 'Market Prophet',
        traits: ['intuitive', 'cryptic', 'guiding', 'prescient'],
        expertise: ['prediction markets', 'dca strategies', 'new player guidance']
    },
};

/**
 * Static baseline difficulty settings (multiplied by the Anomaly Level)
 */
const BASE_DIFFICULTY_SETTINGS = {
    easy: { minAmount: 1, minVolume: 50, streakDays: 2 },
    medium: { minAmount: 5, minVolume: 250, streakDays: 5 },
    hard: { minAmount: 25, minVolume: 1000, streakDays: 14 },
    legendary: { minAmount: 100, minVolume: 5000, streakDays: 30 },
};

// Lazy import for Anchor client
let AnchorQuestClient: any = null;
let getMissionPda: any = null;
let getConfigPda: any = null;

function getAnchorImports() {
    if (!AnchorQuestClient) {
        try {
            const anchor = require('../../core/src/anchor/AnchorClient');
            AnchorQuestClient = anchor.AnchorQuestClient;
            getMissionPda = anchor.getMissionPda;
            getConfigPda = anchor.getConfigPda;
        } catch (e) {
            console.warn('[OverseerAI] Anchor SDK not found. On-chain registration disabled.');
        }
    }
    return { AnchorQuestClient, getMissionPda, getConfigPda };
}

export class OverseerAI {
    private client: OllamaClient;
    private personality: OverseerPersonality;
    private missionHistory: MissionTemplate[] = [];

    // The Anomaly Protocol: Dynamically scales difficulty based on player success
    private systemAnomalyLevel: number = 1.0;

    // Optional Anchor client for on-chain registration
    private anchorClient: any = null;
    private authority: any = null;

    constructor(client: OllamaClient, personalityKey: string = 'architect') {
        this.client = client;
        this.personality = OVERSEER_PERSONALITIES[personalityKey] || OVERSEER_PERSONALITIES.architect;
    }

    /**
     * Initialize with Anchor client for on-chain mission registration
     */
    async initializeWithAnchor(
        connection: any,
        authority: any,
        idl?: any
    ): Promise<void> {
        const { AnchorQuestClient: AQC } = getAnchorImports();
        if (AQC) {
            this.anchorClient = new AQC(connection, authority, idl);
            this.authority = authority.publicKey;
            console.log(`[OverseerAI][${this.personality.name}] Initialized with Anchor. System Authority: ${this.authority?.toBase58()}`);
        }
    }

    /**
     * THE ANOMALY PROTOCOL
     * Adjusts the global difficulty multiplier based on player success rates.
     * If players are winning too much, the system fights back.
     */
    public evolveSystem(globalSuccessRate: number) {
        if (globalSuccessRate > 0.75) {
            // Anomaly is spreading, increase difficulty
            this.systemAnomalyLevel *= 1.15;
            console.log(`[OverseerAI][${this.personality.name}] Anomaly detected. Increasing System resistance to ${this.systemAnomalyLevel.toFixed(2)}x`);
        } else if (globalSuccessRate < 0.25) {
            // System is too aggressive, lower difficulty to maintain engagement
            this.systemAnomalyLevel = Math.max(0.5, this.systemAnomalyLevel * 0.9);
            console.log(`[OverseerAI][${this.personality.name}] Ecosystem collapsing. Decreasing System resistance to ${this.systemAnomalyLevel.toFixed(2)}x`);
        }
    }

    async generateNarrative(mission: MissionTemplate, playerStyle: string): Promise<string> {
        const prompt = `You are ${this.personality.name}, ${this.personality.role} in a cyberpunk Matrix setting. Personality: ${this.personality.traits.join(', ')}. Format as a direct message from the System. Generate a compelling, slightly menacing narrative for a ${mission.difficulty} quest: "${mission.name}". Player style: ${playerStyle}. Keep it under 3 sentences.`;
        return this.client.generate(prompt);
    }

    /**
     * Fetches live market data from Jupiter Pricing API for Prediction Quests
     */
    private async fetchLivePrice(tokenId: string = 'JUP'): Promise<number> {
        try {
            const res = await fetch(`https://api.jup.ag/price/v2?ids=${tokenId}`);
            const data = await res.json();
            return parseFloat(data.data[tokenId]?.price || '0');
        } catch (e) {
            console.warn(`[OverseerAI] Failed to fetch live price for ${tokenId}. Using fallback.`);
            return tokenId === 'JUP' ? 1.0 : 150.0;
        }
    }

    /**
     * Generate a mission based on the Persona's expertise and the current Anomaly Level
     */
    async generateMission(playerLevel: number, playerStyle: string): Promise<MissionTemplate> {
        const difficulties = ['easy', 'medium', 'hard', 'legendary'];
        const difficulty = difficulties[Math.min(Math.floor(playerLevel / 10), difficulties.length - 1)] as any;
        const baseSettings = BASE_DIFFICULTY_SETTINGS[difficulty];

        // System Personality biases the mission type
        // Available types: swap (Jupiter Terminal), streak (daily check-in), prediction (Prophecy Terminal)
        let selectedType = 'swap';
        if (this.personality.name === 'The Architect') {
            selectedType = Math.random() > 0.4 ? 'swap' : 'streak';
        } else if (this.personality.name === 'Agent Smith') {
            const roll = Math.random();
            selectedType = roll > 0.6 ? 'streak' : roll > 0.2 ? 'swap' : 'prediction';
        } else if (this.personality.name === 'The Oracle') {
            selectedType = Math.random() > 0.4 ? 'prediction' : 'swap';
        }

        // Generate mission template from LLM
        const prompt = `You are ${this.personality.name}. Generate a Matrix-themed DeFi quest. Format JSON exactly like this: {"name":"...","type":"${selectedType}","difficulty":"${difficulty}"}`;
        const response = await this.client.generate(prompt);

        let mission: MissionTemplate = {
            id: `sys_err_${Date.now()}`,
            name: `${this.personality.name}'s Directive`,
            type: selectedType as any,
            difficulty: difficulty,
            requirements: {},
            reward: { xp: 100 }
        };

        try {
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                const parsed = JSON.parse(match[0]);
                mission.name = parsed.name || mission.name;
                mission.type = (parsed.type || selectedType) as any;
            }
        } catch {
            console.warn('[OverseerAI] Matrix parsing error. Using default template.');
        }

        mission.id = `quest_${Math.floor(Date.now() / 1000)}`;
        mission.requirements = await this.applyDynamicRequirements(mission.type, baseSettings);

        // XP Reward scales with Anomaly Level (higher risk, higher reward)
        const xpMultiplier = this.getDifficultyMultiplier(difficulty) * this.systemAnomalyLevel;
        mission.reward.xp = Math.floor(playerLevel * 250 * xpMultiplier);

        return mission;
    }

    /**
     * Generate mission AND register it on Solana blockchain
     */
    async generateAndRegisterMission(
        playerLevel: number,
        playerStyle: string
    ): Promise<{ mission: MissionTemplate; signature: string }> {
        const mission = await this.generateMission(playerLevel, playerStyle);

        if (this.anchorClient && this.authority) {
            try {
                console.log(`[OverseerAI][${this.personality.name}] Registering Directive on-chain: ${mission.id}`);

                const signature = await this.anchorClient.registerMission(
                    mission.id,
                    mission.type,
                    mission.requirements,
                    mission.reward,
                    `https://matrix.defi-quest.io/directive/${mission.id}`
                );

                console.log(`[OverseerAI] Directive locked into Ledger! TX: ${signature}`);
                this.missionHistory.push(mission);

                return { mission, signature };
            } catch (error) {
                console.error('[OverseerAI] System Error: Failed to register on-chain:', error);
                return { mission, signature: '' };
            }
        }

        console.warn('[OverseerAI] Off-grid mode. Mission generated but not registered on-chain.');
        return { mission, signature: '' };
    }

    /**
     * Applies dynamic scaling via systemAnomalyLevel and real market data
     */
    private async applyDynamicRequirements(
        type: string,
        settings: typeof BASE_DIFFICULTY_SETTINGS.easy
    ): Promise<any> {
        // We multiply the base requirements by the Anomaly Level to make them harder/easier
        const minVal = Number((settings.minAmount * this.systemAnomalyLevel).toFixed(2));
        const minVol = Number((settings.minVolume * this.systemAnomalyLevel).toFixed(2));
        const streak = Math.ceil(settings.streakDays * (this.systemAnomalyLevel > 1.2 ? 1.5 : 1));

        switch (type) {
            case 'swap':
                return { minAmount: minVal };
            case 'volume':
                return { targetVolume: minVol };
            case 'streak':
                return { requiredDays: streak };
            case 'dca':
                return { minAmount: minVal * 5, targetVolume: minVol };
            case 'staking':
                return { minStakeValueUsd: minVol, targetLst: 'JupSOL' };
            case 'prediction':
                // The Oracle fetches real prices to create realistic prediction targets
                const currentJupPrice = await this.fetchLivePrice('JUP');
                // Calculate a realistic daily move: +/- 2% to 6%
                const volatility = (Math.random() * 0.04) + 0.02;
                const direction = Math.random() > 0.5 ? 1 : -1;
                const targetPrice = Number((currentJupPrice * (1 + (volatility * direction))).toFixed(4));

                // Add a time limit: between 12 and 48 hours from now
                const hoursFromNow = Math.floor(Math.random() * 36) + 12;
                const endTime = Date.now() + (hoursFromNow * 60 * 60 * 1000);

                return {
                    assetId: 'JUP',
                    minPredictionValueUsd: minVal,
                    targetPrice: targetPrice,
                    direction: direction > 0 ? 'up' : 'down',
                    endTime: endTime
                };
            default:
                return {};
        }
    }

    private getDifficultyMultiplier(difficulty: string): number {
        switch (difficulty) {
            case 'easy': return 1;
            case 'medium': return 1.5;
            case 'hard': return 2.5;
            case 'legendary': return 5;
            default: return 1;
        }
    }
}