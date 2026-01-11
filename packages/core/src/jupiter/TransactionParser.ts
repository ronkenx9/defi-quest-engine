/**
 * DeFi Quest Engine - Transaction Parser
 * Parses Solana transactions for mission verification
 */

import { Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { ParsedSwapTransaction, TokenInfo, COMMON_TOKENS } from '../missions/MissionTypes';

export interface TransactionFilter {
    startDate?: Date;
    endDate?: Date;
    minAmountUsd?: number;
    tokenMints?: string[];
    onlySwaps?: boolean;
}

export interface TransactionPage {
    transactions: ParsedSwapTransaction[];
    hasMore: boolean;
    lastSignature?: string;
}

export class TransactionParser {
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Get recent transactions for a wallet
     */
    async getRecentTransactions(
        walletAddress: string,
        limit: number = 20,
        before?: string
    ): Promise<TransactionPage> {
        try {
            const publicKey = new PublicKey(walletAddress);

            const signatures = await this.connection.getSignaturesForAddress(publicKey, {
                limit,
                before,
            });

            const transactions: ParsedSwapTransaction[] = [];

            for (const sig of signatures) {
                const tx = await this.connection.getParsedTransaction(sig.signature, {
                    maxSupportedTransactionVersion: 0,
                });

                if (tx) {
                    const parsed = this.parseTransaction(tx, sig.signature, walletAddress);
                    if (parsed) {
                        transactions.push(parsed);
                    }
                }
            }

            return {
                transactions,
                hasMore: signatures.length === limit,
                lastSignature: signatures[signatures.length - 1]?.signature,
            };
        } catch (error) {
            console.error('Failed to get transactions:', error);
            return { transactions: [], hasMore: false };
        }
    }

    /**
     * Get transactions with filters
     */
    async getFilteredTransactions(
        walletAddress: string,
        filter: TransactionFilter,
        limit: number = 50
    ): Promise<ParsedSwapTransaction[]> {
        const allTransactions: ParsedSwapTransaction[] = [];
        let lastSignature: string | undefined;
        let hasMore = true;

        while (hasMore && allTransactions.length < limit) {
            const page = await this.getRecentTransactions(
                walletAddress,
                20,
                lastSignature
            );

            for (const tx of page.transactions) {
                // Apply filters
                if (filter.startDate && tx.timestamp < filter.startDate) {
                    hasMore = false;
                    break;
                }

                if (filter.endDate && tx.timestamp > filter.endDate) {
                    continue;
                }

                if (filter.minAmountUsd) {
                    const maxUsd = Math.max(tx.inputAmountUsd, tx.outputAmountUsd);
                    if (maxUsd < filter.minAmountUsd) {
                        continue;
                    }
                }

                if (filter.tokenMints && filter.tokenMints.length > 0) {
                    const hasToken =
                        filter.tokenMints.includes(tx.inputToken.mint) ||
                        filter.tokenMints.includes(tx.outputToken.mint);
                    if (!hasToken) {
                        continue;
                    }
                }

                allTransactions.push(tx);

                if (allTransactions.length >= limit) {
                    break;
                }
            }

            hasMore = page.hasMore;
            lastSignature = page.lastSignature;
        }

        return allTransactions;
    }

    /**
     * Parse a transaction into our format
     */
    private parseTransaction(
        tx: ParsedTransactionWithMeta,
        signature: string,
        walletAddress: string
    ): ParsedSwapTransaction | null {
        if (!tx.meta || tx.meta.err) {
            return null;
        }

        try {
            const preBalances = tx.meta.preTokenBalances || [];
            const postBalances = tx.meta.postTokenBalances || [];

            // Find tokens that changed
            let inputToken: TokenInfo | null = null;
            let outputToken: TokenInfo | null = null;
            let inputAmount = 0;
            let outputAmount = 0;

            // Check token balance changes
            const balanceChanges = this.calculateBalanceChanges(preBalances, postBalances);

            for (const change of balanceChanges) {
                if (change.delta < 0 && Math.abs(change.delta) > inputAmount) {
                    inputToken = {
                        mint: change.mint,
                        symbol: this.getTokenSymbol(change.mint),
                        decimals: change.decimals,
                    };
                    inputAmount = Math.abs(change.delta);
                }

                if (change.delta > 0 && change.delta > outputAmount) {
                    outputToken = {
                        mint: change.mint,
                        symbol: this.getTokenSymbol(change.mint),
                        decimals: change.decimals,
                    };
                    outputAmount = change.delta;
                }
            }

            // Check SOL balance change
            const solPreBalance = (tx.meta.preBalances[0] || 0) / 1e9;
            const solPostBalance = (tx.meta.postBalances[0] || 0) / 1e9;
            const solDelta = solPostBalance - solPreBalance;
            const fee = (tx.meta.fee || 0) / 1e9;

            // Adjust for fee
            const adjustedSolDelta = solDelta + fee;

            if (adjustedSolDelta < -0.0001) {
                // SOL was sent/swapped
                if (Math.abs(adjustedSolDelta) > inputAmount) {
                    inputToken = {
                        mint: COMMON_TOKENS.SOL,
                        symbol: 'SOL',
                        decimals: 9,
                    };
                    inputAmount = Math.abs(adjustedSolDelta);
                }
            } else if (adjustedSolDelta > 0.0001) {
                // SOL was received
                if (adjustedSolDelta > outputAmount) {
                    outputToken = {
                        mint: COMMON_TOKENS.SOL,
                        symbol: 'SOL',
                        decimals: 9,
                    };
                    outputAmount = adjustedSolDelta;
                }
            }

            // Skip if not a swap (needs both input and output)
            if (!inputToken || !outputToken) {
                return null;
            }

            return {
                signature,
                timestamp: new Date((tx.blockTime || 0) * 1000),
                walletAddress,
                inputToken,
                outputToken,
                inputAmount,
                outputAmount,
                inputAmountUsd: 0, // Would need price lookup
                outputAmountUsd: 0,
                route: {
                    dexes: this.detectDexes(tx),
                    hops: 1,
                    slippage: 0,
                },
                fee,
                success: true,
            };
        } catch (error) {
            console.error('Failed to parse transaction:', error);
            return null;
        }
    }

    /**
     * Calculate balance changes between pre and post
     */
    private calculateBalanceChanges(
        preBalances: any[],
        postBalances: any[]
    ): Array<{ mint: string; delta: number; decimals: number }> {
        const changes: Array<{ mint: string; delta: number; decimals: number }> = [];
        const processedMints = new Set<string>();

        for (const post of postBalances) {
            const pre = preBalances.find(
                (p) => p.mint === post.mint && p.owner === post.owner
            );

            const preAmount = pre
                ? parseFloat(pre.uiTokenAmount?.uiAmountString || '0')
                : 0;
            const postAmount = parseFloat(post.uiTokenAmount?.uiAmountString || '0');
            const delta = postAmount - preAmount;

            if (Math.abs(delta) > 0.000001) {
                changes.push({
                    mint: post.mint,
                    delta,
                    decimals: post.uiTokenAmount?.decimals || 0,
                });
            }

            processedMints.add(`${post.mint}:${post.owner}`);
        }

        // Check for tokens that were fully spent
        for (const pre of preBalances) {
            const key = `${pre.mint}:${pre.owner}`;
            if (!processedMints.has(key)) {
                const preAmount = parseFloat(pre.uiTokenAmount?.uiAmountString || '0');
                if (preAmount > 0.000001) {
                    changes.push({
                        mint: pre.mint,
                        delta: -preAmount,
                        decimals: pre.uiTokenAmount?.decimals || 0,
                    });
                }
            }
        }

        return changes;
    }

    /**
     * Detect DEXes used in transaction
     */
    private detectDexes(tx: ParsedTransactionWithMeta): string[] {
        const logs = tx.meta?.logMessages || [];
        const dexes: string[] = [];

        const dexPatterns: Array<{ pattern: RegExp; name: string }> = [
            { pattern: /Program (675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8|CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C) invoke/i, name: 'Raydium' },
            { pattern: /Program (whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc|9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP) invoke/i, name: 'Orca' },
            { pattern: /Program (PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY) invoke/i, name: 'Phoenix' },
            { pattern: /Program (LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo) invoke/i, name: 'Meteora' },
            { pattern: /Program (SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ) invoke/i, name: 'Saber' },
        ];

        for (const log of logs) {
            for (const { pattern, name } of dexPatterns) {
                if (pattern.test(log) && !dexes.includes(name)) {
                    dexes.push(name);
                }
            }
        }

        return dexes.length > 0 ? dexes : ['Unknown'];
    }

    /**
     * Get token symbol from mint
     */
    private getTokenSymbol(mint: string): string {
        const symbols: Record<string, string> = {
            [COMMON_TOKENS.SOL]: 'SOL',
            [COMMON_TOKENS.USDC]: 'USDC',
            [COMMON_TOKENS.USDT]: 'USDT',
            [COMMON_TOKENS.JUP]: 'JUP',
        };
        return symbols[mint] || mint.slice(0, 4) + '...';
    }

    /**
     * Calculate total volume for a wallet
     */
    async calculateTotalVolume(
        walletAddress: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<number> {
        const transactions = await this.getFilteredTransactions(walletAddress, {
            startDate,
            endDate,
        });

        return transactions.reduce((total, tx) => {
            return total + Math.max(tx.inputAmountUsd, tx.outputAmountUsd);
        }, 0);
    }

    /**
     * Count swaps for a wallet
     */
    async countSwaps(
        walletAddress: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<number> {
        const transactions = await this.getFilteredTransactions(walletAddress, {
            startDate,
            endDate,
            onlySwaps: true,
        });

        return transactions.length;
    }
}
