import { Keypair, PublicKey, Connection } from '@solana/web3.js';
import { AgentPersonalityEngine, TraderPersonality } from './AgentPersonality';

export interface AgentInstance {
    keypair: Keypair;
    personality: AgentPersonalityEngine;
    stats: {
        swapsExecuted: number;
        swapsSucceeded: number;
        swapsFailed: number;
        totalVolume: number;
        xpEarned: number;
        missionsCompleted: number;
    };
}

/**
 * Agent Manager - Manages individual AI agents within the swarm
 */
export class AgentManager {
    private agents: Map<string, AgentInstance> = new Map();
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Create a new AI agent with a specific personality
     */
    createAgent(name: string, personality: TraderPersonality): AgentInstance {
        const keypair = Keypair.generate();
        const engine = new AgentPersonalityEngine(personality);

        const instance: AgentInstance = {
            keypair,
            personality: engine,
            stats: {
                swapsExecuted: 0,
                swapsSucceeded: 0,
                swapsFailed: 0,
                totalVolume: 0,
                xpEarned: 0,
                missionsCompleted: 0
            }
        };

        this.agents.set(name, instance);
        return instance;
    }

    /**
     * Get an agent by name
     */
    getAgent(name: string): AgentInstance | undefined {
        return this.agents.get(name);
    }

    /**
     * Get all agents
     */
    getAllAgents(): AgentInstance[] {
        return Array.from(this.agents.values());
    }

    /**
     * Fund an agent with SOL (devnet airdrop)
     */
    async fundAgent(name: string, amount: number = 2) {
        const agent = this.getAgent(name);
        if (!agent) throw new Error(`Agent ${name} not found`);

        try {
            const signature = await this.connection.requestAirdrop(
                agent.keypair.publicKey,
                amount * 1_000_000_000 // Convert SOL to lamports
            );
            await this.connection.confirmTransaction(signature, 'confirmed');
            return signature;
        } catch (error) {
            console.error('Airdrop failed:', error);
            throw error;
        }
    }

    /**
     * Get agent balance by public key string
     */
    async getBalance(pubkeyStr: string): Promise<number> {
        try {
            const pubkey = new PublicKey(pubkeyStr);
            const balance = await this.connection.getBalance(pubkey);
            return balance / 1_000_000_000; // Convert lamports to SOL
        } catch (error) {
            return 0;
        }
    }
}
