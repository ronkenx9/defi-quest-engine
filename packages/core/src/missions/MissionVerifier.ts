/**
 * DeFi Quest Engine - Mission Verifier
 * Validates transactions against mission requirements
 */

import {
    Mission,
    MissionProgress,
    MissionType,
    ParsedSwapTransaction,
    VerificationResult,
    SwapRequirement,
    VolumeRequirement,
    StreakRequirement,
    PriceRequirement,
    RoutingRequirement,
} from './MissionTypes';

export class MissionVerifier {
    /**
     * Verify a transaction against a mission's requirements
     */
    verify(
        mission: Mission,
        progress: MissionProgress,
        transaction: ParsedSwapTransaction
    ): VerificationResult {
        const baseResult: VerificationResult = {
            success: false,
            missionId: mission.id,
            transactionSignature: transaction.signature,
            timestamp: new Date(),
        };

        if (!transaction.success) {
            return { ...baseResult, error: 'Transaction failed' };
        }

        try {
            switch (mission.type) {
                case MissionType.SWAP:
                    return this.verifySwap(mission, transaction, baseResult);
                case MissionType.VOLUME:
                    return this.verifyVolume(mission, transaction, baseResult);
                case MissionType.STREAK:
                    return this.verifyStreak(mission, progress, transaction, baseResult);
                case MissionType.PRICE:
                    return this.verifyPrice(mission, transaction, baseResult);
                case MissionType.ROUTING:
                    return this.verifyRouting(mission, transaction, baseResult);
                default:
                    return { ...baseResult, error: 'Unknown mission type' };
            }
        } catch (error) {
            return {
                ...baseResult,
                error: error instanceof Error ? error.message : 'Verification failed',
            };
        }
    }

    /**
     * Verify swap mission requirements
     */
    private verifySwap(
        mission: Mission,
        tx: ParsedSwapTransaction,
        result: VerificationResult
    ): VerificationResult {
        const req = mission.requirement as SwapRequirement;

        // Check input token
        if (req.inputToken && req.inputToken.mint !== tx.inputToken.mint) {
            return { ...result, error: 'Input token mismatch' };
        }

        // Check output token
        if (req.outputToken && req.outputToken.mint !== tx.outputToken.mint) {
            return { ...result, error: 'Output token mismatch' };
        }

        // Check exact match requirement
        if (req.exactMatch) {
            if (req.inputToken && req.inputToken.mint !== tx.inputToken.mint) {
                return { ...result, error: 'Exact input token required' };
            }
            if (req.outputToken && req.outputToken.mint !== tx.outputToken.mint) {
                return { ...result, error: 'Exact output token required' };
            }
        }

        // Check minimum amounts
        if (req.minInputAmount && tx.inputAmount < req.minInputAmount) {
            return { ...result, error: `Minimum input amount is ${req.minInputAmount}` };
        }

        if (req.minOutputAmount && tx.outputAmount < req.minOutputAmount) {
            return { ...result, error: `Minimum output amount is ${req.minOutputAmount}` };
        }

        return {
            ...result,
            success: true,
            progressDelta: tx.inputAmount, // Progress by input amount
        };
    }

    /**
     * Verify volume mission requirements
     */
    private verifyVolume(
        mission: Mission,
        tx: ParsedSwapTransaction,
        result: VerificationResult
    ): VerificationResult {
        const req = mission.requirement as VolumeRequirement;

        // Check token filter if specified
        if (req.tokenFilter && req.tokenFilter.length > 0) {
            const tokenInFilter =
                req.tokenFilter.includes(tx.inputToken.mint) ||
                req.tokenFilter.includes(tx.outputToken.mint);

            if (!tokenInFilter) {
                return { ...result, error: 'Token not in allowed filter' };
            }
        }

        // Volume in USD
        const volumeUsd = Math.max(tx.inputAmountUsd, tx.outputAmountUsd);

        return {
            ...result,
            success: true,
            progressDelta: volumeUsd,
        };
    }

    /**
     * Verify streak mission requirements
     */
    private verifyStreak(
        mission: Mission,
        progress: MissionProgress,
        tx: ParsedSwapTransaction,
        result: VerificationResult
    ): VerificationResult {
        const req = mission.requirement as StreakRequirement;

        // Check minimum value if required
        if (req.minActionValue) {
            const valueUsd = Math.max(tx.inputAmountUsd, tx.outputAmountUsd);
            if (valueUsd < req.minActionValue) {
                return { ...result, error: `Minimum action value is $${req.minActionValue}` };
            }
        }

        // Check if this counts towards streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastActivity = progress.lastActivityDate
            ? new Date(progress.lastActivityDate)
            : null;

        if (lastActivity) {
            lastActivity.setHours(0, 0, 0, 0);

            const daysDiff = Math.floor(
                (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysDiff === 0) {
                // Same day, no streak progress
                return { ...result, success: true, progressDelta: 0 };
            } else if (daysDiff === 1) {
                // Consecutive day, increment streak
                return { ...result, success: true, progressDelta: 1 };
            } else {
                // Streak broken (unless within grace period)
                const gracePeriodHours = req.gracePeriodHours || 0;
                const hoursDiff =
                    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

                if (hoursDiff <= 24 + gracePeriodHours) {
                    return { ...result, success: true, progressDelta: 1 };
                } else {
                    // Streak broken, reset to 1
                    return { ...result, success: true, progressDelta: -progress.currentValue + 1 };
                }
            }
        }

        // First activity, start streak
        return { ...result, success: true, progressDelta: 1 };
    }

    /**
     * Verify price-based mission requirements
     */
    private verifyPrice(
        mission: Mission,
        tx: ParsedSwapTransaction,
        result: VerificationResult
    ): VerificationResult {
        const req = mission.requirement as PriceRequirement;

        // Check if the right action was taken
        const isBuy = tx.outputToken.mint === req.token.mint;
        const isSell = tx.inputToken.mint === req.token.mint;

        if (req.action === 'buy' && !isBuy) {
            return { ...result, error: 'Must buy the specified token' };
        }

        if (req.action === 'sell' && !isSell) {
            return { ...result, error: 'Must sell the specified token' };
        }

        // Calculate effective price
        const amount = isBuy ? tx.outputAmount : tx.inputAmount;
        const amountUsd = isBuy ? tx.outputAmountUsd : tx.inputAmountUsd;
        const effectivePrice = amountUsd / amount;

        // Check price condition
        if (req.condition === 'above' && effectivePrice <= req.targetPrice) {
            return { ...result, error: `Price must be above $${req.targetPrice}` };
        }

        if (req.condition === 'below' && effectivePrice >= req.targetPrice) {
            return { ...result, error: `Price must be below $${req.targetPrice}` };
        }

        // Check minimum amount
        if (req.minAmount && amount < req.minAmount) {
            return { ...result, error: `Minimum amount is ${req.minAmount}` };
        }

        return {
            ...result,
            success: true,
            progressDelta: amount,
        };
    }

    /**
     * Verify routing mission requirements
     */
    private verifyRouting(
        mission: Mission,
        tx: ParsedSwapTransaction,
        result: VerificationResult
    ): VerificationResult {
        const req = mission.requirement as RoutingRequirement;

        // Check route type
        if (req.routeType === 'direct' && tx.route.hops > 1) {
            return { ...result, error: 'Must use direct route' };
        }

        if (req.routeType === 'multi-hop' && tx.route.hops < 2) {
            return { ...result, error: 'Must use multi-hop route' };
        }

        // Check minimum hops
        if (req.minHops && tx.route.hops < req.minHops) {
            return { ...result, error: `Minimum ${req.minHops} hops required` };
        }

        // Check slippage
        if (req.maxSlippage && tx.route.slippage > req.maxSlippage) {
            return { ...result, error: `Slippage exceeds ${req.maxSlippage}%` };
        }

        // Check required DEXes
        if (req.usedDexes && req.usedDexes.length > 0) {
            const usedDexSet = new Set(tx.route.dexes.map((d) => d.toLowerCase()));
            for (const requiredDex of req.usedDexes) {
                if (!usedDexSet.has(requiredDex.toLowerCase())) {
                    return { ...result, error: `Must use ${requiredDex}` };
                }
            }
        }

        return {
            ...result,
            success: true,
            progressDelta: 1, // Binary completion
        };
    }
}
