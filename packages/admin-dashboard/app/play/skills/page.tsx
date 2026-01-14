'use client';

import { useState, useEffect, useCallback } from 'react';
import { Crosshair, Flame, Compass, Eye } from 'lucide-react';
import Image from 'next/image';
import PlayerNavbar from '@/components/player/PlayerNavbar';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/lib/supabase';

interface SkillProgress {
    skill_type: string;
    xp: number;
    level: number;
}

// Individual skill icons mapping
const iconPaths = {
    // Swapper icons
    sw1: '/skills/sw1_initiate_1768354703178.png',
    sw2: '/skills/sw2_quickhands_1768354717321.png',
    sw3: '/skills/sw3_trader_1768354732576.png',
    sw4: '/skills/sw4_speeddemon_1768354747119.png',
    sw5: '/skills/sw5_swapmaster_1768354763135.png',
    // Holder icons
    ho1: '/skills/ho1_hodler_1768354797719.png',
    ho2: '/skills/ho2_diamondhands_1768354812401.png',
    ho3: '/skills/ho3_longterm_1768354827968.png',
    ho4: '/skills/ho4_stalwart_1768354842798.png',
    ho5: '/skills/ho5_immovable_1768354858900.png',
    // Explorer icons
    ex1: '/skills/ex1_curious_1768354894738.png',
    ex2: '/skills/ex2_adventurer_1768354911143.png',
    ex3: '/skills/ex3_pathfinder_1768354927420.png',
    ex4: '/skills/ex4_pioneer_1768354941901.png',
    ex5: '/skills/ex5_discoverer_1768354960263.png',
    // Oracle icons (using 2 generated + reusing for remaining)
    or1: '/skills/or1_seer_1768354998045.png',
    or2: '/skills/or2_foresight_1768355011662.png',
    or3: '/skills/or1_seer_1768354998045.png', // Fallback
    or4: '/skills/or2_foresight_1768355011662.png', // Fallback
    or5: '/skills/or2_foresight_1768355011662.png', // Fallback - will use legendary styling
};

// Skill node configuration for the tree
const skillNodes = {
    swapper: {
        name: 'Swapper',
        icon: Crosshair,
        color: '#4ade80',
        nodes: [
            { id: 'sw1', name: 'Initiate', level: 1, x: 0, y: 0 },
            { id: 'sw2', name: 'Quick Hands', level: 3, x: -1, y: 1, bonus: '+5% XP' },
            { id: 'sw3', name: 'Trader', level: 5, x: 1, y: 1, bonus: '+10% XP' },
            { id: 'sw4', name: 'Speed Demon', level: 7, x: 0, y: 2, bonus: '+15% XP' },
            { id: 'sw5', name: 'Swap Master', level: 10, x: 0, y: 3, bonus: '+25% XP', legendary: true },
        ],
        connections: [['sw1', 'sw2'], ['sw1', 'sw3'], ['sw2', 'sw4'], ['sw3', 'sw4'], ['sw4', 'sw5']]
    },
    holder: {
        name: 'Holder',
        icon: Flame,
        color: '#f97316',
        nodes: [
            { id: 'ho1', name: 'Hodler', level: 1, x: 0, y: 0 },
            { id: 'ho2', name: 'Diamond Hands', level: 3, x: -1, y: 1, bonus: '+5% XP' },
            { id: 'ho3', name: 'Long Term', level: 5, x: 1, y: 1, bonus: '+10% XP' },
            { id: 'ho4', name: 'Stalwart', level: 7, x: 0, y: 2, bonus: '+15% XP' },
            { id: 'ho5', name: 'Immovable', level: 10, x: 0, y: 3, bonus: '+25% XP', legendary: true },
        ],
        connections: [['ho1', 'ho2'], ['ho1', 'ho3'], ['ho2', 'ho4'], ['ho3', 'ho4'], ['ho4', 'ho5']]
    },
    explorer: {
        name: 'Explorer',
        icon: Compass,
        color: '#3b82f6',
        nodes: [
            { id: 'ex1', name: 'Curious', level: 1, x: 0, y: 0 },
            { id: 'ex2', name: 'Adventurer', level: 3, x: -1, y: 1, bonus: '+5% XP' },
            { id: 'ex3', name: 'Pathfinder', level: 5, x: 1, y: 1, bonus: '+10% XP' },
            { id: 'ex4', name: 'Pioneer', level: 7, x: 0, y: 2, bonus: '+15% XP' },
            { id: 'ex5', name: 'Discoverer', level: 10, x: 0, y: 3, bonus: '+25% XP', legendary: true },
        ],
        connections: [['ex1', 'ex2'], ['ex1', 'ex3'], ['ex2', 'ex4'], ['ex3', 'ex4'], ['ex4', 'ex5']]
    },
    oracle: {
        name: 'Oracle',
        icon: Eye,
        color: '#a855f7',
        nodes: [
            { id: 'or1', name: 'Seer', level: 1, x: 0, y: 0 },
            { id: 'or2', name: 'Foresight', level: 3, x: -1, y: 1, bonus: '+0.1x' },
            { id: 'or3', name: 'Visionary', level: 5, x: 1, y: 1, bonus: '+0.2x' },
            { id: 'or4', name: 'Prophet', level: 7, x: 0, y: 2, bonus: '+0.3x' },
            { id: 'or5', name: 'Oracle', level: 10, x: 0, y: 3, bonus: '+0.5x', legendary: true },
        ],
        connections: [['or1', 'or2'], ['or1', 'or3'], ['or2', 'or4'], ['or3', 'or4'], ['or4', 'or5']]
    },
};

interface SkillTreeBranchProps {
    skillKey: keyof typeof skillNodes;
    userLevel: number;
    color: string;
}

function SkillTreeBranch({ skillKey, userLevel, color }: SkillTreeBranchProps) {
    const skill = skillNodes[skillKey];
    const Icon = skill.icon;

    const nodeSize = 72;
    const spacingX = 90;
    const spacingY = 95;
    const centerX = 130;
    const startY = 55;

    const getNodePosition = (node: { x: number; y: number }) => ({
        left: centerX + node.x * spacingX,
        top: startY + node.y * spacingY,
    });

    const findNode = (id: string) => skill.nodes.find(n => n.id === id);

    return (
        <div className="relative" style={{ width: '310px', height: '480px' }}>
            {/* Branch Header */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 flex items-center gap-2 whitespace-nowrap">
                <Icon className="w-5 h-5" style={{ color }} />
                <span className="font-bold text-white text-lg">{skill.name}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: color + '20', color }}>
                    Lv.{userLevel}
                </span>
            </div>

            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {skill.connections.map(([from, to], idx) => {
                    const fromNode = findNode(from);
                    const toNode = findNode(to);
                    if (!fromNode || !toNode) return null;

                    const fromPos = getNodePosition(fromNode);
                    const toPos = getNodePosition(toNode);

                    const fromUnlocked = userLevel >= fromNode.level;
                    const toUnlocked = userLevel >= toNode.level;
                    const lineActive = fromUnlocked && toUnlocked;

                    return (
                        <line
                            key={idx}
                            x1={fromPos.left + nodeSize / 2}
                            y1={fromPos.top + nodeSize / 2}
                            x2={toPos.left + nodeSize / 2}
                            y2={toPos.top + nodeSize / 2}
                            stroke={lineActive ? color : '#374151'}
                            strokeWidth={lineActive ? 3 : 2}
                            strokeDasharray={lineActive ? '0' : '6'}
                            style={{
                                filter: lineActive ? `drop-shadow(0 0 8px ${color})` : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />
                    );
                })}
            </svg>

            {/* Nodes */}
            {skill.nodes.map((node) => {
                const pos = getNodePosition(node);
                const unlocked = userLevel >= node.level;
                const isLegendary = 'legendary' in node && node.legendary;
                const iconPath = iconPaths[node.id as keyof typeof iconPaths];

                return (
                    <div
                        key={node.id}
                        className="absolute group cursor-pointer"
                        style={{
                            left: pos.left,
                            top: pos.top,
                            width: nodeSize,
                            height: nodeSize,
                            zIndex: 10,
                        }}
                    >
                        {/* Node circle with icon image */}
                        <div
                            className={`w-full h-full rounded-full overflow-hidden transition-all duration-300 relative ${isLegendary && unlocked ? 'animate-pulse' : ''
                                }`}
                            style={{
                                border: `3px solid ${unlocked ? color : '#4b5563'}`,
                                background: '#0a0f0a',
                                boxShadow: unlocked
                                    ? `0 0 25px ${color}60, 0 0 50px ${color}30`
                                    : 'none',
                            }}
                        >
                            {/* Icon image - properly scaled */}
                            <Image
                                src={iconPath}
                                alt={node.name}
                                fill
                                className={`object-cover transition-all duration-300 ${unlocked
                                        ? ''
                                        : 'grayscale brightness-[0.3] opacity-60'
                                    }`}
                                sizes="72px"
                            />

                            {/* Outline overlay for locked skills */}
                            {!unlocked && (
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        border: `2px dashed ${color}40`,
                                        background: 'transparent',
                                    }}
                                />
                            )}
                        </div>

                        {/* Level indicator */}
                        <div
                            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center border-2"
                            style={{
                                background: unlocked ? color : '#1f2937',
                                borderColor: unlocked ? color : '#4b5563',
                                color: unlocked ? '#000' : '#9ca3af',
                            }}
                        >
                            {node.level}
                        </div>

                        {/* Tooltip - always shows name on hover */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 px-4 py-2 rounded-lg text-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50"
                            style={{
                                background: 'rgba(10, 15, 10, 0.95)',
                                border: `2px solid ${unlocked ? color : '#4b5563'}`,
                                boxShadow: unlocked ? `0 0 20px ${color}40` : '0 4px 20px rgba(0,0,0,0.5)',
                            }}
                        >
                            <div className="font-bold text-white text-sm">{node.name}</div>
                            {'bonus' in node && (
                                <div className="text-xs mt-0.5" style={{ color: unlocked ? color : '#9ca3af' }}>
                                    {node.bonus}
                                </div>
                            )}
                            {!unlocked && (
                                <div className="text-xs text-gray-500 mt-1 border-t border-gray-700 pt-1">
                                    Requires Lv.{node.level}
                                </div>
                            )}
                            {isLegendary && (
                                <div className="text-xs text-yellow-400 mt-1">★ LEGENDARY</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function SkillsPage() {
    const { walletAddress } = useWallet();
    const [skills, setSkills] = useState<SkillProgress[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSkills = useCallback(async (address: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('skill_progress')
            .select('skill_type, xp, level')
            .eq('wallet_address', address);

        if (!error && data) {
            setSkills(data);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (walletAddress) {
            fetchSkills(walletAddress);
        } else {
            setSkills([]);
            setLoading(false);
        }
    }, [walletAddress, fetchSkills]);

    const getSkillLevel = (skillType: string): number => {
        const skill = skills.find(s => s.skill_type === skillType);
        return skill?.level || 1;
    };

    return (
        <div className="min-h-screen bg-[#030305]">
            <PlayerNavbar />

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="text-[#4ade80] text-xs tracking-[0.4em] mb-3 font-mono">
                        // SKILL MATRIX
                    </p>
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="text-white">MASTER THE </span>
                        <span className="text-[#4ade80]">CODE</span>
                    </h1>
                    <p className="text-gray-400 max-w-lg mx-auto">
                        Four paths to transcendence. Each action strengthens a different aspect of your awakening.
                    </p>
                </div>

                {!walletAddress ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#4ade80]/10 border-2 border-[#4ade80]/30 flex items-center justify-center overflow-hidden">
                            <Image
                                src={iconPaths.sw1}
                                alt="Skill"
                                width={96}
                                height={96}
                                className="opacity-30 grayscale object-cover"
                            />
                        </div>
                        <p className="text-gray-500 text-lg">Connect your wallet to view your skill progress</p>
                    </div>
                ) : loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-2 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Skill Trees Grid */}
                        <div className="flex flex-wrap justify-center gap-6 lg:gap-4">
                            {(Object.keys(skillNodes) as Array<keyof typeof skillNodes>).map((key) => (
                                <div
                                    key={key}
                                    className="p-6 pt-14 rounded-2xl border border-gray-800/50 bg-gradient-to-b from-gray-900/30 to-transparent backdrop-blur-sm hover:border-gray-700/50 transition-colors"
                                >
                                    <SkillTreeBranch
                                        skillKey={key}
                                        userLevel={getSkillLevel(key)}
                                        color={skillNodes[key].color}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="mt-16 flex justify-center gap-8 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-[#4ade80] bg-[#4ade80]/20"
                                    style={{ boxShadow: '0 0 10px #4ade8060' }} />
                                <span>Unlocked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-gray-600 border-dashed bg-gray-800/50 opacity-60" />
                                <span>Locked</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full border-2 border-yellow-400 bg-yellow-500/20 animate-pulse" />
                                <span>Legendary</span>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
