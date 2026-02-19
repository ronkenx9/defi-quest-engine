
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface BadgeProps {
    id: string;
    name: string;
    rarity: BadgeRarity;
    xp: number;
    level: number;
    image?: string;
    isSelected?: boolean;
    onSelect?: () => void;
    isSelectable?: boolean;
}

// Matrix / Green Theme Styles
const RARITY_STYLES = {
    common: {
        border: 'border-green-900/50',
        bg: 'bg-black/80',
        glow: 'shadow-green-900/10',
        text: 'text-green-700',
        icon: 'text-green-800',
        ring: 'ring-green-800'
    },
    rare: {
        border: 'border-green-600/50',
        bg: 'bg-green-950/20',
        glow: 'shadow-green-500/20',
        text: 'text-green-500',
        icon: 'text-green-500',
        ring: 'ring-green-500'
    },
    epic: {
        border: 'border-emerald-400/60',
        bg: 'bg-emerald-950/30',
        glow: 'shadow-emerald-400/30',
        text: 'text-emerald-400',
        icon: 'text-emerald-400',
        ring: 'ring-emerald-400'
    },
    legendary: {
        border: 'border-white/80',
        bg: 'bg-green-900/40',
        glow: 'shadow-white/40',
        text: 'text-white',
        icon: 'text-green-300',
        ring: 'ring-white'
    },
};

export function BadgeCard({
    id,
    name,
    rarity,
    xp,
    level,
    isSelected,
    onSelect,
    isSelectable = false
}: BadgeProps) {
    const styles = RARITY_STYLES[rarity];

    return (
        <motion.div
            layoutId={id}
            whileHover={{ scale: 1.02, y: -2, boxShadow: "0px 0px 20px rgba(34, 197, 94, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={isSelectable && onSelect ? onSelect : undefined}
            className={cn(
                "relative group cursor-pointer overflow-hidden rounded border transition-all duration-300 backdrop-blur-sm",
                styles.bg,
                isSelected
                    ? `border-green-400 ring-1 ring-green-400/50 z-10 shadow-[0_0_15px_rgba(74,222,128,0.3)]`
                    : styles.border,
                isSelectable ? "hover:border-green-400/80" : ""
            )}
        >
            {/* Matrix Scanline Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none opacity-10" />

            {/* Ambient Glow */}
            <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                "bg-gradient-to-t from-green-500/10 via-transparent to-transparent",
                styles.glow
            )} />

            {/* Content */}
            <div className="p-4 flex flex-col items-center justify-center relative z-10 h-full min-h-[160px]">
                {/* Icon Container */}
                <div className={cn(
                    "mb-3 p-3 rounded bg-black/80 border border-green-500/20 relative shadow-lg transform group-hover:scale-105 transition-transform duration-300",
                    isSelected && "bg-green-950/50 border-green-400/50"
                )}>
                    {rarity === 'common' ? (
                        <Terminal className={cn("h-8 w-8", styles.icon)} />
                    ) : (
                        <Shield className={cn("h-8 w-8", styles.icon)} />
                    )}

                    {/* Legendary Sparkles */}
                    {rarity === 'legendary' && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1"
                        >
                            <Sparkles className="h-4 w-4 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                        </motion.div>
                    )}
                </div>

                {/* Text Info */}
                <h3 className="font-bold text-white text-center mb-1 text-sm tracking-wide font-display">{name}</h3>
                <div className={cn("text-[10px] uppercase tracking-[0.2em] font-mono font-bold mb-3 opacity-90", styles.text)}>
                    {rarity}
                </div>

                {/* Stats Pill - Matrix Style */}
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-400 w-full justify-center bg-black/80 border border-green-900/60 py-1.5 px-3 rounded mt-auto font-mono">
                    <span className="text-green-400">XP_{xp}</span>
                    <span className="w-px h-3 bg-green-900" />
                    <span className="flex items-center text-green-600">
                        V{level}.0
                    </span>
                </div>
            </div>

            {/* Selection Checkbox */}
            {isSelectable && (
                <div className={cn(
                    "absolute top-2 right-2 w-4 h-4 border border-green-500/50 flex items-center justify-center transition-all",
                    isSelected ? "bg-green-500 border-green-400 shadow-green-glow" : "bg-black/50 hover:border-green-400"
                )}>
                    {isSelected && <div className="w-2 h-2 bg-black" />}
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// Grid Component
// ============================================================================

interface BadgeGridProps {
    badges: BadgeProps[];
    selectedIds?: string[];
    onToggleSelect?: (id: string) => void;
    selectionMode?: boolean;
}

export function BadgeGrid({
    badges,
    selectedIds = [],
    onToggleSelect,
    selectionMode = false
}: BadgeGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {badges.map((badge) => (
                <BadgeCard
                    key={badge.id}
                    {...badge}
                    isSelected={selectedIds.includes(badge.id)}
                    onSelect={() => onToggleSelect?.(badge.id)}
                    isSelectable={selectionMode}
                />
            ))}
        </div>
    );
}
