import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This endpoint resolves resolved Polymarket markets and credits winners
export async function POST() {
    try {
        // Fetch recently resolved markets from Polymarket across all categories
        const response = await fetch(
            'https://gamma-api.polymarket.com/events?closed=true&limit=50&ascending=false&order=end_date'
        );

        if (!response.ok) {
            console.error(`Polymarket API error: ${response.status}`);
            throw new Error(`Polymarket API error: ${response.status}`);
        }

        const events = await response.json();
        let resolvedCount = 0;
        let winnersPaid = 0;

        for (const event of events || []) {
            if (!event.markets || event.markets.length === 0) continue;
            const market = event.markets[0];

            // Only process markets that are resolved (check both closed and resolved flags)
            if (market.closed !== true && market.resolved !== true) continue;

            // Determine the winning outcome - handle JSON string or array
            let prices = market.outcomePrices;
            if (typeof prices === 'string') {
                try { prices = JSON.parse(prices); } catch { prices = [0.5, 0.5]; }
            }
            // Logic: In Binary markets, prices[0] is Yes. If prices[0] > prices[1], Yes won.
            const winningOutcome = parseFloat(prices?.[0] || '0') > parseFloat(prices?.[1] || '0');

            // Find all pending entries for this market
            const { data: entries, error: entriesError } = await supabase
                .from('prophecy_entries')
                .select('*')
                .eq('market_id', market.id)
                .eq('result', 'pending');

            if (entriesError) {
                console.error(`Error fetching entries for market ${market.id}:`, entriesError);
                continue;
            }

            if (!entries || entries.length === 0) continue;

            // Process each entry
            for (const entry of entries) {
                const didWin = entry.prediction === winningOutcome;

                // XP change in the entry record reflects the net gain/loss
                const xpChange = didWin ? entry.potential_win : -entry.staked_xp;

                await supabase
                    .from('prophecy_entries')
                    .update({
                        result: didWin ? 'won' : 'lost',
                        xp_change: xpChange,
                        resolved_at: new Date().toISOString()
                    })
                    .eq('id', entry.id);

                // Credit XP to user_stats ONLY IF THEY WON
                // Stake was already deducted at the time of position entry
                if (didWin) {
                    const { data: currentStats } = await supabase
                        .from('user_stats')
                        .select('total_points')
                        .eq('wallet_address', entry.wallet_address)
                        .single();

                    if (currentStats) {
                        await supabase
                            .from('user_stats')
                            .update({ total_points: currentStats.total_points + entry.potential_win })
                            .eq('wallet_address', entry.wallet_address);
                    }
                }

                winnersPaid++;
            }

            resolvedCount++;
        }

        return NextResponse.json({
            success: true,
            marketsResolved: resolvedCount,
            entriesProcessed: winnersPaid
        });

    } catch (error) {
        console.error('Prophecy resolution error:', error);
        return NextResponse.json(
            { error: 'Failed to resolve markets' },
            { status: 500 }
        );
    }
}
