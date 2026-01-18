/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                'matrix-green': '#4ade80',
                'matrix-dark': '#0a0a0f',
                'matrix-card': '#14141f',
                'matrix-border': '#2a2a3f',
            },
        },
    },
    plugins: [],
};
