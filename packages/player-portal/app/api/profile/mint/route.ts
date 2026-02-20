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
            const nftPubkey = await profileSystem.mintProfile(walletAddress, username);
            profileNftAddress = nftPubkey.toString();
            console.log('[ProfileMint] Minted NFT:', profileNftAddress);
        } catch (mintError) {
            // Metaplex minting may fail if no funded authority keypair is configured.
            // This is expected in hackathon demo mode — we proceed without on-chain NFT.
            console.warn('[ProfileMint] On-chain mint skipped (no funded keypair):', mintError);
        }

        // Upsert user_stats with username and optional NFT address
        const { error: upsertError } = await supabase
            .from('user_stats')
            .upsert({
                wallet_address: walletAddress,
                username,
                profile_nft_address: profileNftAddress,
                total_points: 0,
                current_streak: 0,
                level: 1,
                total_missions_completed: 0,
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
