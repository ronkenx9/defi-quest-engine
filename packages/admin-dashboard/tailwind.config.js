/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Fira Code', 'monospace'],
                mono: ['Fira Code', 'monospace'],
            },
            colors: {
                background: '#050507',
                surface: {
                    DEFAULT: '#0a0f0a',
                    1: 'rgba(10, 15, 10, 0.6)',
                    2: 'rgba(20, 30, 20, 0.5)',
                    3: 'rgba(30, 45, 30, 0.4)',
                },
                card: 'rgba(10, 15, 10, 0.75)',
                border: 'rgba(74, 222, 128, 0.1)',
                primary: {
                    DEFAULT: '#4ade80',
                    hover: '#22c55e',
                    light: '#86efac',
                    dark: '#16a34a',
                    muted: 'rgba(74, 222, 128, 0.15)',
                },
                secondary: {
                    DEFAULT: '#3b82f6',
                    hover: '#2563eb',
                    muted: 'rgba(59, 130, 246, 0.15)',
                },
                accent: {
                    DEFAULT: '#a855f7',
                    hover: '#9333ea',
                    muted: 'rgba(168, 85, 247, 0.15)',
                },
                success: '#22C55E',
                warning: '#eab308',
                error: '#ef4444',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'cosmic-gradient': 'linear-gradient(135deg, #050507 0%, #0a0f0a 100%)',
                'card-gradient': 'linear-gradient(145deg, rgba(10,15,10,0.9), rgba(10,15,10,0.5))',
                'glow-gradient': 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
                'surface-gradient': 'linear-gradient(180deg, rgba(74,222,128,0.04) 0%, transparent 100%)',
                'matrix-grid': 'linear-gradient(rgba(74, 222, 128, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 222, 128, 0.1) 1px, transparent 1px)',
            },
            boxShadow: {
                'glow-sm': '0 0 12px rgba(74, 222, 128, 0.15)',
                'glow': '0 0 24px rgba(74, 222, 128, 0.25)',
                'glow-lg': '0 0 48px rgba(74, 222, 128, 0.4)',
                'glow-xl': '0 0 72px rgba(74, 222, 128, 0.5)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.8)',
                'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.9)',
                'inner-glow': 'inset 0 1px 0 rgba(74,222,128,0.1)',
            },
            animation: {
                'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-in': 'slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-16px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 12px rgba(74, 222, 128, 0.1)' },
                    '50%': { boxShadow: '0 0 28px rgba(74, 222, 128, 0.3)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
};
