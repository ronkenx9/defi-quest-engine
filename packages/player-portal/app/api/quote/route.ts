import { NextRequest, NextResponse } from 'next/server';
import { JupiterClient } from '@defi-quest/core';
import { Connection } from '@solana/web3.js';

const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const jupClient = new JupiterClient({
    connection: new Connection(SOLANA_RPC),
});

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const inputMint = searchParams.get('inputMint');
    const outputMint = searchParams.get('outputMint');
    const amount = searchParams.get('amount');
    const slippageBps = parseInt(searchParams.get('slippageBps') || '50');

    if (!inputMint || !outputMint || !amount) {
        return NextResponse.json(
            { error: 'Missing required parameters: inputMint, outputMint, amount' },
            { status: 400 }
        );
    }

    try {
        console.log('[Quote API V6] Fetching quote for:', { inputMint, outputMint, amount });

        const quote = await jupClient.getQuote({
            inputMint,
            outputMint,
            amount,
            slippageBps,
        });

        return NextResponse.json(quote, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[Quote API V6] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

