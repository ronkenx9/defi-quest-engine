import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, Lock, Activity, Cpu, Zap } from 'lucide-react';
import { MatrixSounds } from '@/lib/sounds';

interface OracleFeedCardProps {
    prophecy: any;
    entry?: any;
    onStake: (id: string, prediction: boolean, amount: number) => void;
    type: 'live' | 'next' | 'locked' | 'resolved';
}

export default function OracleFeedCard({ prophecy, entry, onStake, type }: OracleFeedCardProps) {
    const [stakeAmount, setStakeAmount] = useState<number>(prophecy.min_stake);
    const [selectedPrediction, setSelectedPrediction] = useState<boolean | null>(null);
    const [timeLeft, setTimeLeft] = useState('00:00:00');
    const [isHovered, setIsHovered] = useState(false);

    const totalPool = (prophecy.total_yes_pool || 0) + (prophecy.total_no_pool || 0);
    const yesOdds = totalPool > 0 && prophecy.total_yes_pool > 0 ? ((totalPool / prophecy.total_yes_pool) * 0.95).toFixed(2) : '1.90';
    const noOdds = totalPool > 0 && prophecy.total_no_pool > 0 ? ((totalPool / prophecy.total_no_pool) * 0.95).toFixed(2) : '1.90';

    useEffect(() => {
        const calculateTimeLeft = () => {
            const diff = new Date(prophecy.deadline).getTime() - Date.now();
            if (diff <= 0) return '00:00:00';
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [prophecy.deadline]);

    const handleCommit = () => {
        if (selectedPrediction !== null && stakeAmount >= prophecy.min_stake) {
            MatrixSounds.playAction();
            onStake(prophecy.id, selectedPrediction, stakeAmount);
            setSelectedPrediction(null);
        }
    };

    const isLive = type === 'live';
    const isNext = type === 'next';

    const themeColor = isLive ? '#4ade80' : isNext ? '#a855f7' : '#6b7280';
    const textGlow = `0 0 5px ${themeColor}80, 0 0 10px ${themeColor}40`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            whileHover={{ scale: 1.01, translateY: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="w-[380px] flex-shrink-0 relative group perspective-1000"
        >
            {/* Skeuomorphic Hardware Case / Bezel */}
            <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#2a2d2a] to-[#121412] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-2px_10px_rgba(0,0,0,0.5)] border border-[#3a3d3a]">

                {/* Physical Screws in corners */}
                <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#404040] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-[1px] h-full bg-black/50 rotate-45" /></div>
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#404040] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-[1px] h-full bg-black/50 -rotate-12" /></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#404040] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-[1px] h-full bg-black/50 rotate-90" /></div>
                <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#404040] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.1)] flex items-center justify-center"><div className="w-[1px] h-full bg-black/50 rotate-0" /></div>

                {/* Hardware Identity Plate */}
                <div className="flex justify-between items-center px-4 pt-1 pb-3 mb-2 mx-2 border-b-2 border-[#151515] shadow-[0_1px_0_rgba(255,255,255,0.05)]">
                    <div className="flex items-center gap-3">
                        {/* Physical LED Indicator */}
                        <div className={`w-3 h-3 rounded-full shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] relative ${isLive ? 'bg-black' : 'bg-[#151515]'}`}>
                            {isLive && (
                                <div className="absolute inset-0 rounded-full bg-[#4ade80] opacity-80 animate-pulse" style={{ boxShadow: '0 0 10px #4ade80, inset 0 0 5px white' }} />
                            )}
                            {isNext && (
                                <div className="absolute inset-0 rounded-full bg-[#a855f7] opacity-50" style={{ boxShadow: 'inset 0 0 5px white' }} />
                            )}
                        </div>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 shadow-[0_1px_0_rgba(255,255,255,0.1)]" style={{ transform: 'translateY(-1px)' }}>MODULE_ID:</span>
                        <span className="text-[10px] font-mono tracking-widest text-[#a0a0a0] px-2 py-0.5 bg-[#151515] rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-[#222]">
                            {prophecy.id.slice(0, 6).toUpperCase()}
                        </span>
                    </div>
                </div>

                {/* Recessed CRT Screen Container */}
                <div className="relative mx-2 bg-[#050805] rounded-lg overflow-hidden border-4 border-[#111] shadow-[inset_0_0_20px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.1)] h-[320px] flex flex-col">

                    {/* Screen Glass Reflection & CRT Curve */}
                    <div className="absolute inset-0 pointer-events-none rounded-lg z-50 mix-blend-screen opacity-40 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] bg-[linear-gradient(rgba(255,255,255,0.05)_0%,rgba(255,255,255,0)_50%,rgba(255,255,255,0.02)_100%)]"></div>
                    {isHovered && <div className="absolute inset-0 pointer-events-none z-40 bg-gradient-to-tr from-transparent via-[rgba(255,255,255,0.03)] to-transparent translate-y-full group-hover:-translate-y-full transition-transform duration-[1.5s] ease-linear" />}

                    {/* Scanlines Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-30 opacity-20 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"></div>

                    {/* V-SYNC Jitter Effect Container */}
                    <motion.div
                        className="relative z-20 flex-1 p-5 flex flex-col"
                        animate={isHovered ? { x: [0, -1, 0, 1, 0] } : {}}
                        transition={{ duration: 0.1, repeat: isHovered ? Infinity : 0, repeatType: 'mirror', ease: "linear" }}
                    >
                        {/* Status Header */}
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                            <span
                                className="font-black tracking-[0.3em] uppercase text-xs flex items-center gap-2"
                                style={{ color: themeColor, textShadow: textGlow }}
                            >
                                {isLive ? <Activity className="w-4 h-4" /> : isNext ? <Clock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {type}_FEED
                            </span>
                            <span className={`font-mono font-bold text-sm tracking-widest ${isLive ? 'text-[#4ade80]' : 'text-gray-500'}`} style={{ textShadow: isLive ? textGlow : 'none' }}>
                                {timeLeft}
                            </span>
                        </div>

                        {/* Condition Target */}
                        <div className="mb-4 flex-1 flex flex-col justify-center">
                            <div className="text-[9px] uppercase text-gray-500 tracking-[0.2em] mb-1 font-bold">Target Parameter</div>
                            <div className="text-xl font-black text-white leading-tight break-words font-mono" style={{ textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
                                {prophecy.title}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 font-mono uppercase opacity-80 leading-relaxed border-l-2 border-white/20 pl-2">
                                {prophecy.description}
                            </p>
                        </div>

                        {/* Analog Probability Readouts */}
                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <div className="bg-[#081008] border border-[#4ade80]/20 p-2 rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                <div className="text-[9px] text-[#4ade80]/60 uppercase tracking-widest mb-1 font-bold">UP_VECTOR</div>
                                <div className="text-lg font-black text-[#4ade80] flex items-center gap-1" style={{ textShadow: textGlow }}>
                                    <ArrowUpRight className="w-4 h-4" /> {yesOdds}x
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase mt-1 font-mono">Mass: {prophecy.total_yes_pool}</div>
                            </div>
                            <div className="bg-[#100505] border border-red-500/20 p-2 rounded shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                <div className="text-[9px] text-red-500/60 uppercase tracking-widest mb-1 font-bold">DOWN_VECTOR</div>
                                <div className="text-lg font-black text-red-500 flex items-center gap-1" style={{ textShadow: `0 0 5px rgba(239,68,68,0.5)` }}>
                                    <ArrowDownRight className="w-4 h-4" /> {noOdds}x
                                </div>
                                <div className="text-[10px] text-gray-500 uppercase mt-1 font-mono">Mass: {prophecy.total_no_pool}</div>
                            </div>
                        </div>

                        {/* Entry Overlay on Screen */}
                        {entry && (
                            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 border-4 border-transparent">
                                <div className="text-center w-full bg-[#111] p-4 rounded-lg border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                                    <ShieldCheck className="w-8 h-8 text-gray-500 mx-auto mb-2 opacity-50" />
                                    <div className="text-[9px] uppercase tracking-widest text-gray-500 mb-2 font-bold">Position Locked</div>
                                    <div className="flex justify-center items-center gap-4 mb-2">
                                        <div className={`text-2xl font-black ${entry.prediction ? 'text-[#4ade80]' : 'text-red-500'}`} style={{ textShadow: entry.prediction ? textGlow : `0 0 10px rgba(239,68,68,0.5)` }}>
                                            {entry.prediction ? 'UP' : 'DOWN'}
                                        </div>
                                        <div className="h-6 w-px bg-white/20" />
                                        <div className="text-xl font-mono text-white/90">
                                            {entry.staked_xp} XP
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-[#4ade80]/60 uppercase tracking-widest mt-2 animate-pulse">Awaiting Resolution</div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Mechanical Control Panel (Bottom) */}
                {isLive && !entry && (
                    <div className="px-3 pt-4 pb-2 mt-1">
                        <AnimatePresence mode="wait">
                            {selectedPrediction === null ? (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    {/* Physical Push Button - UP */}
                                    <button
                                        onClick={() => { MatrixSounds.playTick(); setSelectedPrediction(true); }}
                                        className="relative h-12 rounded bg-gradient-to-b from-[#2a2d2a] to-[#151515] border-b-4 border-[#111] border-x border-x-white/5 border-t border-t-white/10 shadow-[0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] active:border-b-0 active:translate-y-[4px] active:shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all group/btn flex items-center justify-center gap-2"
                                    >
                                        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]" />
                                        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]" />
                                        <ArrowUpRight className="w-4 h-4 text-[#4ade80] opacity-80 group-hover/btn:opacity-100 group-hover/btn:drop-shadow-[0_0_5px_#4ade80] transition-all" />
                                        <span className="font-bold text-[11px] font-mono tracking-widest text-gray-300 group-hover/btn:text-white uppercase pt-px">COMMIT UP</span>
                                    </button>

                                    {/* Physical Push Button - DOWN */}
                                    <button
                                        onClick={() => { MatrixSounds.playTick(); setSelectedPrediction(false); }}
                                        className="relative h-12 rounded bg-gradient-to-b from-[#2a2d2a] to-[#151515] border-b-4 border-[#111] border-x border-x-white/5 border-t border-t-white/10 shadow-[0_5px_10px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] active:border-b-0 active:translate-y-[4px] active:shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(0,0,0,0.8)] transition-all group/btn flex items-center justify-center gap-2"
                                    >
                                        <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]" />
                                        <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-black/50 shadow-[inset_0_1px_1px_rgba(0,0,0,0.8)]" />
                                        <ArrowDownRight className="w-4 h-4 text-red-500 opacity-80 group-hover/btn:opacity-100 group-hover/btn:drop-shadow-[0_0_5px_#ef4444] transition-all" />
                                        <span className="font-bold text-[11px] font-mono tracking-widest text-gray-300 group-hover/btn:text-white uppercase pt-px">COMMIT DOWN</span>
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-[#1a1c1a] p-3 rounded-lg border border-[#333] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-10">
                                        <Cpu className="w-full h-full text-white" />
                                    </div>
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Targeting Vector</span>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest bg-black shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] ${selectedPrediction ? 'text-[#4ade80]' : 'text-red-500'}`} style={{ textShadow: selectedPrediction ? textGlow : `0 0 5px rgba(239,68,68,0.5)` }}>
                                            {selectedPrediction ? 'UP (YES)' : 'DOWN (NO)'}
                                        </div>
                                    </div>

                                    {/* Physical Dial/Input hybrid */}
                                    <div className="w-full h-10 mb-3 bg-black rounded border border-[#222] shadow-[inset_0_2px_5px_rgba(0,0,0,0.8)] flex items-center px-1">
                                        <div className="text-[10px] text-gray-600 font-black px-2 py-1 bg-[#111] rounded shadow-[0_1px_0_rgba(255,255,255,0.05)] border border-white/5 mr-2">XP</div>
                                        <input
                                            type="number"
                                            min={prophecy.min_stake}
                                            max={prophecy.max_stake}
                                            value={stakeAmount || ''}
                                            onChange={(e) => setStakeAmount(parseInt(e.target.value) || 0)}
                                            className="bg-transparent flex-1 h-full font-mono text-lg text-white font-bold tracking-widest focus:outline-none placeholder:text-gray-800 pointer-events-auto w-full"
                                            placeholder="000"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        {/* Physical Switch - Abort */}
                                        <button
                                            onClick={() => { MatrixSounds.playTick(); setSelectedPrediction(null); }}
                                            className="px-4 py-2 bg-gradient-to-b from-[#333] to-[#222] border-b-2 border-black rounded shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] active:border-b-0 active:translate-y-[2px] text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all pointer-events-auto"
                                        >
                                            ABORT
                                        </button>

                                        {/* Heavy Master Switch - Execute */}
                                        <button
                                            onClick={handleCommit}
                                            disabled={stakeAmount < prophecy.min_stake || stakeAmount > prophecy.max_stake}
                                            className={`flex-1 relative overflow-hidden bg-gradient-to-b ${selectedPrediction ? 'from-[#225022] to-[#0a200a] text-[#4ade80] border-[#113011]' : 'from-[#502222] to-[#200a0a] text-red-500 border-[#301111]'} border-b-2 border-r-2 border-t border-t-white/10 rounded shadow-[0_3px_6px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.2)] active:border-b-0 active:border-r-0 active:translate-y-[2px] active:translate-x-[2px] transition-all disabled:opacity-50 disabled:grayscale font-black text-xs tracking-[0.2em] uppercase pointer-events-auto`}
                                            style={{ textShadow: `0 0 5px rgba(0,0,0,0.8)` }}
                                        >
                                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.02)_5px,rgba(255,255,255,0.02)_10px)]" />
                                            <div className="relative z-10 flex items-center justify-center gap-2">
                                                <Zap className="w-3 h-3 drop-shadow-[0_0_5px_currentColor]" />
                                                EXECUTE
                                            </div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
