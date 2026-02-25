import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/profile/mint
 * 
 * Mints a PlayerProfileNFT for a new user and stores the address.
 * Falls back gracefully if Metaplex minting fails (no funded keypair).
 */
export async function POST(request: NextRequest) {
    try {
        const { walletAddress, username } = await request.json();

        if (!walletAddress || !username) {
            return NextResponse.json(
                { error: 'walletAddress and username are required' },
                { status: 400 }
            );
        }

        // Check if user already has a profile
        const { data: existing } = await supabase
            .from('user_stats')
            .select('profile_nft_address, wallet_address')
            .eq('wallet_address', walletAddress)
            .single();

        if (existing?.profile_nft_address) {
            return NextResponse.json({
                profileNftAddress: existing.profile_nft_address,
                message: 'Profile already exists',
            });
        }

        // Try to mint profile NFT via Metaplex Core
        let profileNftAddress: string | null = null;

        try {
            const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
            const { PlayerProfileNFT } = await import('@defi-quest/core');
            const profileSystem = new PlayerProfileNFT(rpcUrl);

            console.log('[ProfileMint] Attempting on-chain mint for:', walletAddress);
            const nftPubkey = await profileSystem.mintProfile(walletAddress, username);
            profileNftAddress = nftPubkey.toString();
            console.log('[ProfileMint] Successfully minted NFT:', profileNftAddress);
        } catch (mintError: any) {
            // Check if it's an "insufficient funds" or "no authority" error
            const errorMsg = mintError.message || String(mintError);
            if (errorMsg.includes('Attempt to debit an account but found no record of a prior credit')) {
                console.warn('[ProfileMint] On-chain mint failed: Authority wallet has no SOL.');
            } else if (errorMsg.includes('ANCHOR_AUTHORITY_KEYPAIR not set')) {
                console.warn('[ProfileMint] On-chain mint skipped: Authority keypair not configured.');
            } else {
                console.error('[ProfileMint] Metaplex mint error:', mintError);
            }
        }

        // Fetch existing stats to preserve points/xp if user already exists
        const { data: currentStats } = await supabase
            .from('user_stats')
            .select('total_points, total_xp, current_streak, level, total_missions_completed')
            .eq('wallet_address', walletAddress)
            .single();

        // Safe update: only change username and profile NFT, preserve existing progress
        const { error: upsertError } = await supabase
            .from('user_stats')
            .upsert({
                wallet_address: walletAddress,
                username,
                profile_nft_address: profileNftAddress,
                // Preserve existing or use defaults
                total_points: currentStats?.total_points ?? 0,
                total_xp: currentStats?.total_xp ?? 0,
                current_streak: currentStats?.current_streak ?? 0,
                level: currentStats?.level ?? 1,
                total_missions_completed: currentStats?.total_missions_completed ?? 0,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'wallet_address' });

        if (upsertError) {
            console.error('[ProfileMint] Supabase upsert error:', upsertError);
        }

        return NextResponse.json({
            profileNftAddress,
            username,
            message: profileNftAddress
                ? 'Profile NFT minted successfully'
                : 'Profile created (on-chain NFT pending)',
        });
    } catch (error) {
        console.error('[ProfileMint] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create profile' },
            { status: 500 }
        );
    }
}
