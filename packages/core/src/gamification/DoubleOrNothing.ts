/**
 * DeFi Quest Engine - Double or Nothing
 * 
 * After completing any mission, players can risk their XP for a chance to double it.
 * Can chain up to 3x (2x, 4x, 8x multiplier)
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';

export const MAX_DOUBLE_CHAIN = 3;
export const WIN_CHANCE = 50; // 50% chance to win each round

export interface DoubleOrNothingResult {
    accepted: boolean;
    chainLevel: number;
    result?: 'won' | 'lost' | 'pending';
    initialXP: number;
    finalXP: number;
    wonRounds: number[];
}

export interface PlayerGambleStats {
    biggestWin: number;
    biggestLoss: number;
    totalWins: number;
    totalLosses: number;
    currentStreak: number;
}

/**
 * DoubleOrNothing Game
 * 
 * Players can gamble their earned XP for a chance to multiply it.
 * Each round has 50% chance to win.
 * Can continue up to 3 times (2x, 4x, 8x total).
 */
export class DoubleOrNothing {
    private umi: any;
    private connection: Connection;
    private rpcEndpoint: string;

    constructor(rpcEndpoint: string) {
        this.rpcEndpoint = rpcEndpoint;
        this.connection = new Connection(rpcEndpoint);
        this.umi = createUmi(rpcEndpoint);
    }

    /**
     * Simulate a double or nothing round (for demo/frontend)
     * In production, this would use Switchboard VRF for on-chain randomness
     */
    async simulateRound(seed?: number): Promise<boolean> {
        // Simple random for now - would use VRF in production
        const roll = seed || Math.floor(Math.random() * 100);
        return roll < WIN_CHANCE;
    }

    /**
     * Offer double or nothing to player
     * Returns the result after player decides
     */
    async offerDoubleOrNothing(
        playerWallet: string,
        xpEarned: number,
        currentChain: number = 0
    ): Promise<DoubleOrNothingResult> {
        const result: DoubleOrNothingResult = {
            accepted: false,
            chainLevel: currentChain,
            result: 'pending',
            initialXP: xpEarned,
            finalXP: xpEarned,
            wonRounds: [],
        };

        // Max 3 chains
        if (currentChain >= MAX_DOUBLE_CHAIN) {
            console.log('[DoubleOrNothing] Max chain reached, settling');
            return result;
        }

        // Player accepts - simulate the gamble
        const won = await this.simulateRound();
        
        if (won) {
            // Won this round! Double the XP
            result.accepted = true;
            result.wonRounds.push(currentChain);
            result.finalXP = xpEarned * Math.pow(2, currentChain + 1);
            
            console.log('[DoubleOrNothing] Won round ' + currentChain + '! XP: ' + result.finalXP);
            
            // Auto-continue to next round or settle
            if (currentChain < MAX_DOUBLE_CHAIN - 1) {
                // Continue to next round
                const nextResult = await this.offerDoubleOrNothing(
                    playerWallet,
                    xpEarned,
                    currentChain + 1
                );
                
                // Merge results
                result.wonRounds = result.wonRounds.concat(nextResult.wonRounds);
                result.finalXP = nextResult.finalXP;
                result.result = nextResult.result;
            } else {
                // Max chain reached - player won all!
                result.result = 'won';
                console.log('[DoubleOrNothing] Player won all ' + MAX_DOUBLE_CHAIN + ' rounds! Total XP: ' + result.finalXP);
            }
        } else {
            // Lost! All XP gone
            result.accepted = true;
            result.result = 'lost';
            result.finalXP = 0;
            
            console.log('[DoubleOrNothing] Lost round ' + currentChain + '! All XP lost.');
        }

        return result;
    }

    /**
     * Calculate potential outcomes for UI display
     */
    calculateOdds(currentXP: number, chainLevel: number) {
        const multiplier = Math.pow(2, chainLevel + 1);
        const potentialWin = currentXP * multiplier;
        
        // Calculate probability of reaching each level
        const probabilities = [];
        for (let i = chainLevel; i < MAX_DOUBLE_CHAIN; i++) {
            const roundsNeeded = i - chainLevel + 1;
            const prob = Math.pow(WIN_CHANCE / 100, roundsNeeded) * 100;
            probabilities.push({
                chainLevel: i,
                multiplier: Math.pow(2, i + 1),
                probability: prob.toFixed(1) + '%',
                potentialXP: currentXP * Math.pow(2, i + 1),
            });
        }

        return {
            currentXP,
            nextWin: currentXP * 2,
            maxWin: currentXP * Math.pow(2, MAX_DOUBLE_CHAIN),
            winChance: WIN_CHANCE + '%',
            probabilities,
        };
    }
}

/**
 * Factory function
 */
export function createDoubleOrNothing(rpcUrl: string): DoubleOrNothing {
    return new DoubleOrNothing(rpcUrl);
}

export default DoubleOrNothing;
