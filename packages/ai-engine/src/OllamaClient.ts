import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { createJupiterApiClient } from '@jup-ag/api';

/**
 * DeFi Quest Engine - Ollama Client
 * Interfaces with local llama3.2 for trading intelligence
 */

// ✅ CORRECT TOKEN ADDRESSES (FIXED)
const TOKEN_MINTS: Record<string, string> = {
    SOL: 'So11111111111111111111111111111111111111112',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11Mcx8eKs1dish',
    WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
    JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtpqjgNtWGMdBgXxTrXJ'
};

export interface OllamaConfig {
    model: string;
    baseUrl?: string;
    temperature?: number;
}

export interface AgentMemory {
    walletAddress: string;
    personality: string;
    trades: any[];
    totalTrades: number;
    successfulTrades: number;
    lastAction: string;
}

export class OllamaClient {
    private model: string;
    private baseUrl: string;
    private temperature: number;
    private connection: Connection;
    private jupiter: any;

    constructor(config: OllamaConfig, c: Connection) {
        this.model = config.model;
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.temperature = config.temperature || 0.7;
        this.connection = c;
        this.jupiter = createJupiterApiClient();
    }

    async generate(prompt: string): Promise<string> {
        try {
            const res = await fetch(this.baseUrl + '/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    stream: false,
                    options: { temperature: this.temperature }
                })
            });
            const d = await res.json();
            return d.response || '';
        } catch (e) {
            console.error('Ollama error:', e);
            return '{"action":"wait","params":{}}';
        }
    }

    async agentThink(memory: AgentMemory, marketData: string): Promise<{ thought: string; action: string; params: any }> {
        const winRate = memory.totalTrades > 0
            ? (memory.successfulTrades / memory.totalTrades * 100).toFixed(1)
            : 'N/A';

        const prompt = `You are a Solana trading AI. State: ${memory.walletAddress.slice(0, 8)}, P: ${memory.personality}, T:${memory.totalTrades}, WR: ${winRate}%. Market:${marketData}. JSON only: {"action":"swap"|"wait","params": {"input":"SOL","output":"USDC","amount":0.1}}`;

        const r = await this.generate(prompt);
        try {
            const m = r.match(/\{[\s\S]*\}/);
            if (m) return JSON.parse(m[0]);
        } catch { }
        return { thought: 'Hold', action: 'wait', params: {} };
    }

    async executeSwap(inputToken: string, outputToken: string, amount: number, keypair: Keypair): Promise<{ signature: string; success: boolean; outputAmount: number }> {
        try {
            const inputMint = TOKEN_MINTS[inputToken] || inputToken;
            const outputMint = TOKEN_MINTS[outputToken] || outputToken;

            const quote = await this.jupiter.quoteGet({
                inputMint,
                outputMint,
                amount: Math.floor(amount * 1e9),
                slippageBps: 100
            });

            if (!quote) {
                console.log('No quote available for', inputToken, '->', outputToken);
                return { signature: '', success: false, outputAmount: 0 };
            }

            const swapResult = await this.jupiter.swapPost({
                swapRequest: {
                    quoteResponse: quote,
                    userPublicKey: keypair.publicKey.toString(),
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 0
                }
            });

            const swapTransactionBuf = Buffer.from(swapResult.swapTransaction, 'base64');
            const { VersionedTransaction } = await import('@solana/web3.js');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            transaction.sign([keypair]);

            const signature = await this.connection.sendTransaction(transaction, {
                preflightCommitment: 'confirmed'
            });

            const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
            const success = !confirmation.value?.err;

            console.log(`Swap ${success ? 'SUCCESS' : 'FAILED'}: ${signature.slice(0, 8)}...`);

            return { signature, success, outputAmount: Number(quote.outAmount) / 1e9 };
        } catch (e) {
            console.error('Swap error:', e);
            return { signature: '', success: false, outputAmount: 0 };
        }
    }

    async getBalance(pk: PublicKey): Promise<number> {
        try {
            return (await this.connection.getBalance(pk)) / 1e9;
        } catch {
            return 0;
        }
    }

    async getMarketData(): Promise<string> {
        try {
            const q = await this.jupiter.quoteGet({
                inputMint: TOKEN_MINTS.SOL,
                outputMint: TOKEN_MINTS.USDC,
                amount: 1e9,
                slippageBps: 50
            });
            return q ? `SOL:$${(Number(q.outAmount) / 1e6).toFixed(2)}` : 'N/A';
        } catch {
            return 'unavailable';
        }
    }
}