/**
 * DeFi Quest Engine — Authority Keypair Utility
 * 
 * Creates a Umi-compatible keypair identity from the ANCHOR_AUTHORITY_KEYPAIR
 * environment variable. This single keypair is the authority for:
 * - PlayerProfileNFT (mint + update)
 * - EvolvingBadge (evolution updates)
 * - CoreBadgeMinter (badge creation)
 *
 * The env var is a JSON array of secret key bytes, e.g.:
 * ANCHOR_AUTHORITY_KEYPAIR=[123,45,67,...]
 */

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { keypairIdentity } from '@metaplex-foundation/umi';
import type { Umi, Keypair as UmiKeypair } from '@metaplex-foundation/umi';
import { mplCore } from '@metaplex-foundation/mpl-core';

/**
 * Parse the authority keypair from environment variable.
 * Returns null if the env var is not set or is invalid.
 */
export function getAuthorityKeypairBytes(): Uint8Array | null {
    const raw = process.env.ANCHOR_AUTHORITY_KEYPAIR;
    if (!raw) {
        console.warn('[Authority] ANCHOR_AUTHORITY_KEYPAIR not set — on-chain writes will be skipped');
        return null;
    }

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length < 32) {
            console.error('[Authority] ANCHOR_AUTHORITY_KEYPAIR must be a JSON array of >= 32 bytes');
            return null;
        }
        return new Uint8Array(parsed);
    } catch (e) {
        console.error('[Authority] Failed to parse ANCHOR_AUTHORITY_KEYPAIR:', e);
        return null;
    }
}

/**
 * Attach the authority keypair identity to a Umi instance.
 * Returns true if successful, false if keypair is not available.
 */
export function attachAuthorityToUmi(umi: Umi): boolean {
    const secretKey = getAuthorityKeypairBytes();
    if (!secretKey) return false;

    try {
        const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
        umi.use(keypairIdentity(keypair));
        console.log('[Authority] Authority keypair attached:', keypair.publicKey.toString().slice(0, 8) + '...');
        return true;
    } catch (e) {
        console.error('[Authority] Failed to create keypair from bytes:', e);
        return false;
    }
}

/**
 * Create a Umi instance with the authority keypair already attached.
 * Falls back to a generated signer if no authority keypair is available.
 */
export function createAuthorizedUmi(rpcUrl: string): { umi: Umi; hasAuthority: boolean } {
    const umi = createUmi(rpcUrl).use(mplCore());
    const hasAuthority = attachAuthorityToUmi(umi);

    if (!hasAuthority) {
        // Fall back to generated signer (won't have funds but prevents crashes)
        const { generateSigner, keypairIdentity: kiFunc } = require('@metaplex-foundation/umi');
        const fallback = generateSigner(umi);
        umi.use(kiFunc(fallback));
    }

    return { umi, hasAuthority };
}
