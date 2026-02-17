import { OllamaClient } from './OllamaClient';

/**
 * DeFi Quest Engine - Overseer AI
 * Acts as a Game Master or Quest Architect using local LLM
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
    requirements: any;
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

export class OverseerAI {
    private client: OllamaClient;
    private personality: OverseerPersonality;
    private missionHistory: MissionTemplate[] = [];

    constructor(client: OllamaClient, personalityKey: string = 'strategos') {
        this.client = client;
        this.personality = OVERSEER_PERSONALITIES[personalityKey] || OVERSEER_PERSONALITIES.strategos;
    }

    async generateNarrative(mission: MissionTemplate, playerStyle: string): Promise<string> {
        const prompt = `You are ${this.personality.name}, ${this.personality.role}. Personality: ${this.personality.traits.join(', ')}. Generate a compelling narrative for a ${mission.difficulty} quest: "${mission.name}". Player style: ${playerStyle}. Create an immersive story description (2-3 sentences).`;
        return this.client.generate(prompt);
    }

    async generateMission(playerLevel: number, playerStyle: string): Promise<MissionTemplate> {
        const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard'];
        const difficulty = difficulties[Math.min(Math.floor(playerLevel / 5), difficulties.length - 1)] as any;

        const prompt = `Generate a unique DeFi quest. Format JSON: {"id":"...","name":"...","type":"swap|volume|streak","difficulty":"${difficulty}","requirements": {},"reward":{"xp":${playerLevel * 100}}}`;
        const response = await this.client.generate(prompt);

        try {
            const match = response.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch { }

        return { id: `quest_${Date.now()}`, name: 'Mystery Swap', type: 'swap', difficulty: 'medium', requirements: {}, reward: { xp: 100 } };
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
