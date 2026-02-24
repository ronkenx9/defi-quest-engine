const fs = require('fs');
const path = require('path');

const badges = [
    { id: 'system-glitch', color: '#60a5fa', text: 'GLITCH' },
    { id: 'white-rabbit', color: '#4ade80', text: 'RABBIT' },
    { id: 'operator', color: '#c084fc', text: 'OPERATOR' },
    { id: 'the-one', color: '#f43f5e', text: 'THE ONE' },
    { id: 'code-breaker', color: '#22c55e', text: 'CRACK' },
    { id: 'oracle', color: '#a855f7', text: 'ORACLE' },
    { id: 'architect', color: '#f59e0b', text: 'ARCH' },
    { id: 'agent-smith', color: '#10b981', text: 'SMITH' },
    { id: 'zion', color: '#3b82f6', text: 'ZION' }
];

const dir = path.join(__dirname, 'packages/admin-dashboard/public/nft-art');

badges.forEach(b => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="#050505"/>
    <path d="M150 150 Q200 100 250 150 T250 250 Q200 300 150 250 T150 150" fill="${b.color}" stroke="${b.color}" stroke-opacity="0.5" stroke-width="4"/>
    <text x="200" y="210" font-family="monospace" font-size="28" fill="white" font-weight="bold" text-anchor="middle">${b.text}</text>
    <path d="M200 150 L200 250" stroke="white" stroke-width="2" stroke-dasharray="4 4"/>
</svg>`;

    fs.writeFileSync(path.join(dir, `${b.id}.svg`), svg);
    console.log(`Created ${b.id}.svg`);
});
