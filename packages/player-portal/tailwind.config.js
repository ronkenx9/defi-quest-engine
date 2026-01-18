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
                display: ['Inter Tight', 'sans-serif'],
            },
            colors: {
                background: '#0f1218', // Deeper dark
                surface: {
                    DEFAULT: '#151922',
                    1: 'rgba(28, 36, 49, 0.6)',
                    2: 'rgba(35, 45, 60, 0.5)',
                    3: 'rgba(45, 55, 70, 0.4)',
                },
                card: 'rgba(22, 28, 38, 0.75)',
                border: 'rgba(199, 242, 132, 0.08)',
                primary: {
                    DEFAULT: '#C7F284',
                    hover: '#D4FA96',
                    light: '#E0FFB0',
                    dark: '#A6CF65',
                    muted: 'rgba(199, 242, 132, 0.15)',
                },
                secondary: {
                    DEFAULT: '#00D4D4',
                    hover: '#00E5E5',
                    muted: 'rgba(0, 212, 212, 0.15)',
                },
                accent: {
                    DEFAULT: '#8B5CF6',
                    hover: '#7C4AE8',
                    muted: 'rgba(139, 92, 246, 0.15)',
                },
                success: '#22C55E',
                warning: '#F59E0B',
                error: '#EF4444',
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'cosmic-gradient': 'linear-gradient(135deg, #0f1218 0%, #0a0d12 100%)',
                'card-gradient': 'linear-gradient(145deg, rgba(22,28,38,0.9), rgba(22,28,38,0.5))',
                'glow-gradient': 'linear-gradient(135deg, #C7F284 0%, #00D4D4 100%)',
                'surface-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
            },
            boxShadow: {
                'glow-sm': '0 0 12px rgba(199, 242, 132, 0.1)',
                'glow': '0 0 24px rgba(199, 242, 132, 0.15)',
                'glow-lg': '0 0 48px rgba(199, 242, 132, 0.2)',
                'glow-xl': '0 0 72px rgba(199, 242, 132, 0.25)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
                'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.5)',
                'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
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
                    '0%, 100%': { boxShadow: '0 0 12px rgba(199, 242, 132, 0.08)' },
                    '50%': { boxShadow: '0 0 28px rgba(199, 242, 132, 0.2)' },
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
