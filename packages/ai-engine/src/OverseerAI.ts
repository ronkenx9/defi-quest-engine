import { OllamaClient } from './OllamaClient';

/**
 * DeFi Quest Engine - Overseer AI
 * Acts as a Game Master or Quest Architect using local LLM
 * Now with on-chain mission registration!
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
    type: 'swap' | 'volume' | 'streak' | 'dca';
    difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
    requirements: {
        inputToken?: string;
        outputToken?: string;
        minAmount?: number;
        targetVolume?: number;
        requiredDays?: number;
    };
    reward: { xp: number; badge?: string };
}

export const OVERSEER_PERSONALITIES: Record<string, OverseerPersonality> = {
    strategos: {
        name: 'Strategos',
        role: 'Grand Strategist',
        traits: ['calculating', 'patient', 'long-term'],
        expertise: ['market analysis', 'risk management']
    },
    curator: {
        name: 'Curator',
        role: 'Quest Architect',
        traits: ['creative', 'storyteller', 'engaging'],
        expertise: ['mission design', 'narrative generation']
    },
    oracle: {
        name: 'Oracle',
        role: 'Market Prophet',
        traits: ['intuitive', 'wise', 'mysterious'],
        expertise: ['predictions', 'market sentiment']
    },
};

/**
 * Mission difficulty settings
 */
const DIFFICULTY_SETTINGS = {
    easy: { minAmount: 0.1, minVolume: 10, streakDays: 1 },
    medium: { minAmount: 0.5, minVolume: 50, streakDays: 3 },
    hard: { minAmount: 1, minVolume: 200, streakDays: 7 },
    legendary: { minAmount: 5, minVolume: 1000, streakDays: 30 },
};

// Lazy import for Anchor client to avoid circular deps
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
            console.warn('[OverseerAI] Anchor client not available');
        }
    }
    return { AnchorQuestClient, getMissionPda, getConfigPda };
}

export class OverseerAI {
    private client: OllamaClient;
    private personality: OverseerPersonality;
    private missionHistory: MissionTemplate[] = [];
    
    // Optional Anchor client for on-chain registration
    private anchorClient: any = null;
    private authority: any = null;

    constructor(client: OllamaClient, personalityKey: string = 'strategos') {
        this.client = client;
        this.personality = OVERSEER_PERSONALITIES[personalityKey] || OVERSEER_PERSONALITIES.strategos;
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
            console.log(`[OverseerAI] Initialized with Anchor. Authority: ${this.authority?.toBase58()}`);
        } else {
            console.warn('[OverseerAI] Anchor client not available');
        }
    }

    async generateNarrative(mission: MissionTemplate, playerStyle: string): Promise<string> {
        const prompt = `You are ${this.personality.name}, ${this.personality.role}. Personality: ${this.personality.traits.join(', ')}. Generate a compelling narrative for a ${mission.difficulty} quest: "${mission.name}". Player style: ${playerStyle}. Create an immersive story description (2-3 sentences).`;
        return this.client.generate(prompt);
    }

    /**
     * Generate a mission - now with optional on-chain registration!
     */
    async generateMission(playerLevel: number, playerStyle: string): Promise<MissionTemplate> {
        const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
        const difficulty = difficulties[Math.min(Math.floor(playerLevel / 5), difficulties.length - 1)] as any;
        const settings = DIFFICULTY_SETTINGS[difficulty];

        // Generate mission template from LLM
        const prompt = `Generate a unique DeFi quest. Format JSON: {"id":"...","name":"...","type":"swap|volume|streak|dca","difficulty":"${difficulty}","requirements": {},"reward":{"xp":${playerLevel * 100}}}`;
        const response = await this.client.generate(prompt);

        let mission: MissionTemplate;
        try {
            const match = response.match(/\{[\s\S]*\}/);
            if (match) {
                mission = JSON.parse(match[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch {
            mission = { 
                id: `quest_${Date.now()}`, 
                name: 'Mystery Swap', 
                type: 'swap', 
                difficulty: 'medium', 
                requirements: {},
                reward: { xp: 100 } 
            };
        }

        mission.difficulty = difficulty;
        mission.requirements = this.applyDifficultyRequirements(mission.type, settings);
        mission.reward.xp = playerLevel * 100 * this.getDifficultyMultiplier(difficulty);
        
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
                console.log(`[OverseerAI] Registering mission on-chain: ${mission.id}`);
                
                const signature = await this.anchorClient.registerMission(
                    mission.id,
                    mission.type,
                    mission.requirements,
                    mission.reward,
                    `https://defi-quest.io/missions/${mission.id}`
                );
                
                console.log(`[OverseerAI] Mission registered! TX: ${signature}`);
                this.missionHistory.push(mission);
                
                return { mission, signature };
            } catch (error) {
                console.error('[OverseerAI] Failed to register on-chain:', error);
                return { mission, signature: '' };
            }
        }

        console.warn('[OverseerAI] No Anchor client configured. Mission not on-chain.');
        return { mission, signature: '' };
    }

    /**
     * Generate multiple missions at once
     */
    async generateMissionBatch(
        count: number,
        playerLevel: number,
        playerStyle: string,
        registerOnChain: boolean = false
    ): Promise<{ missions: MissionTemplate[]; signatures: string[] }> {
        const missions: MissionTemplate[] = [];
        const signatures: string[] = [];

        for (let i = 0; i < count; i++) {
            const result = registerOnChain 
                ? await this.generateAndRegisterMission(playerLevel, playerStyle)
                : { mission: await this.generateMission(playerLevel, playerStyle), signature: '' };
            
            missions.push(result.mission);
            signatures.push(result.signature);
        }

        return { missions, signatures };
    }

    private applyDifficultyRequirements(
        type: string,
        settings: typeof DIFFICULTY_SETTINGS.easy
    ): MissionTemplate['requirements'] {
        switch (type) {
            case 'swap':
                return { minAmount: settings.minAmount };
            case 'volume':
                return { targetVolume: settings.minVolume };
            case 'streak':
                return { requiredDays: settings.streakDays };
            case 'dca':
                return { minAmount: settings.minAmount * 10, targetVolume: settings.minVolume };
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

    async analyzePlayerBehavior(trades: any[]): Promise<string> {
        if (trades.length < 3) return 'New player - collecting data';
        const recentTrades = trades.slice(-10);
        const successRate = recentTrades.filter(t => t.success).length / recentTrades.length;

        if (successRate > 0.7) return 'Skilled degen - ready for harder quests';
        if (successRate > 0.4) return 'Balanced trader - moderate challenges';
        return 'Cautious player - needs easier missions';
    }

    async generateBadgeDescription(badgeType: string, level: number): Promise<string> {
        const prompt = `As ${this.personality.name}, create a cool description for a ${level}-star ${badgeType} badge (1 sentence, epic style):`;
        return this.client.generate(prompt);
    }
}