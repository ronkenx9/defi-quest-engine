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
        const jupiterUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(amount)}&slippageBps=${encodeURIComponent(slippageBps)}`;

        console.log('Fetching Jupiter quote:', jupiterUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(jupiterUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'DeFi-Quest-Engine/1.0',
            },
            signal: controller.signal,
            // Next.js 15+ fetch options
            next: { revalidate: 0 }, // No caching
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Jupiter API error:', response.status, errorText);
            return NextResponse.json(
                { error: `Jupiter API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();

        console.log('Jupiter quote received:', data.outAmount ? 'success' : 'no outAmount');

        // Return with CORS headers
        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'public, max-age=10',
            },
        });
    } catch (error) {
        console.error('Quote fetch error:', error);

        // More detailed error handling
        let errorMessage = 'Unknown error';
        let errorName = 'Error';

        if (error instanceof Error) {
            errorMessage = error.message;
            errorName = error.name;

            // Check for abort/timeout
            if (error.name === 'AbortError') {
                errorMessage = 'Request timed out after 15 seconds';
            }
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch quote from Jupiter',
                details: errorMessage,
                type: errorName
            },
            { status: 500 }
        );
    }
}

// Handle preflight requests
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

// Force dynamic to avoid static generation issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Use Node.js runtime (not Edge)
