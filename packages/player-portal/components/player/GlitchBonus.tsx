'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Sparkles, Star } from 'lucide-react';

interface GlitchBonusConfig {
    /** Base XP reward */
    baseXP: number;
    /** Minimum variance multiplier (e.g., 0.8 = 80% of base) */
    minMultiplier?: number;
    /** Maximum variance multiplier (e.g., 1.5 = 150% of base) */
    maxMultiplier?: number;
    /** Chance of glitch bonus (0-1, e.g., 0.05 = 5%) */
    glitchChance?: number;
    /** Glitch bonus multiplier */
    glitchMultiplier?: number;
    /** Chance of critical hit (0-1) */
    criticalChance?: number;
    /** Critical hit multiplier */
    criticalMultiplier?: number;
    /** Chance of legendary drop (0-1, e.g., 0.01 = 1%) */
    legendaryChance?: number;
}

interface RewardResult {
    finalXP: number;
    isGlitch: boolean;
    isCritical: boolean;
    isLegendary: boolean;
    multiplier: number;
    bonusType: 'normal' | 'glitch' | 'critical' | 'legendary';
}

/**
 * Calculate XP with random variance and bonus chances
 */
export function calculateReward(config: GlitchBonusConfig): RewardResult {
    const {
        baseXP,
        minMultiplier = 0.9,
        maxMultiplier = 1.2,
        glitchChance = 0.05,
        glitchMultiplier = 3,
        criticalChance = 0.02,
        criticalMultiplier = 5,
        legendaryChance = 0.005,
    } = config;

    // Roll for special bonuses
    const roll = Math.random();

    let isLegendary = false;
    let isCritical = false;
    let isGlitch = false;
    let multiplier = 1;
    let bonusType: RewardResult['bonusType'] = 'normal';

    if (roll < legendaryChance) {
        // Legendary drop!
        isLegendary = true;
        multiplier = 10;
        bonusType = 'legendary';
    } else if (roll < legendaryChance + criticalChance) {
        // Critical hit!
        isCritical = true;
        multiplier = criticalMultiplier;
        bonusType = 'critical';
    } else if (roll < legendaryChance + criticalChance + glitchChance) {
        // Glitch bonus!
        isGlitch = true;
        multiplier = glitchMultiplier;
        bonusType = 'glitch';
    } else {
        // Normal with variance
        multiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
    }

    const finalXP = Math.round(baseXP * multiplier);

    return {
        finalXP,
        isGlitch,
        isCritical,
        isLegendary,
        multiplier,
        bonusType,
    };
}

interface GlitchEffectProps {
    show: boolean;
    type: 'glitch' | 'critical' | 'legendary';
    xp: number;
    onComplete?: () => void;
}

/**
 * Visual effect overlay for glitch/critical/legendary bonuses
 */
export function GlitchEffect({ show, type, xp, onComplete }: GlitchEffectProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            // Auto-dismiss after animation
            const timer = setTimeout(() => {
                setVisible(false);
                onComplete?.();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    if (!visible) return null;

    const config = {
        glitch: {
            color: '#4ade80',
            bg: 'rgba(74, 222, 128, 0.1)',
            border: 'rgba(74, 222, 128, 0.5)',
            icon: <Zap className="w-8 h-8" />,
            title: 'GLITCH BONUS!',
            sound: 'glitch',
        },
        critical: {
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.1)',
            border: 'rgba(245, 158, 11, 0.5)',
            icon: <Sparkles className="w-8 h-8" />,
            title: 'CRITICAL HIT!',
            sound: 'critical',
        },
        legendary: {
            color: '#f43f5e',
            bg: 'rgba(244, 63, 94, 0.1)',
            border: 'rgba(244, 63, 94, 0.5)',
            icon: <Star className="w-8 h-8" />,
            title: '✨ LEGENDARY DROP ✨',
            sound: 'legendary',
        },
    }[type];

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
            style={{ animation: 'glitchFadeIn 0.3s ease-out' }}
        >
            {/* Screen flash effect */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(circle at center, ${config.bg}, transparent 70%)`,
                    animation: 'glitchPulse 0.5s ease-out',
                }}
            />

            {/* Scanlines overlay */}
            <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                    animation: 'scanlines 0.1s linear infinite',
                }}
            />

            {/* Main notification */}
            <div
                className="relative flex flex-col items-center gap-4 p-8 rounded-2xl"
                style={{
                    background: config.bg,
                    border: `2px solid ${config.border}`,
                    boxShadow: `0 0 60px ${config.color}40, 0 0 100px ${config.color}20`,
                    animation: 'glitchBounce 0.5s ease-out',
                }}
            >
                {/* Icon */}
                <div
                    className="animate-pulse"
                    style={{ color: config.color }}
                >
                    {config.icon}
                </div>

                {/* Title */}
                <h2
                    className="font-mono font-bold text-2xl tracking-wider"
                    style={{
                        color: config.color,
                        textShadow: `0 0 20px ${config.color}`,
                        animation: 'glitchText 0.3s ease-out',
                    }}
                >
                    {config.title}
                </h2>

                {/* XP amount */}
                <div
                    className="font-mono text-4xl font-black"
                    style={{
                        color: '#fff',
                        textShadow: `0 0 30px ${config.color}`,
                    }}
                >
                    +{xp} XP
                </div>

                {/* Subtitle */}
                <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                    {type === 'legendary' ? 'You are The One' :
                        type === 'critical' ? 'Maximum Damage!' :
                            'System Anomaly Detected'}
                </p>
            </div>

            <style jsx>{`
                @keyframes glitchFadeIn {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }

                @keyframes glitchPulse {
                    0% { opacity: 0; transform: scale(0.5); }
                    50% { opacity: 1; transform: scale(1.2); }
                    100% { opacity: 0.5; transform: scale(1); }
                }

                @keyframes glitchBounce {
                    0% { transform: scale(0.3) rotate(-5deg); opacity: 0; }
                    50% { transform: scale(1.1) rotate(2deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                @keyframes glitchText {
                    0% { transform: translateX(-5px); }
                    25% { transform: translateX(5px); }
                    50% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                    100% { transform: translateX(0); }
                }

                @keyframes scanlines {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 4px; }
                }
            `}</style>
        </div>
    );
}

interface JupiterMobileBonusProps {
    isJupiterMobile: boolean;
    baseXP: number;
}

/**
 * Display Jupiter Mobile bonus indicator
 */
export function JupiterMobileBonus({ isJupiterMobile, baseXP }: JupiterMobileBonusProps) {
    if (!isJupiterMobile) return null;

    const bonusXP = Math.round(baseXP * 0.1); // 10% bonus

    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
                <path d="M12 18h.01"></path>
            </svg>
            <span className="font-mono text-xs font-bold text-green-400">
                Jupiter Mobile: +{bonusXP} XP
            </span>
            <span className="text-[10px] text-green-500/70 uppercase tracking-wider">
                (10% Bonus)
            </span>
        </div>
    );
}

export default GlitchEffect;
