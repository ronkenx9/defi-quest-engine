'use client';
import React, { useState, useEffect } from 'react';

interface StatsCardProps {
    icon: string;
    label: string;
    value: string;
    change?: string;
    positive?: boolean;
}

// Animated counter hook - optimized for performance
function useAnimatedCounter(endValue: number, duration: number = 800) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * endValue));

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate);
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [endValue, duration]);

    return count;
}

// Parse value string to extract number for animation
function parseValue(value: string): { prefix: string; number: number; suffix: string } {
    const match = value.match(/^([^\d]*)(\d+(?:,\d+)*(?:\.\d+)?)(.*)$/);
    if (match) {
        return {
            prefix: match[1],
            number: parseFloat(match[2].replace(/,/g, '')),
            suffix: match[3]
        };
    }
    return { prefix: '', number: 0, suffix: value };
}

// Format number with commas
function formatNumber(num: number, hasDecimal: boolean = false): string {
    if (hasDecimal) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }
    return num.toLocaleString('en-US');
}

export function StatsCard({ icon, label, value, change, positive }: StatsCardProps) {
    const parsed = parseValue(value);
    const hasDecimal = value.includes('.');
    const animatedValue = useAnimatedCounter(parsed.number, 600);

    return (
        <div className="card group hover:scale-[1.025] transition-all duration-400 ease-out">
            <div className="flex justify-between items-start mb-5">
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-surface-1 to-surface-2 group-hover:from-primary/15 group-hover:to-primary/5 transition-all duration-300 border border-white/[0.05] group-hover:border-primary/25 shadow-inner-glow">
                    <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(199,242,132,0.3)] group-hover:drop-shadow-[0_0_12px_rgba(199,242,132,0.5)] transition-all">{icon}</span>
                </div>
                {change && (
                    <div className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-display transition-all duration-300
                        ${positive
                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-glow-sm group-hover:shadow-glow'
                            : 'bg-error/10 text-error border border-error/20 group-hover:bg-error/15'}
                    `}>
                        <span className="text-[10px]">{positive ? '▲' : '▼'}</span> {change}
                    </div>
                )}
            </div>

            <div className="space-y-1.5">
                <h3 className="text-gray-500 text-xs font-medium tracking-wider uppercase">{label}</h3>
                <div className="text-3xl font-bold font-display text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-glow-gradient transition-all duration-300">
                    {parsed.prefix}{formatNumber(animatedValue, hasDecimal)}{parsed.suffix}
                </div>
            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-0.5 bg-glow-gradient rounded-2xl opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500 blur-xl -z-10"></div>
        </div>
    );
}
