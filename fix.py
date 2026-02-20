import codecs
content = codecs.open('packages/admin-dashboard/components/DashboardLayout.tsx', 'r', 'utf-8').read()

# Replace 1
t1 = '''                    {/* Background Ambience */}
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-accent/15 rounded-full blur-[80px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[60px]"></div>
                        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[50px]"></div>
                    </div>'''
r1 = '''                    {/* Matrix Grid Background */}
                    <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 bg-matrix-grid bg-[length:40px_40px]" />
                    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-transparent via-transparent to-green-900/5">
                        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[80px]"></div>
                    </div>'''

content = content.replace(t1, r1)

t2 = "text-white shadow-glow bg-white/5 border border-primary/20"
r2 = "text-primary bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(74,222,128,0.15)]"
content = content.replace(t2, r2)
content = content.replace("text-gray-400 hover:text-white hover:bg-white/5 hover:border hover:border-white/10", "text-green-800 hover:text-primary hover:bg-primary/5 hover:border hover:border-primary/20")
content = content.replace("drop-shadow-[0_0_8px_rgba(199,242,132,0.5)]", "drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]")
content = content.replace("font-medium tracking-wide font-display", "font-bold uppercase tracking-widest")
content = content.replace("shadow-[0_0_10px_#C7F284]", "shadow-[0_0_10px_#4ade80]")
content = content.replace("rounded-xl transition-all", "rounded-lg transition-all font-mono tracking-widest text-sm uppercase")
codecs.open('packages/admin-dashboard/components/DashboardLayout.tsx', 'w', 'utf-8').write(content)
