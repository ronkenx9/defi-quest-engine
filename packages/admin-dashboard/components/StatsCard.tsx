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
        <div className="card group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-primary/20 group-hover:text-primary transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(199,242,132,0.3)]">
                    <Icon size={20} strokeWidth={1.5} />
                </div>
                <div className={`
                    px-2 py-1 rounded text-xs font-bold font-mono flex items-center gap-1
                    ${positive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}
                `}>
                    {positive ? '↑' : '↓'} {change}
                </div>
            </div>
            <div>
                <h3 className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-1">{label}</h3>
                <p className="text-2xl font-bold text-white font-display group-hover:drop-shadow-glow transition-all">{value}</p>
            </div>
        </div>
    );
}
