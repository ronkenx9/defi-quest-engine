import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const generateMissions = async (count: number = 10) => {
    console.log(`🤖 Overseer AI initializing batch generation of ${count} missions...`);

    const missionTypes = ['swap', 'volume', 'streak', 'prediction', 'staking'];
    const missionTemplates: Record<string, { names: string[], baseXp: number }> = {
        swap: { names: ['Liquidity Directive', 'Token Swarm', 'Arbitrage Hunt', 'Protocol Shift'], baseXp: 250 },
        volume: { names: ['Volume Amplification', 'Whale Simulation', 'Market Maker Protocol', 'Liquidity Surge'], baseXp: 350 },
        streak: { names: ['Streak Persistence Protocol', 'Daily Operations', 'Consistency Check', 'Habit Loop'], baseXp: 400 },
        prediction: { names: ['Market Oracle Prediction', 'Future Sight Protocol', 'Price Action Foresight', 'Trend Analysis'], baseXp: 500 },
        staking: { names: ['Stake Validation Order', 'LST Accumulation', 'Network Security Protocol', 'Yield Maximization'], baseXp: 275 },
    };

    const difficulties = ['easy', 'medium', 'hard', 'legendary'];

    for (let i = 0; i < count; i++) {
        const typeMatch = missionTypes[Math.floor(Math.random() * missionTypes.length)];
        const template = missionTemplates[typeMatch];
        const randomName = template.names[Math.floor(Math.random() * template.names.length)];
        const diffIndex = Math.floor(Math.random() * difficulties.length);
        const difficulty = difficulties[diffIndex];

        let anomalyLevel = 1.0;
        if (difficulty === 'legendary') anomalyLevel = 1.6;
        if (difficulty === 'hard') anomalyLevel = 1.3;
        if (difficulty === 'easy') anomalyLevel = 0.7;

        const xpReward = Math.floor(template.baseXp * anomalyLevel * (Math.random() * 0.5 + 0.8));
        const customMissionId = `overseer_${Date.now()}_${i}`;

        const missionData = {
            mission_id: customMissionId,
            name: `${randomName} [Batch ${Math.floor(Math.random() * 999)}]`,
            description: `Auto-generated Overseer AI directive with ${difficulty} difficulty payload.`,
            type: typeMatch,
            difficulty: difficulty,
            points: xpReward,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('missions').insert([missionData]);

        if (error) {
            console.error(`❌ Failed to insert mission ${i}:`, error.message);
        } else {
            console.log(`✅ Deployed: [${difficulty.toUpperCase()}] ${missionData.name} (+${xpReward} XP)`);
        }
    }

    console.log('🏁 Batch mission generation complete.');
};

generateMissions(10);
