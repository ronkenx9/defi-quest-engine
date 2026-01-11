/**
 * DeFi Quest Engine - Swap Verifier
 * Verifies Jupiter swaps for mission completion
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { ParsedSwapTransaction, TokenInfo, COMMON_TOKENS } from '../missions/MissionTypes';

// Jupiter program IDs
const JUPITER_V6_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const JUPITER_V4_PROGRAM_ID = 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB';

export interface SwapVerificationResult {
    isValid: boolean;
    swap?: ParsedSwapTransaction;
    error?: string;
}

export interface PriceData {
    [mint: string]: {
        price: number;
        symbol: string;
    };
}

export class SwapVerifier {
    private connection: Connection;
    private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
    private priceCacheTTL = 60000; // 1 minute

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Verify a transaction is a valid Jupiter swap
     */
    async verifySwap(signature: string): Promise<SwapVerificationResult> {
        try {
            // Fetch transaction
            const tx = await this.connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (!tx) {
                return { isValid: false, error: 'Transaction not found' };
            }

            if (tx.meta?.err) {
                return { isValid: false, error: 'Transaction failed' };
            }

            // Check if it's a Jupiter transaction
            const isJupiter = this.isJupiterTransaction(tx);
            if (!isJupiter) {
                return { isValid: false, error: 'Not a Jupiter transaction' };
            }

            // Parse swap details
            const swap = await this.parseSwapDetails(tx, signature);
            if (!swap) {
                return { isValid: false, error: 'Failed to parse swap details' };
            }

            return { isValid: true, swap };
        } catch (error) {
            return {
                isValid: false,
                error: error instanceof Error ? error.message : 'Verification failed',
            };
        }
    }

    /**
     * Check if transaction involves Jupiter programs
     */
    private isJupiterTransaction(tx: any): boolean {
        const accountKeys = tx.transaction.message.accountKeys || [];
        const staticAccounts = tx.transaction.message.staticAccountKeys || [];

        const allAccounts = [...accountKeys, ...staticAccounts].map((k: any) =>
            typeof k === 'string' ? k : k.pubkey?.toString() || k.toString()
        );

        return allAccounts.some(
            (addr: string) =>
                addr === JUPITER_V6_PROGRAM_ID || addr === JUPITER_V4_PROGRAM_ID
        );
    }

    /**
     * Parse swap details from transaction
     */
    private async parseSwapDetails(
        tx: any,
        signature: string
    ): Promise<ParsedSwapTransaction | null> {
        try {
            const preBalances = tx.meta?.preTokenBalances || [];
            const postBalances = tx.meta?.postTokenBalances || [];

            // Get the wallet address (first account is usually the payer)
            const accountKeys = tx.transaction.message.accountKeys ||
                tx.transaction.message.staticAccountKeys || [];
            const walletAddress = accountKeys[0]?.pubkey?.toString() ||
                accountKeys[0]?.toString() || '';

            // Find input token (balance decreased)
            let inputToken: TokenInfo | null = null;
            let inputAmount = 0;

            // Find output token (balance increased)
            let outputToken: TokenInfo | null = null;
            let outputAmount = 0;

            // Compare pre and post balances
            for (const post of postBalances) {
                const pre = preBalances.find(
                    (p: any) => p.mint === post.mint && p.owner === post.owner
                );

                const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmountString || '0') : 0;
                const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || '0');
                const diff = postAmount - preAmount;

                if (diff < 0 && (!inputToken || Math.abs(diff) > inputAmount)) {
                    inputToken = {
                        mint: post.mint,
                        symbol: this.getTokenSymbol(post.mint),
                        decimals: post.uiTokenAmount.decimals,
                    };
                    inputAmount = Math.abs(diff);
                }

                if (diff > 0 && (!outputToken || diff > outputAmount)) {
                    outputToken = {
                        mint: post.mint,
                        symbol: this.getTokenSymbol(post.mint),
                        decimals: post.uiTokenAmount.decimals,
                    };
                    outputAmount = diff;
                }
            }

            // Also check for SOL changes
            const preSol = (tx.meta?.preBalances?.[0] || 0) / 1e9;
            const postSol = (tx.meta?.postBalances?.[0] || 0) / 1e9;
            const solDiff = postSol - preSol;

            // Account for transaction fee (roughly 0.000005 SOL)
            if (solDiff < -0.00001 && (!inputToken || Math.abs(solDiff) > inputAmount)) {
                inputToken = {
                    mint: COMMON_TOKENS.SOL,
                    symbol: 'SOL',
                    decimals: 9,
                };
                inputAmount = Math.abs(solDiff);
            }

            if (solDiff > 0.00001 && (!outputToken || solDiff > outputAmount)) {
                outputToken = {
                    mint: COMMON_TOKENS.SOL,
                    symbol: 'SOL',
                    decimals: 9,
                };
                outputAmount = solDiff;
            }

            if (!inputToken || !outputToken) {
                return null;
            }

            // Get USD prices
            const inputPrice = await this.getTokenPrice(inputToken.mint);
            const outputPrice = await this.getTokenPrice(outputToken.mint);

            // Parse route info from logs
            const route = this.parseRouteFromLogs(tx.meta?.logMessages || []);

            return {
                signature,
                timestamp: new Date((tx.blockTime || 0) * 1000),
                walletAddress,
                inputToken,
                outputToken,
                inputAmount,
                outputAmount,
                inputAmountUsd: inputAmount * inputPrice,
                outputAmountUsd: outputAmount * outputPrice,
                route,
                fee: (tx.meta?.fee || 0) / 1e9,
                success: true,
            };
        } catch (error) {
            console.error('Failed to parse swap details:', error);
            return null;
        }
    }

    /**
     * Parse route information from transaction logs
     */
    private parseRouteFromLogs(logs: string[]): ParsedSwapTransaction['route'] {
        const dexes: string[] = [];
        let hops = 1;

        // Known DEX program names
        const dexPatterns = [
            { pattern: /Raydium/i, name: 'Raydium' },
            { pattern: /Orca/i, name: 'Orca' },
            { pattern: /Serum/i, name: 'Serum' },
            { pattern: /Saber/i, name: 'Saber' },
            { pattern: /Mercurial/i, name: 'Mercurial' },
            { pattern: /Lifinity/i, name: 'Lifinity' },
            { pattern: /Marinade/i, name: 'Marinade' },
            { pattern: /Phoenix/i, name: 'Phoenix' },
        ];

        for (const log of logs) {
            for (const { pattern, name } of dexPatterns) {
                if (pattern.test(log) && !dexes.includes(name)) {
                    dexes.push(name);
                }
            }

            // Count swap operations
            if (log.includes('Swap') || log.includes('swap')) {
                hops++;
            }
        }

        // Estimate slippage (would need quote comparison for accuracy)
        const slippage = 0.5; // Default assumption

        return {
            dexes: dexes.length > 0 ? dexes : ['Unknown'],
            hops: Math.max(1, hops - 1),
            slippage,
        };
    }

    /**
     * Get token symbol from mint
     */
    private getTokenSymbol(mint: string): string {
        const knownTokens: Record<string, string> = {
            [COMMON_TOKENS.SOL]: 'SOL',
            [COMMON_TOKENS.USDC]: 'USDC',
            [COMMON_TOKENS.USDT]: 'USDT',
            [COMMON_TOKENS.JUP]: 'JUP',
        };
        return knownTokens[mint] || mint.slice(0, 4) + '...';
    }

    /**
     * Get token price from Jupiter Price API
     */
    async getTokenPrice(mint: string): Promise<number> {
        // Check cache
        const cached = this.priceCache.get(mint);
        if (cached && Date.now() - cached.timestamp < this.priceCacheTTL) {
            return cached.price;
        }

        try {
            const response = await fetch(
                `https://price.jup.ag/v6/price?ids=${mint}`
            );
            const data = await response.json();

            const price = data.data?.[mint]?.price || 0;

            // Cache the price
            this.priceCache.set(mint, { price, timestamp: Date.now() });

            return price;
        } catch (error) {
            console.error('Failed to get token price:', error);
            return 0;
        }
    }

    /**
     * Batch verify multiple transactions
     */
    async verifySwaps(signatures: string[]): Promise<SwapVerificationResult[]> {
        return Promise.all(signatures.map((sig) => this.verifySwap(sig)));
    }

    /**
     * Watch for new swaps from a wallet
     */
    watchSwaps(
        walletAddress: string,
        callback: (swap: ParsedSwapTransaction) => void,
        options: { pollInterval?: number } = {}
    ): () => void {
        const pollInterval = options.pollInterval || 10000; // 10 seconds
        let lastSignature: string | undefined;
        let isRunning = true;

        const poll = async () => {
            if (!isRunning) return;

            try {
                const publicKey = new PublicKey(walletAddress);
                const signatures = await this.connection.getSignaturesForAddress(publicKey, {
                    limit: 5,
                    until: lastSignature,
                });

                for (const sig of signatures.reverse()) {
                    if (sig.signature === lastSignature) continue;

                    const result = await this.verifySwap(sig.signature);
                    if (result.isValid && result.swap) {
                        callback(result.swap);
                    }
                }

                if (signatures.length > 0) {
                    lastSignature = signatures[0].signature;
                }
            } catch (error) {
                console.error('Poll error:', error);
            }

            if (isRunning) {
                setTimeout(poll, pollInterval);
            }
        };

        poll();

        // Return cleanup function
        return () => {
            isRunning = false;
        };
    }
}
