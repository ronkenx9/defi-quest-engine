export default function AnalyticsPage() {
    return (
        <div className="animate-fade-in space-y-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-white mb-2">Analytics</h1>
                <p className="text-gray-400">Track engagement and performance metrics</p>
            </div>

            {/* Time Period Selector */}
            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl inline-flex backdrop-blur-md">
                {['7d', '30d', '90d', 'All'].map((period) => (
                    <button
                        key={period}
                        className={`px-6 py-2 rounded-lg text-sm font-bold font-display transition-all duration-300 ${period === '30d'
                            ? 'bg-primary text-black shadow-glow'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {period}
                    </button>
                ))}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Total Users"
                    value="1,234"
                    subtext="+124 this month"
                    trend="up"
                    icon="👥"
                />
                <MetricCard
                    title="Mission Completions"
                    value="3,456"
                    subtext="+567 this month"
                    trend="up"
                    icon="✅"
                />
                <MetricCard
                    title="Avg. Completion Rate"
                    value="67%"
                    subtext="+5% from last month"
                    trend="up"
                    icon="📈"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Active Users Chart */}
                <div className="glass-card p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <h3 className="text-xl font-bold font-display text-white mb-6">Daily Active Users</h3>

                    <div className="h-64 w-full relative">
                        {/* Custom SVG Line Chart */}
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#C7F284" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#C7F284" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid */}
                            <line x1="0" y1="100%" x2="100%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                            <line x1="0" y1="0" x2="0" y2="100%" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                            {/* Path */}
                            <path
                                d="M0,200 Q50,150 100,180 T200,100 T300,150 T400,50 T500,100 L500,250 L0,250 Z"
                                fill="url(#chartGradient)"
                            />
                            <path
                                d="M0,200 Q50,150 100,180 T200,100 T300,150 T400,50 T500,100"
                                fill="none"
                                stroke="#C7F284"
                                strokeWidth="3"
                                className="drop-shadow-glow"
                            />

                            {/* Data Points */}
                            <circle cx="200" cy="100" r="4" fill="#C7F284" className="animate-pulse" />
                            <circle cx="400" cy="50" r="4" fill="#C7F284" className="animate-pulse" />
                        </svg>

                        {/* X-Axis Labels */}
                        <div className="absolute bottom-[-20px] left-0 right-0 flex justify-between text-xs text-gray-500 font-mono">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                </div>

                {/* Mission Type Distribution */}
                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] -translate-y-1/2 -translate-x-1/2"></div>
                    <h3 className="text-xl font-bold font-display text-white mb-6">Completions by Type</h3>

                    <div className="flex items-center justify-center h-64">
                        {/* CSS Donut Chart */}
                        <div className="relative w-48 h-48 rounded-full border-[12px] border-white/5 flex items-center justify-center group">
                            {/* Segments (simulated with conics) */}
                            <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-primary border-r-secondary rotate-45 shadow-[0_0_20px_rgba(199,242,132,0.2)] transition-transform duration-700 hover:scale-105"></div>

                            <div className="text-center z-10">
                                <p className="text-3xl font-bold text-white font-display">85%</p>
                                <p className="text-xs text-gray-400 uppercase tracking-widest">Swaps</p>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="ml-8 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-primary shadow-glow"></span>
                                <span className="text-sm text-gray-300">Swaps</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_#00BEBD]"></span>
                                <span className="text-sm text-gray-300">Volume</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-white/20"></span>
                                <span className="text-sm text-gray-300">Other</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mission Performance Table */}
            <div className="glass-card p-0 overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold font-display text-white">Mission Performance</h3>
                    <button className="btn btn-secondary text-xs">
                        📤 Export CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-6 py-4 text-left text-xs font-bold text-primary uppercase tracking-wider font-display">Mission</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Started</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Completed</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Rate</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider font-display">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {[
                                { name: 'Swap 1 SOL to USDC', started: 450, completed: 234, rate: '52%', time: '2m' },
                                { name: '$100 Volume', started: 230, completed: 89, rate: '39%', time: '3d' },
                                { name: '7-day Streak', started: 180, completed: 45, rate: '25%', time: '7d' },
                                { name: 'Buy SOL < $100', started: 90, completed: 12, rate: '13%', time: '5d' },
                            ].map((m, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-white group-hover:text-primary transition-colors">{m.name}</td>
                                    <td className="px-6 py-4 text-gray-400">{m.started}</td>
                                    <td className="px-6 py-4 text-gray-400">{m.completed}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${parseInt(m.rate) > 40 ? 'bg-success/20 text-success' :
                                                parseInt(m.rate) > 20 ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'
                                            }`}>
                                            {m.rate}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{m.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, subtext, trend, icon }: any) {
    return (
        <div className="glass-card p-6 relative group overflow-hidden hover:scale-[1.02] transition-all">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl">{icon}</span>
            </div>
            <p className="text-sm text-gray-400 mb-2 font-display uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-bold text-white mb-2 font-display group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-primary transition-all">{value}</p>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded bg-success/10 text-success border border-success/20`}>
                    {subtext}
                </span>
            </div>
        </div>
    );
}
