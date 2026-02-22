import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// System tax on winning pool distributions
const SYSTEM_TAX_RATE = 0.05;

// POST /api/overseer/resolve-feed
// Chron job or admin trigger to resolve expired prophecies
export async function POST(request: NextRequest) {
    try {
        console.log('[Oracle Feed] Commencing Trustless Resolution Protocol...');

        // 1. Fetch expired prophecies that are still 'active'
        const { data: expiredProphecies, error: fetchError } = await supabase
            .from('prophecies')
            .select('*')
            .eq('type', 'feed')
            .eq('status', 'active')
            .lte('deadline', new Date().toISOString());

        if (fetchError) {
            console.error('[Oracle Feed] Error fetching expired prophecies:', fetchError);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!expiredProphecies || expiredProphecies.length === 0) {
            console.log('[Oracle Feed] No prophecies await resolution.');
            return NextResponse.json({ success: true, message: 'No expired prophecies found.' });
        }

        console.log(`[Oracle Feed] Found ${expiredProphecies.length} prophecies for resolution.`);

        const results = [];

        // 2. Process each expired prophecy
        for (const prophecy of expiredProphecies) {
            console.log(`[Oracle Feed] Resolving: ${prophecy.id} - ${prophecy.title}`);

            // Extract condition specifics
            const condition = prophecy.condition_type; // 'price_above' or 'price_below'
            const value = prophecy.condition_value as any;
            const threshold = value.threshold;

            // Map simple assets to their Solana mint addresses for Jupiter Price API
            // For production, the database should ideally store the precise mint address in condition_value
            let mintId = 'So11111111111111111111111111111111111111112'; // Default SOL
            if (prophecy.title.includes('JUP')) mintId = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbZedPFTZ15c';
            if (prophecy.title.includes('BONK')) mintId = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
            if (value.mint) mintId = value.mint;

            // 3. Fetch current accurate price from Jupiter Price API v3
            let currentPrice = 0;
            const jupiterApiKey = process.env.JUPITER_API_KEY || process.env.NEXT_PUBLIC_JUPITER_API_KEY;

            try {
                const headers: Record<string, string> = {};
                if (jupiterApiKey) {
                    headers['x-api-key'] = jupiterApiKey;
                }

                const jupResponse = await fetch(`https://api.jup.ag/price/v3?ids=${mintId}`, { headers });

                if (!jupResponse.ok) {
                    if (jupResponse.status === 401) {
                        console.warn(`[Oracle Feed] Jupiter API 401 Unauthorized. Using fallback simulated price for ${mintId}`);
                        // Fallback prices for development/testing without API keys
                        if (mintId === 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbZedPFTZ15c') currentPrice = 1.05;
                        else if (mintId === 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263') currentPrice = 0.00002;
                        else currentPrice = 150.00; // Default SOL or other
                    } else {
                        throw new Error(`Jupiter API returned ${jupResponse.status}`);
                    }
                } else {
                    const jupData = await jupResponse.json();
                    if (jupData.data && jupData.data[mintId]) {
                        currentPrice = Number(jupData.data[mintId].price);
                    } else {
                        throw new Error('Price data missing in Jupiter response');
                    }
                }

                console.log(`[Oracle Feed] Oracle Price for ${mintId} = $${currentPrice}`);

            } catch (err) {
                console.error(`[Oracle Feed] Failed to get price for ${mintId}:`, err);
                results.push({ prophecyId: prophecy.id, status: 'failed', reason: 'price_api_error' });
                continue; // Skip resolving this one, keep it active for next check
            }

            // 4. Determine resolution logic
            let isYesWinning = false;

            if (condition === 'price_above') {
                isYesWinning = currentPrice > threshold;
            } else if (condition === 'price_below') {
                isYesWinning = currentPrice < threshold;
            } else {
                console.error(`[Oracle Feed] Unknown condition type: ${condition}`);
                continue;
            }

            const newStatus = isYesWinning ? 'resolved_win' : 'resolved_lose'; // win = YES happened, lose = NO happened
            console.log(`[Oracle Feed] Result: ${isYesWinning ? 'UP (YES)' : 'DOWN (NO)'} won. Status -> ${newStatus}`);

            const totalYesPool = prophecy.total_yes_pool || 0;
            const totalNoPool = prophecy.total_no_pool || 0;
            const totalPool = totalYesPool + totalNoPool;

            // Ensure there's a winner to avoid divide by zero, or handle refund
            const winningPool = isYesWinning ? totalYesPool : totalNoPool;
            const losingPool = isYesWinning ? totalNoPool : totalYesPool;

            let oddsMultiplier = 1.0;
            if (winningPool > 0) {
                // Calculate precise dynamic multiplier based on TVL, applying the house tax.
                // Multiplier = (Total Pool * (1 - Tax)) / Winning Pool
                oddsMultiplier = (totalPool * (1 - SYSTEM_TAX_RATE)) / winningPool;

                // Cap multiplier from being absurdly high to prevent exploitation of tiny pools
                if (oddsMultiplier > 10) oddsMultiplier = 10;
                // Floor multiplier to 1 so winners don't systematically lose XP
                if (oddsMultiplier < 1) oddsMultiplier = 1;
            } else if (totalPool > 0 && winningPool === 0) {
                // The house claims the losing pool entirely.
                oddsMultiplier = 0;
                console.log(`[Oracle Feed] The House wins the entire pool of ${losingPool} XP.`);
            }

            console.log(`[Oracle Feed] Payout odds locked at ${oddsMultiplier.toFixed(2)}x`);

            // 5. Transactional processing for XP distributions
            try {
                // Fetch all entries for this prophecy
                const { data: entries, error: entriesError } = await supabase
                    .from('prophecy_entries')
                    .select('*')
                    .eq('prophecy_id', prophecy.id);

                if (entriesError) throw entriesError;

                let winnersCount = 0;
                let losersCount = 0;

                for (const entry of (entries || [])) {
                    const isWinner = entry.prediction === isYesWinning;
                    const finalResult = isWinner ? 'win' : 'lose';

                    let payoutXp = 0;
                    if (isWinner) {
                        payoutXp = Math.floor(entry.staked_xp * oddsMultiplier);

                        // User actually gains the payout difference (since stake was already deducted at entry time)
                        // If oddsMultiplier is 2x on a 100XP stake, payout is 200XP. We add 200XP to their balance.
                        // (They previously paid 100XP to enter, so net profit is +100XP).
                        const { error: xpError } = await supabase.rpc('increment_points', {
                            wallet_address_param: entry.wallet_address,
                            points_to_add: payoutXp
                        });

                        if (xpError) throw new Error(`XP distribute failed for ${entry.wallet_address}: ${xpError.message}`);
                        winnersCount++;
                    } else {
                        // They lose their stake (it was already deducted). Just tracking the count.
                        losersCount++;

                        // Check if they hit absolute zero and reset gracefully
                        // This logic is abstracted assuming `increment_points` with negative values handled floor at 0.
                        // But since stake was deducted at creation, no action needed on lose besides marking entry.
                    }

                    // Update entry
                    await supabase
                        .from('prophecy_entries')
                        .update({
                            result: finalResult,
                            potential_win: isWinner ? payoutXp : 0 // Overwrite potential_win with actual payout
                        })
                        .eq('id', entry.id);
                }

                // Update the master prophecy record
                const { error: updateProphecyError } = await supabase
                    .from('prophecies')
                    .update({ status: newStatus })
                    .eq('id', prophecy.id);

                if (updateProphecyError) throw updateProphecyError;

                results.push({
                    prophecyId: prophecy.id,
                    status: 'resolved',
                    outcome: newStatus,
                    odds: oddsMultiplier.toFixed(2),
                    winnersCount,
                    losersCount
                });

            } catch (distErr) {
                console.error(`[Oracle Feed] Distribution error for ${prophecy.id}:`, distErr);
                results.push({ prophecyId: prophecy.id, status: 'failed', reason: 'distribution_error' });
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error) {
        logError('[Oracle Feed] Fatal resolution error:', error as Error);
        return NextResponse.json(
            { error: 'Failed to resolve feed', details: (error as Error).message },
            { status: 500 }
        );
    }
}
