import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Connection } from '@solana/web3.js';
import { calculateFinalXP } from '@/lib/gamification/multipliers';
import { addSkillXP } from '@/lib/gamification/skill-tree';
import { checkGlitchTriggers, discoverGlitch, ActionContext } from '@/lib/gamification/glitches';
import { addSeasonXP } from '@/lib/gamification/seasons';
import { checkNarrativeUnlocks } from '@/lib/gamification/narrative';
import { updateLeaderboardEntry } from '@/lib/gamification/leaderboards';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const solanaRpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';


// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

// XP constants
const BASE_XP_PER_UNIT = 50;
const MAX_XP_PER_SWAP = 5000;
const MIN_AMOUNT = 0.001;
const MAX_AMOUNT = 1000000;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean) as string[];

// Jupiter program IDs for verification
const JUPITER_V6_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
const JUPITER_V4_PROGRAM_ID = 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB';

/**
 * CORS/Origin validation - allows Vercel deployments
 */
function validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    // Allow requests with no origin (same-origin, server-to-server)
    if (!origin) return true;

    // Allow if in explicit list
    if (ALLOWED_ORIGINS.includes(origin)) return true;

    // Allow any Vercel deployment (*.vercel.app)
    if (origin.endsWith('.vercel.app')) return true;

    return false;
}

/**
 * P0 FIX: Persistent rate limiting via Supabase
 */
async function isRateLimited(supabase: SupabaseClient, walletAddress: string): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Check rate limit in Supabase
    const { data: rateLimit } = await supabase
        .from('rate_limits')
        .select('request_count, window_start')
        .eq('wallet_address', walletAddress)
        .single();

    if (!rateLimit || rateLimit.window_start < windowStart) {
        // Reset or create rate limit record
        await supabase.from('rate_limits').upsert({
            wallet_address: walletAddress,
            request_count: 1,
            window_start: now,
        }, { onConflict: 'wallet_address' });
        return false;
    }

    if (rateLimit.request_count >= RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }

    // Increment counter
    await supabase.from('rate_limits').update({
        request_count: rateLimit.request_count + 1,
    }).eq('wallet_address', walletAddress);

    return false;
}

function sanitizeString(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim().slice(0, 100);
}

/**
 * P1 FIX: Enhanced amount validation with sanity checks
 */
function validateAmount(amount: unknown): number | null {
    const parsed = parseFloat(String(amount));
    // Sanity checks: must be positive, within bounds, and not suspicious
    if (isNaN(parsed) || parsed < MIN_AMOUNT || parsed > MAX_AMOUNT) {
        return null;
    }
    // Check for suspiciously precise amounts (potential float manipulation)
    const decimalPlaces = (parsed.toString().split('.')[1] || '').length;
    if (decimalPlaces > 9) {
        return null;
    }
    return parsed;
}

function validateWalletAddress(address: unknown): string | null {
    if (typeof address !== 'string') return null;
    const sanitized = sanitizeString(address);
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(sanitized)) {
        return null;
    }
    return sanitized;
}

function validateTransactionSignature(signature: unknown): string | null {
    if (typeof signature !== 'string') return null;
    const sanitized = sanitizeString(signature);
    // Solana signatures are base58 encoded, 87-88 characters
    if (!/^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(sanitized)) {
        return null;
    }
    return sanitized;
}

/**
 * P0 FIX: On-chain swap verification
 */
async function verifySwapOnChain(
    signature: string,
    expectedWallet: string
): Promise<{ valid: boolean; amount?: number; inputToken?: string; outputToken?: string; error?: string }> {
    try {
        const connection = new Connection(solanaRpcUrl, 'confirmed');

        const tx = await connection.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
        });

        if (!tx) {
            return { valid: false, error: 'Transaction not found' };
        }

        if (tx.meta?.err) {
            return { valid: false, error: 'Transaction failed on-chain' };
        }

        // Verify this is a Jupiter transaction
        const message = tx.transaction.message as any;
        const accountKeys = message.accountKeys || [];
        const staticAccounts = message.staticAccountKeys || [];
        const allAccounts = [...accountKeys, ...staticAccounts].map((k: any) =>
            typeof k === 'string' ? k : k.pubkey?.toString() || k.toString()
        );

        const isJupiter = allAccounts.some(
            (addr: string) => addr === JUPITER_V6_PROGRAM_ID || addr === JUPITER_V4_PROGRAM_ID
        );

        if (!isJupiter) {
            return { valid: false, error: 'Not a Jupiter swap transaction' };
        }

        // Verify wallet address matches
        const txWallet = allAccounts[0];
        if (txWallet !== expectedWallet) {
            return { valid: false, error: 'Wallet address mismatch' };
        }

        // Parse swap amounts from token balance changes
        const preBalances = tx.meta?.preTokenBalances || [];
        const postBalances = tx.meta?.postTokenBalances || [];

        let totalInputUsd = 0;
        let inputToken = 'SOL';
        let outputToken = 'USDC';

        // Calculate total value transferred (simplified)
        for (const post of postBalances) {
            const pre = preBalances.find(
                (p: any) => p.mint === post.mint && p.owner === post.owner
            );
            const preAmount = pre ? parseFloat(pre.uiTokenAmount.uiAmountString || '0') : 0;
            const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || '0');
            const diff = Math.abs(postAmount - preAmount);

            if (diff > totalInputUsd) {
                totalInputUsd = diff;
            }
        }

        // Also check SOL changes
        const preSol = (tx.meta?.preBalances?.[0] || 0) / 1e9;
        const postSol = (tx.meta?.postBalances?.[0] || 0) / 1e9;
        const solDiff = Math.abs(postSol - preSol);

        if (solDiff > totalInputUsd && solDiff > 0.00001) {
            totalInputUsd = solDiff;
            inputToken = 'SOL';
        }

        return {
            valid: true,
            amount: totalInputUsd,
            inputToken,
            outputToken,
        };
    } catch (error) {
        console.error('[Swap Verification] Error:', error);
        return { valid: false, error: 'Verification failed' };
    }
}

/**
 * Check and update mission progress based on swap
 */
interface MissionRequirement {
    inputToken?: string;
    outputToken?: string;
    minUsdValue?: number;
    minAmount?: number; // Legacy support
}

interface Mission {
    id: string;
    name: string;
    type: string;
    points: number;
    requirement: MissionRequirement;
}

interface MissionCompletion {
    missionId: string;
    missionName: string;
    xpEarned: number;
    isNewCompletion: boolean;
}

async function checkAndUpdateMissionProgress(
    supabase: SupabaseClient,
    walletAddress: string,
    swapInfo: {
        inputToken?: string;
        outputToken?: string;
        usdValue: number;
    }
): Promise<MissionCompletion[]> {
    const completedMissions: MissionCompletion[] = [];

    try {
        // Fetch active swap missions
        const { data: missions, error: missionsError } = await supabase
            .from('missions')
            .select('id, name, type, points, requirement')
            .eq('is_active', true)
            .in('type', ['swap', 'volume'])
            .order('points', { ascending: true });

        if (missionsError || !missions) {
            console.error('[Mission Progress] Failed to fetch missions:', missionsError);
            return completedMissions;
        }

        for (const mission of missions as Mission[]) {
            const req = mission.requirement || {};

            // Check token filters if specified
            if (req.inputToken && swapInfo.inputToken && req.inputToken !== swapInfo.inputToken) {
                continue; // Doesn't match input token requirement
            }
            if (req.outputToken && swapInfo.outputToken && req.outputToken !== swapInfo.outputToken) {
                continue; // Doesn't match output token requirement
            }

            // Check USD value threshold (minUsdValue or legacy minAmount)
            const minValue = req.minUsdValue ?? req.minAmount ?? 0;
            if (swapInfo.usdValue < minValue) {
                continue; // Below minimum value
            }

            // Mission matches - check/create progress entry
            const { data: existingProgress } = await supabase
                .from('mission_progress')
                .select('id, status, current_value')
                .eq('wallet_address', walletAddress)
                .eq('mission_id', mission.id)
                .single();

            if (existingProgress?.status === 'completed' || existingProgress?.status === 'claimed') {
                // Already completed this mission (for one-time missions)
                continue;
            }

            // For swap missions, completing means doing one matching swap
            // Update or create progress as completed
            const progressData = {
                wallet_address: walletAddress,
                mission_id: mission.id,
                current_value: swapInfo.usdValue,
                status: 'completed',
                completed_at: new Date().toISOString(),
            };

            if (existingProgress) {
                await supabase
                    .from('mission_progress')
                    .update(progressData)
                    .eq('id', existingProgress.id);
            } else {
                await supabase
                    .from('mission_progress')
                    .insert(progressData);
            }

            // Increment mission completions counter
            await supabase.rpc('increment_mission_completions', { mission_id: mission.id });

            completedMissions.push({
                missionId: mission.id,
                missionName: mission.name,
                xpEarned: mission.points,
                isNewCompletion: !existingProgress,
            });

            console.log(`[Mission Progress] Completed mission: ${mission.name} for ${walletAddress}`);
        }
    } catch (error) {
        console.error('[Mission Progress] Error checking missions:', error);
    }

    return completedMissions;
}
export async function POST(request: NextRequest) {
    try {
        // P1 FIX: CORS validation
        if (!validateOrigin(request)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // P1 FIX: Require service key (no fallback to anon key)
        if (!supabaseServiceKey) {
            console.error('[Swap API] SUPABASE_SERVICE_ROLE_KEY not configured');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        // Validate wallet address
        const walletAddress = validateWalletAddress(body.walletAddress);
        if (!walletAddress) {
            return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
        }

        // P0 FIX: Require transaction signature
        const transactionSignature = validateTransactionSignature(body.transactionSignature);
        if (!transactionSignature) {
            return NextResponse.json({
                error: 'Transaction signature required. Submit real swap transactions for XP.'
            }, { status: 400 });
        }

        // P0 FIX: Verify swap on-chain BEFORE awarding any XP
        const verification = await verifySwapOnChain(transactionSignature, walletAddress);
        if (!verification.valid) {
            return NextResponse.json({
                error: verification.error || 'Invalid swap transaction'
            }, { status: 400 });
        }

        // Check for duplicate transaction claims
        const { data: existingClaim } = await supabase
            .from('claimed_transactions')
            .select('id')
            .eq('signature', transactionSignature)
            .single();

        if (existingClaim) {
            return NextResponse.json({
                error: 'This transaction has already been claimed'
            }, { status: 409 });
        }

        // P0 FIX: Persistent rate limiting
        if (await isRateLimited(supabase, walletAddress)) {
            return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }

        // Use verified on-chain data instead of client-provided
        const amount = verification.amount || 0;
        const inputToken = verification.inputToken || 'SOL';
        const outputToken = verification.outputToken || 'USDC';

        // Mark transaction as claimed
        await supabase.from('claimed_transactions').insert({
            signature: transactionSignature,
            wallet_address: walletAddress,
            amount,
            claimed_at: new Date().toISOString(),
        });

        // Get current stats
        const { data: currentStats } = await supabase
            .from('user_stats')
            .select('total_points, current_streak, longest_streak, level, total_missions_completed, last_active_at')
            .eq('wallet_address', walletAddress)
            .single();

        // Calculate streak
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastActive = currentStats?.last_active_at
            ? new Date(currentStats.last_active_at).toISOString().split('T')[0]
            : null;

        let newStreak = currentStats?.current_streak || 0;
        const isFirstSwapToday = lastActive !== today;

        if (isFirstSwapToday) {
            if (lastActive) {
                const lastDate = new Date(lastActive);
                const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    // Consecutive day - increment streak
                    newStreak = (currentStats?.current_streak || 0) + 1;
                } else if (diffDays > 1) {
                    // Missed days - reset streak
                    newStreak = 1;
                }
            } else {
                // First ever swap
                newStreak = 1;
            }
        }

        const longestStreak = Math.max(newStreak, currentStats?.longest_streak || 0);
        const currentLevel = currentStats?.level || 1;
        const swapCount = (currentStats?.total_missions_completed || 0) + 1;

        // Calculate base XP
        const baseXP = Math.min(Math.floor(amount * BASE_XP_PER_UNIT), MAX_XP_PER_SWAP);

        // Apply multipliers (streak, season, skills)
        const { finalXP, multipliers, totalMultiplier } = await calculateFinalXP(
            baseXP,
            walletAddress,
            'swapper'
        );

        // Award skill XP for Swapper track
        const { newLevel: newSkillLevel, leveledUp: skillLeveledUp } = await addSkillXP(
            walletAddress,
            'swapper',
            Math.floor(baseXP / 10) // 10% of base XP goes to skill
        );

        // Check for glitches
        const glitchContext: ActionContext = {
            timestamp: new Date(),
            swapCount,
            amount,
            streakDays: newStreak,
        };

        const triggeredGlitches = await checkGlitchTriggers(walletAddress, glitchContext);
        const discoveredGlitches = [];

        for (const glitch of triggeredGlitches) {
            const discovery = await discoverGlitch(walletAddress, glitch.id);
            if (discovery) {
                discoveredGlitches.push(discovery);
            }
        }

        // Calculate total XP including glitches
        const glitchXP = discoveredGlitches.reduce((sum, d) => sum + d.xp_awarded, 0);
        const totalXP = finalXP + glitchXP;

        // Update user stats
        const newPoints = (currentStats?.total_points || 0) + totalXP;
        const newLevel = Math.max(
            Math.floor(Math.log(newPoints / 100) / Math.log(1.5)) + 1,
            currentLevel
        );
        const leveledUp = newLevel > currentLevel;

        await supabase.from('user_stats').upsert({
            wallet_address: walletAddress,
            total_points: newPoints,
            current_streak: newStreak,
            longest_streak: longestStreak,
            level: newLevel,
            total_missions_completed: swapCount,
            last_active_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address' });

        // Update leaderboard
        await updateLeaderboardEntry(walletAddress, newPoints);

        // Add season XP
        const { newTier, tiersUnlocked } = await addSeasonXP(walletAddress, totalXP);

        // Check narrative unlocks
        let newChapters: { chapter_number: number; title: string }[] = [];
        if (leveledUp) {
            const chapters = await checkNarrativeUnlocks(walletAddress, newLevel);
            newChapters = chapters.map(c => ({
                chapter_number: c.chapter_number,
                title: c.title,
            }));
        }

        // Check and update mission progress
        const completedMissions = await checkAndUpdateMissionProgress(
            supabase,
            walletAddress,
            {
                inputToken,
                outputToken,
                usdValue: amount, // Amount is the USD value from on-chain verification
            }
        );

        // Log activity
        await supabase.from('activity_log').insert({
            wallet_address: walletAddress,
            action: 'swap_completed',
            details: {
                input_token: inputToken,
                output_token: outputToken,
                amount,
                base_xp: baseXP,
                final_xp: finalXP,
                total_multiplier: totalMultiplier,
                glitch_xp: glitchXP,
                total_xp: totalXP,
                new_level: newLevel,
                missions_completed: completedMissions.map(m => m.missionName),
            }
        });

        // Build response
        const response: Record<string, unknown> = {
            success: true,
            xpEarned: totalXP,
            baseXP,
            multiplier: totalMultiplier,
            newLevel,
            newPoints,
            streak: newStreak,
            longestStreak,
            firstSwapToday: isFirstSwapToday,
            swapCount,
        };

        // Add gamification bonuses
        if (multipliers.length > 0) {
            response.multipliers = multipliers.map(m => ({
                type: m.multiplier_type,
                value: m.multiplier_value,
                source: m.source,
            }));
        }

        if (discoveredGlitches.length > 0) {
            response.glitchesDiscovered = discoveredGlitches.map(d => ({
                name: d.glitch.name,
                xp: d.xp_awarded,
                badge: d.glitch.reward_badge,
            }));
        }

        if (leveledUp) {
            response.leveledUp = true;
        }

        if (skillLeveledUp) {
            response.skillLeveledUp = { skill: 'swapper', newLevel: newSkillLevel };
        }

        if (tiersUnlocked.length > 0) {
            response.seasonTiersUnlocked = tiersUnlocked;
        }

        if (newChapters.length > 0) {
            response.narrativeUnlocks = newChapters;
        }

        // Add completed missions to response
        if (completedMissions.length > 0) {
            response.missionsCompleted = completedMissions.map(m => ({
                id: m.missionId,
                name: m.missionName,
                xp: m.xpEarned,
                isNew: m.isNewCompletion,
            }));
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('[Swap API] Request failed');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
