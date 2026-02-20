import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const generateProphecies = async () => {
    console.log(`🤖 Oracle initializing batch generation of prediction markets...`);

    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const prophecyData = [
        {
            title: "Will JUP hit $2.00 before the end of the week?",
            description: "Stake XP on Jupiter's immediate price action relative to macroeconomic catalysts.",
            condition_type: "price_above",
            condition_value: { target: 2.00, asset: 'JUP' },
            deadline: threeDaysFromNow,
            status: "active"
        },
        {
            title: "Will the Metaplex Core standard exceed 1M mints this month?",
            description: "A prophecy revolving around the swift adoption rate of the newer, cheaper compression standard.",
            condition_type: "custom",
            condition_value: { metric: 'core_mints', threshold: 1000000 },
            deadline: oneWeekFromNow,
            status: "active"
        }
    ];

    for (const p of prophecyData) {
        const { error, data } = await supabase.from('prophecies').insert([p]);

        if (error) {
            console.error(`❌ Failed to insert prophecy:`, error.message, error.details);
        } else {
            console.log(`✅ Deployed Prophecy: ${p.title}`);
        }
    }

    console.log('🏁 Batch prophecy generation complete.');
};

generateProphecies();
