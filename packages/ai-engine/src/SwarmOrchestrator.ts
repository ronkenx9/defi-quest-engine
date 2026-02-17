import { Connection } from '@solana/web3.js';
import { AgentManager, AgentInstance } from './AgentManager';
import { TraderPersonality } from './AgentPersonality';
import { SwapExecutor } from './SwapExecutor';

export interface SwarmConfig {
    agentCount: number;
    pollInterval: number; // ms
    maxConcurrentSwaps: number;
    network?: 'mainnet-beta' | 'devnet' | 'testnet';
}

export interface AgentStats {
    name: string;
    pubkey: string;
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
 * Swarm Orchestrator - Orchestrates multiple agents to simulate an ecosystem
 * Now with REAL Jupiter swap execution!
 */
export class SwarmOrchestrator {
    private manager: AgentManager;
    private swapExecutor: SwapExecutor;
    private config: SwarmConfig;
    private running: boolean = false;
    private interval: NodeJS.Timeout | null = null;

    constructor(connection: Connection, config: SwarmConfig) {
        this.manager = new AgentManager(connection);
        this.config = config;
        this.swapExecutor = new SwapExecutor(connection);
    }

    /**
     * Initialize the swarm with agents
     */
    async initialize(personalities: TraderPersonality[], fundAgents: boolean = false) {
        console.log(`[Swarm] Initializing ${this.config.agentCount} agents...`);
        console.log(`[Swarm] Network: ${this.config.network || 'devnet'}`);

        for (let i = 0; i < this.config.agentCount; i++) {
            const personality = personalities[i % personalities.length];
            const name = `${personality.name}-${i}`;
            const agent = this.manager.createAgent(name, personality);

            console.log(`[Swarm] Created agent: ${name} (${agent.keypair.publicKey.toString().slice(0, 8)}...)`);

            // Optionally fund agents on devnet
            if (fundAgents) {
                try {
                    console.log(`[Swarm] Requesting airdrop for ${name}...`);
                    await this.manager.fundAgent(name, 2); // 2 SOL
                    const balance = await this.manager.getBalance(name);
                    console.log(`[Swarm] ${name} funded: ${balance.toFixed(4)} SOL`);
                } catch (err) {
                    console.log(`[Swarm] Airdrop failed for ${name} (may need faucet):`, err);
                }
            }
        }
    }

    /**
     * Start the swarm activity simulation with REAL swaps
     */
    start() {
        if (this.running) return;
        this.running = true;

        console.log(`[Swarm] Simulation started. Polling every ${this.config.pollInterval}ms`);
        console.log(`[Swarm] MAX concurrent swaps: ${this.config.maxConcurrentSwaps}`);

        this.interval = setInterval(async () => {
            await this.tick();
        }, this.config.pollInterval);
    }

    /**
     * Stop the swarm
     */
    stop() {
        this.running = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        console.log(`[Swarm] Simulation stopped.`);
    }

    /**
     * Single simulation tick
     */
    private async tick() {
        const agents = this.manager.getAllAgents();

        for (const agent of agents) {
            // Skip if agent has no balance
            const balance = await this.manager.getBalance(agent.keypair.publicKey.toString());
            
            if (balance < 0.1) {
                console.log(`[Swarm] [${agent.personality['personality'].name}] Low balance (${balance.toFixed(4)} SOL), skipping...`);
                continue;
            }

            // Get decision from personality engine
            const activeMissions = [
                { id: 'm1', type: 'swap', name: 'First Swap', completed: false }
            ];

            const decision = await agent.personality.decideNextAction(balance, activeMissions);

            if (decision.action === 'swap' && decision.swapDetails) {
                console.log(`[Swarm] [${agent.personality['personality'].name}] Decided: ${decision.reasoning}`);
                await this.executeAgentSwap(agent, decision.swapDetails);
            }
        }
    }

    /**
     * Execute a REAL swap via Jupiter
     */
    private async executeAgentSwap(agent: AgentInstance, details: any) {
        const agentName = agent.personality['personality'].name;
        
        try {
            console.log(`[Swarm] [${agentName}] EXECUTING REAL SWAP: ${details.inputToken} -> ${details.outputToken} (${details.amount.toFixed(4)} SOL)`);
            
            // Execute the swap
            const result = await this.swapExecutor.swap(
                {
                    inputToken: details.inputToken,
                    outputToken: details.outputToken,
                    amount: details.amount,
                },
                agent.keypair
            );

            if (result.success) {
                console.log(`[Swarm] [${agentName}] SWAP SUCCESS! Signature: ${result.signature.slice(0, 8)}...`);
                console.log(`[Swarm] [${agentName}] Received ${result.outputAmount.toFixed(6)} ${details.outputToken} (impact: ${result.priceImpact.toFixed(2)}%)`);
                
                // Update stats
                agent.stats.swapsExecuted++;
                agent.stats.swapsSucceeded++;
                agent.stats.totalVolume += details.amount;
                agent.stats.xpEarned += Math.floor(details.amount * 100);
            } else {
                console.log(`[Swarm] [${agentName}] SWAP FAILED`);
                agent.stats.swapsExecuted++;
                agent.stats.swapsFailed++;
            }
        } catch (error) {
            console.log(`[Swarm] [${agentName}] Swap error:`, error);
            agent.stats.swapsFailed++;
        }
    }

    /**
     * Get swarm statistics
     */
    getStats(): AgentStats[] {
        return this.manager.getAllAgents().map(a => ({
            name: a.personality['personality'].name,
            pubkey: a.keypair.publicKey.toString(),
            stats: a.stats
        }));
    }

    /**
     * Print formatted statistics table
     */
    printStats() {
        const stats = this.getStats();
        console.log('\n--- Swarm Statistics ---');
        console.table(stats.map(s => ({
            Agent: s.name,
            Swaps: s.stats.swapsExecuted,
            Success: s.stats.swapsSucceeded,
            Failed: s.stats.swapsFailed,
            'Volume (SOL)': s.stats.totalVolume.toFixed(2),
            'XP Earned': s.stats.xpEarned
        })));
    }
}
