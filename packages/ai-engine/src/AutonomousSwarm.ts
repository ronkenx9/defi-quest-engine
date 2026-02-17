import { Connection, Keypair } from '@solana/web3.js';
import { OllamaClient } from './OllamaClient';
import { OverseerAI } from './OverseerAI';

/**
 * DeFi Quest Engine - Autonomous Swarm
 * Manages multiple AI agents interacting with the quest system
 */

interface Agent {
    keypair: Keypair;
    personality: string;
    memory: { trades: any[]; totalTrades: number; successfulTrades: number; lastAction: string };
    ollama: OllamaClient;
}

export class AutonomousSwarm {
    private connection: Connection;
    private agents: Agent[] = [];
    private overseer: OverseerAI;
    private running: boolean = false;
    private ollamaModel: string;

    constructor(connection: Connection, ollamaModel: string = 'llama3.2') {
        this.connection = connection;
        this.ollamaModel = ollamaModel;

        const ollama = new OllamaClient({ model: ollamaModel }, connection);
        this.overseer = new OverseerAI(ollama, 'strategos');

        console.log(`🤖 AutonomousSwarm initialized with model: ${ollamaModel}`);
    }

    async addAgent(personality: string): Promise<Agent> {
        const keypair = Keypair.generate();

        const ollama = new OllamaClient({ model: this.ollamaModel }, this.connection);

        const agent: Agent = {
            keypair,
            personality,
            memory: {
                trades: [],
                totalTrades: 0,
                successfulTrades: 0,
                lastAction: 'initialized'
            },
            ollama
        };

        this.agents.push(agent);
        console.log(`✅ Added agent: ${personality} (${keypair.publicKey.toString().slice(0, 8)}...)`);
        return agent;
    }

    async fundAgent(agent: Agent, amount: number = 2): Promise<void> {
        try {
            const sig = await this.connection.requestAirdrop(
                agent.keypair.publicKey,
                amount * 1e9
            );
            await this.connection.confirmTransaction(sig);
            console.log(`💰 Airdropped ${amount} SOL to ${agent.personality}`);
        } catch (e) {
            console.log(`⚠️ Airdrop failed for ${agent.personality} (may need faucet)`);
        }
    }

    async start() {
        this.running = true;
        console.log('\n🚀 Autonomous Swarm Started with Ollama (llama3.2)\n');

        const tick = async () => {
            if (!this.running) return;

            for (const agent of this.agents) {
                try {
                    // Get market data
                    const marketData = await agent.ollama.getMarketData();

                    // Get AI decision
                    const decision = await agent.ollama.agentThink(
                        {
                            walletAddress: agent.keypair.publicKey.toString(),
                            personality: agent.personality,
                            ...agent.memory
                        },
                        marketData
                    );

                    console.log(`[${agent.personality}] 💭 ${decision.thought}`);
                    console.log(`[${agent.personality}] 🎯 ${decision.action}`);

                    // Execute swap if decided
                    if (decision.action === 'swap') {
                        const tokens = ['SOL', 'WIF', 'BONK', 'JUP', 'USDC'];
                        const input = tokens[Math.floor(Math.random() * tokens.length)];
                        const output = tokens[Math.floor(Math.random() * tokens.length)];
                        const amount = 0.05 + Math.random() * 0.2; // Small amounts for testing

                        console.log(`[${agent.personality}] 🔄 Swapping ${amount.toFixed(3)} ${input} -> ${output}`);

                        const result = await agent.ollama.executeSwap(input, output, amount, agent.keypair);

                        agent.memory.trades.push({
                            input,
                            output,
                            amount,
                            success: result.success,
                            signature: result.signature
                        });

                        agent.memory.totalTrades++;
                        if (result.success) agent.memory.successfulTrades++;
                        agent.memory.lastAction = result.success
                            ? `Swapped ${input}→${output}`
                            : 'Swap failed';
                    }
                } catch (e) {
                    console.error(`[${agent.personality}] Error:`, e);
                }
            }

            // Print stats
            this.printStats();
            setTimeout(tick, 20000); // Recursive timeout instead of setInterval for cleaner lifecycle
        };

        tick();
    }

    printStats() {
        console.log('\n📊 Swarm Stats:');
        for (const agent of this.agents) {
            const winRate = agent.memory.totalTrades > 0
                ? (agent.memory.successfulTrades / agent.memory.totalTrades * 100).toFixed(1)
                : '0';
            console.log(`  ${agent.personality}: ${agent.memory.totalTrades} trades, ${winRate}% win rate`);
        }
    }

    stop() {
        this.running = false;
        console.log('\n🛑 Swarm stopped');
    }
}
