const fs = require('fs');
const filePath = 'c:\\Users\\HP OMEN 15 GAMING\\OneDrive\\Desktop\\Vibe coding\\defi-quest-engine\\packages\\admin-dashboard\\app\\api\\overseer\\openclaw\\route.ts';

let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
    /const \{ OpenClawClient \} = await import\("openclaw-sdk"\);/,
    '// @ts-ignore\n            const { OpenClawClient } = await import("openclaw-sdk");'
);

fs.writeFileSync(filePath, content);
console.log('File patched successfully.');
