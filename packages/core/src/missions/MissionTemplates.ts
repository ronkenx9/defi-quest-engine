/**
 * Mission Templates - Pre-built mission configurations
 * Use these as starting points for your quest campaigns
 */

import {
    Mission,
    MissionType,
    MissionStatus,
    Difficulty,
    ResetCycle,
    COMMON_TOKENS,
} from './MissionTypes';

/**
 * Create a simple swap mission
 */
export function createSwapMission(overrides?: Partial<Mission>): Mission {
    return {
        id: `swap-${Date.now()}`,
        name: 'First Swap',
        description: 'Complete your first token swap',
        type: MissionType.SWAP,
        status: MissionStatus.ACTIVE,
        difficulty: Difficulty.EASY,
        requirement: {
            type: 'swap',
            minInputAmount: 1,
        },
        reward: {
            points: 100,
        },
        resetCycle: ResetCycle.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/**
 * Create a volume-based mission
 */
export function createVolumeMission(
    minVolumeUsd: number,
    overrides?: Partial<Mission>
): Mission {
    return {
        id: `volume-${Date.now()}`,
        name: 'Trading Volume',
        description: `Trade at least $${minVolumeUsd} in total volume`,
        type: MissionType.VOLUME,
        status: MissionStatus.ACTIVE,
        difficulty: minVolumeUsd < 100 ? Difficulty.EASY :
            minVolumeUsd < 1000 ? Difficulty.MEDIUM : Difficulty.HARD,
        requirement: {
            type: 'volume',
            minVolumeUsd,
        },
        reward: {
            points: Math.floor(minVolumeUsd / 10),
        },
        resetCycle: ResetCycle.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/**
 * Create a daily streak mission
 */
export function createStreakMission(
    requiredDays: number,
    overrides?: Partial<Mission>
): Mission {
    return {
        id: `streak-${Date.now()}`,
        name: `${requiredDays}-Day Trading Streak`,
        description: `Trade every day for ${requiredDays} consecutive days`,
        type: MissionType.STREAK,
        status: MissionStatus.ACTIVE,
        difficulty: requiredDays <= 3 ? Difficulty.EASY :
            requiredDays <= 7 ? Difficulty.MEDIUM : Difficulty.HARD,
        requirement: {
            type: 'streak',
            requiredDays,
            actionType: 'swap',
            gracePeriodHours: 6,
        },
        reward: {
            points: requiredDays * 50,
            multiplier: 1 + (requiredDays * 0.1),
        },
        resetCycle: ResetCycle.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/**
 * Create a limit order mission (Jupiter Trigger API)
 */
export function createLimitOrderMission(
    minOrders: number = 1,
    overrides?: Partial<Mission>
): Mission {
    return {
        id: `limit-order-${Date.now()}`,
        name: 'Limit Order Pro',
        description: `Create ${minOrders} limit order${minOrders > 1 ? 's' : ''} using Jupiter Trigger`,
        type: MissionType.LIMIT_ORDER,
        status: MissionStatus.ACTIVE,
        difficulty: minOrders <= 2 ? Difficulty.EASY : Difficulty.MEDIUM,
        requirement: {
            type: 'limit_order',
            minOrdersCreated: minOrders,
            minOrderValueUsd: 10,
        },
        reward: {
            points: minOrders * 75,
        },
        resetCycle: ResetCycle.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/**
 * Create a DCA mission (Jupiter Recurring API)
 */
export function createDCAMission(
    minPositions: number = 1,
    overrides?: Partial<Mission>
): Mission {
    return {
        id: `dca-${Date.now()}`,
        name: 'DCA Master',
        description: `Set up ${minPositions} DCA position${minPositions > 1 ? 's' : ''} using Jupiter Recurring`,
        type: MissionType.DCA,
        status: MissionStatus.ACTIVE,
        difficulty: Difficulty.MEDIUM,
        requirement: {
            type: 'dca',
            minPositionsCreated: minPositions,
            minTotalValueUsd: 50,
        },
        reward: {
            points: 200,
        },
        resetCycle: ResetCycle.NONE,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/**
 * Create a JUP token trading mission
 */
export function createJupMission(overrides?: Partial<Mission>): Mission {
    return {
        id: `jup-swap-${Date.now()}`,
        name: 'JUP Believer',
        description: 'Swap to or from JUP token',
        type: MissionType.SWAP,
        status: MissionStatus.ACTIVE,
        difficulty: Difficulty.EASY,
        requirement: {
            type: 'swap',
            outputToken: {
                mint: COMMON_TOKENS.JUP,
                symbol: 'JUP',
                decimals: 6,
            },
        },
        reward: {
            points: 150,
        },
        resetCycle: ResetCycle.DAILY,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        ...overrides,
    };
}

/**
 * Sample campaign with multiple mission types
 */
export const SAMPLE_CAMPAIGN: Mission[] = [
    createSwapMission({
        id: 'onboarding-1',
        name: 'Welcome Swap',
        description: 'Complete your first swap to get started',
        reward: { points: 50 },
    }),
    createVolumeMission(100, {
        id: 'onboarding-2',
        name: 'Volume Starter',
        prerequisites: ['onboarding-1'],
    }),
    createStreakMission(3, {
        id: 'streak-3day',
        name: '3-Day Warrior',
    }),
    createLimitOrderMission(1, {
        id: 'limit-intro',
        name: 'Limit Order Introduction',
    }),
    createDCAMission(1, {
        id: 'dca-intro',
        name: 'DCA Introduction',
    }),
    createJupMission({
        id: 'jup-daily',
        name: 'Daily JUP',
        resetCycle: ResetCycle.DAILY,
    }),
];
