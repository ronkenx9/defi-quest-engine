import { PriceOracle } from '@defi-quest/core';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const oracle = new PriceOracle();
        const now = new Date().toISOString();

        // Find expired prophecies
        const { data: expiredProphecies, error: fetchError } = await supabase
            .from('prophecies')
            .select('*')
            .eq('status', 'active')
            .lt('deadline', now);

        if (fetchError) {
            throw new Error(`Failed to fetch prophecies: ${fetchError.message}`);
        }

        if (!expiredProphecies || expiredProphecies.length === 0) {
            return Response.json({
                success: true,
                message: 'No prophecies to resolve',
                resolved: 0
            });
        }

        const results = [];

        for (const prophecy of expiredProphecies) {
            try {
                // Parse condition
                const condition = prophecy.condition_value;
                const { asset, direction, targetPrice } = condition;

                // Check actual price
                const result = await oracle.checkPrediction(
                    asset,
                    direction,
                    targetPrice
                );

                // Update prophecy
                await supabase
                    .from('prophecies')
                    .update({
                        status: 'resolved',
                        result: result.correct ? 'correct' : 'incorrect',
                        final_price: result.actualPrice,
                        resolved_at: new Date().toISOString()
                    })
                    .eq('id', prophecy.id);

                // Get all predictions for this prophecy
                const { data: entries } = await supabase
                    .from('prophecy_entries')
                    .select('*')
                    .eq('prophecy_id', prophecy.id)
                    .eq('result', 'pending');

                // Resolve each prediction
                if (entries) {
                    for (const entry of entries) {
                        const won = entry.prediction === result.correct;
                        const xpChange = won
                            ? entry.potential_win
                            : -entry.staked_xp;

                        // Update entry
                        await supabase
                            .from('prophecy_entries')
                            .update({
                                result: won ? 'won' : 'lost',
                                xp_change: xpChange,
                                resolved_at: new Date().toISOString()
                            })
                            .eq('id', entry.id);

                        // Update user XP
                        const { data: userData } = await supabase
                            .from('user_stats')
                            .select('total_points, level')
                            .eq('wallet_address', entry.wallet_address)
                            .single();

                        if (userData) {
                            const newPoints = Math.max(0, userData.total_points + xpChange);
                            const newLevel = Math.floor(newPoints / 1000) + 1;

                            await supabase
                                .from('user_stats')
                                .update({
                                    total_points: newPoints,
                                    level: newLevel
                                })
                                .eq('wallet_address', entry.wallet_address);
                        }
                    }
                }

                results.push({
                    prophecy_id: prophecy.id,
                    name: prophecy.title,
                    asset,
                    targetPrice,
                    actualPrice: result.actualPrice,
                    result: result.correct ? 'correct' : 'incorrect',
                    entries_resolved: entries?.length || 0
                });

            } catch (error: any) {
                console.error(`Failed to resolve prophecy ${prophecy.id}:`, error);
                results.push({
                    prophecy_id: prophecy.id,
                    error: error.message
                });
            }
        }

        return Response.json({
            success: true,
            resolved: results.filter(r => !r.error).length,
            failed: results.filter(r => r.error).length,
            results
        });

    } catch (error: any) {
        console.error('Prophecy resolution error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
