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
            headers: {
                'Accept': 'application/json',
            },
            // Use cache for 10 seconds to reduce API calls
            next: { revalidate: 10 }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Jupiter API error:', response.status, errorText);
            return NextResponse.json(
                { error: `Jupiter API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Quote fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quote from Jupiter' },
            { status: 500 }
        );
    }
}
