import { LucideIcon, Users, Zap, BarChart3, TrendingUp } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: string;
    change: string;
    positive: boolean;
    icon: string; // We'll keep this as string to map to Lucide icons
}

const iconMap: Record<string, LucideIcon> = {
    '👥': Users,
    '⚡': Zap,
    '💎': BarChart3,
    '🔥': TrendingUp,
};

export function StatsCard({ label, value, change, positive, icon }: StatsCardProps) {
    const Icon = iconMap[icon] || Zap;

    return (
        <div
            className="group relative bg-[#000000] border border-[#4ade80]/30 p-5 transition-all duration-200 hover:border-[#4ade80] hover:-translate-y-1 hover:-translate-x-1"
            style={{
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)',
                boxShadow: '4px 4px 0px rgba(74,222,128,0.2)'
            }}
        >
            {/* Terminal Tab Header */}
            <div className="absolute top-0 right-0 bg-[#4ade80]/10 border-b border-l border-[#4ade80]/30 px-2 py-0.5 text-[8px] font-mono text-[#4ade80] uppercase tracking-widest">
                SYS_STAT_0X{Math.floor(Math.random() * 9999).toString().padStart(4, '0')}
            </div>

            <div className="flex justify-between items-start mb-6 mt-2">
                <div className="w-10 h-10 border border-[#4ade80]/30 bg-[#4ade80]/5 flex items-center justify-center text-[#4ade80]/60 group-hover:text-[#000000] group-hover:bg-[#4ade80] transition-colors duration-200">
                    <Icon size={20} strokeWidth={2} />
                </div>
                <div className={`
                    px-2 py-0.5 border text-xs font-bold font-mono flex items-center gap-1 uppercase tracking-tighter
                    ${positive ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}
                `}>
                    {positive ? '[+]' : '[-]'} {change}
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-[#4ade80]/50 text-[10px] font-mono tracking-[0.2em] uppercase mb-1">{label}</h3>
                <p className="text-3xl font-black text-white font-mono tracking-tighter group-hover:text-[#4ade80] transition-colors">
                    {value}
                </p>
            </div>

            {/* Cyber Accents */}
            <div className="absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 border-[#4ade80]/30 pointer-events-none"></div>
        </div>
    );
}
