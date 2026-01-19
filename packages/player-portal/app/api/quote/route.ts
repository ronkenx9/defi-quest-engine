import { NextRequest, NextResponse } from 'next/server';

// Jupiter Quote API proxy to avoid CORS issues
// This proxies the quote request from the client through our server

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const inputMint = searchParams.get('inputMint');
    const outputMint = searchParams.get('outputMint');
    const amount = searchParams.get('amount');
    const slippageBps = searchParams.get('slippageBps') || '50';

    if (!inputMint || !outputMint || !amount) {
        return NextResponse.json(
            { error: 'Missing required parameters: inputMint, outputMint, amount' },
            { status: 400 }
        );
    }

    try {
        const jupiterUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;

        const response = await fetch(jupiterUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Always fetch fresh data
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Jupiter API error:', response.status, errorText);
            return NextResponse.json(
                { error: `Jupiter API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return with CORS headers
        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'public, max-age=10', // Cache for 10 seconds
            },
        });
    } catch (error) {
        console.error('Quote fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to fetch quote from Jupiter', details: errorMessage },
            { status: 500 }
        );
    }
}

// Force dynamic to avoid static generation issues
export const dynamic = 'force-dynamic';
