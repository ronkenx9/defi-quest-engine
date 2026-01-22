import { NextRequest, NextResponse } from 'next/server';

// Jupiter Swap Transaction API proxy
// Creates a swap transaction from a quote

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

        const response = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 'auto',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Jupiter Swap API error:', response.status, errorText);
            return NextResponse.json(
                { error: `Jupiter Swap API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Swap transaction error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to create swap transaction', details: errorMessage },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
