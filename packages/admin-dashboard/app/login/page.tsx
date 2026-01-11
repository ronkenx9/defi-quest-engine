'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);

    const { signIn, signUp } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const { error } = isSignUp
            ? await signUp(email, password)
            : await signIn(email, password);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            if (isSignUp) {
                setError('Check your email to confirm your account!');
                setLoading(false);
            } else {
                router.push('/');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/10 rounded-full blur-[200px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[180px]"></div>
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-8">
                <div className="glass-panel rounded-3xl p-8 border border-white/[0.06] shadow-2xl">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-glow-gradient flex items-center justify-center shadow-glow">
                            <Zap className="w-8 h-8 text-black" fill="currentColor" />
                        </div>
                        <h1 className="text-2xl font-bold font-display text-transparent bg-clip-text bg-glow-gradient">
                            DeFi Quest Admin
                        </h1>
                        <p className="text-gray-500 text-sm mt-2">
                            {isSignUp ? 'Create your admin account' : 'Sign in to your account'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${error.includes('Check your email')
                                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border border-red-500/20 text-red-400'
                            }`}>
                            <AlertCircle size={18} />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    required
                                    className="w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/40 focus:shadow-glow-sm transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3.5 bg-surface-1 border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/40 focus:shadow-glow-sm transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-glow-gradient text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Sign Up / Sign In */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                            className="text-sm text-gray-400 hover:text-primary transition-colors"
                        >
                            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-600 text-xs mt-6">
                    Powered by Supabase Auth
                </p>
            </div>
        </div>
    );
}
