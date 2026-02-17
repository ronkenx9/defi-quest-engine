import { NextRequest, NextResponse } from 'next/server';
import { JupiterClient } from '@defi-quest/core';
import { Connection } from '@solana/web3.js';

const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const jupClient = new JupiterClient({
    connection: new Connection(SOLANA_RPC),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { quoteResponse, userPublicKey, wrapAndUnwrapSol = true } = body;

        if (!quoteResponse || !userPublicKey) {
            return NextResponse.json(
                { error: 'Missing required parameters: quoteResponse, userPublicKey' },
                { status: 400 }
            );
        }

        console.log('[Swap TX API V6] Creating swap transaction for:', userPublicKey);

        const swapTransaction = await jupClient.getSwapTransaction({
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol,
        });

        return NextResponse.json({ swapTransaction });
    } catch (error) {
        console.error('[Swap TX API V6] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create swap transaction', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';

