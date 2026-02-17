import { createJupiterApiClient } from '@jup-ag/api';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

export interface JupiterClientConfig {
    connection: Connection;
    apiKey?: string;
}

export class JupiterClient {
    private api: ReturnType<typeof createJupiterApiClient>;
    private connection: Connection;

    constructor(config: JupiterClientConfig) {
        this.api = createJupiterApiClient();
        this.connection = config.connection;
    }

    /**
     * Get a quote for a swap
     */
    async getQuote(params: {
        inputMint: string;
        outputMint: string;
        amount: string;
        slippageBps?: number;
    }) {
        return await this.api.quoteGet({
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: parseInt(params.amount),
            slippageBps: params.slippageBps ?? 50,
        });
    }

    /**
     * Get a swap transaction
     */
    async getSwapTransaction(params: {
        quoteResponse: any;
        userPublicKey: string;
        wrapAndUnwrapSol?: boolean;
    }) {
        const { swapTransaction } = await this.api.swapPost({
            swapRequest: {
                quoteResponse: params.quoteResponse,
                userPublicKey: params.userPublicKey,
                wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 'auto' as any,
            }
        });

        return swapTransaction;
    }

    /**
     * Verify a transaction on-chain (used for mission proof)
     */
    async verifySwap(signature: string) {
        const tx = await this.connection.getTransaction(signature, {
            commitment: 'confirmed',
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) return null;

        // Check if it's a Jupiter transaction (v6)
        // In a real implementation, we'd parse the instructions for the JUP program
        const logMessages = tx.meta?.logMessages || [];
        const isJupiter = logMessages.some(log => log.includes('JUP6LkbZbjS1jKKppriatpYjt8VqnzcyGPVf4ADCPcR'));

        return {
            signature,
            success: !tx.meta?.err,
            timestamp: tx.blockTime,
            isJupiter,
        };
    }
}
