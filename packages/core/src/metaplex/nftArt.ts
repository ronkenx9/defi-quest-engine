/**
 * Central registry for all NFT Art used in the DeFi Quest Engine.
 * Use these absolute URLs when minting NFTs so the metadata points to the correct pixel art.
 */

export const NFT_ART_ASSETS: Record<string, string> = {
    // Core Achievements
    'Initiate': 'https://defi-quest-home.netlify.app/badges/red-pill.png',
    'Volume Trader': 'https://defi-quest-home.netlify.app/badges/system-glitch.png',
    'Swap Master': 'https://defi-quest-home.netlify.app/badges/the-one.png',
    'The One': 'https://defi-quest-home.netlify.app/badges/the-one.png',
    'Streak Starter': 'https://defi-quest-home.netlify.app/badges/white-rabbit.png',
    'Streak Warrior': 'https://defi-quest-home.netlify.app/badges/streak-warrior.png',
    'Streak Legend': 'https://defi-quest-home.netlify.app/badges/streak-legend.png',
    'DCA Initiate': 'https://defi-quest-home.netlify.app/badges/dca-initiate.png',
    'Limit Order Pro': 'https://defi-quest-home.netlify.app/badges/operator.png',
    'The Operator': 'https://defi-quest-home.netlify.app/badges/operator.png',

    // AI Forge Variants
    'Phasing Neo': 'https://defi-quest-home.netlify.app/variants/variant-1.png',
    'neo_variant': 'https://defi-quest-home.netlify.app/variants/variant-1.png',
    'Glitched Oracle': 'https://defi-quest-home.netlify.app/variants/variant-2.png',
    'oracle_variant': 'https://defi-quest-home.netlify.app/variants/variant-2.png',
    'Sentient Agent': 'https://defi-quest-home.netlify.app/variants/variant-3.png',
    'agent_variant': 'https://defi-quest-home.netlify.app/variants/variant-3.png',

    // Special
    'Escape Simulation': 'https://defi-quest-home.netlify.app/badges/escape.png',
    'Prophecy': 'https://defi-quest-home.netlify.app/badges/escape.png',
    'Early Adopter': 'https://defi-quest-home.netlify.app/badges/early-adopter.png',

    // Fallback
    'default': 'https://defi-quest-home.netlify.app/badges/red-pill.png'
};

export function getBadgeImage(badgeNameOrType: string): string {
    return NFT_ART_ASSETS[badgeNameOrType] || NFT_ART_ASSETS['default'];
}
