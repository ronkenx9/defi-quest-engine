import { NextRequest, NextResponse } from 'next/server';

// Jupiter Quote API proxy
// Updated to use new api.jup.ag endpoint (quote-api.jup.ag is deprecated Jan 31, 2026)

const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '';

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
        // Use new Jupiter API endpoint (api.jup.ag) with fallback to old endpoint
        const jupiterUrl = JUPITER_API_KEY
            ? `https://api.jup.ag/swap/v1/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(amount)}&slippageBps=${encodeURIComponent(slippageBps)}`
            : `https://quote-api.jup.ag/v6/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(amount)}&slippageBps=${encodeURIComponent(slippageBps)}`;

        console.log('[Quote API] Fetching:', jupiterUrl.split('?')[0]);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        // Add API key if available (required for new api.jup.ag)
        if (JUPITER_API_KEY) {
            headers['x-api-key'] = JUPITER_API_KEY;
        }

        const response = await fetch(jupiterUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Quote API] Jupiter error:', response.status, errorText);

            // If using new API and it fails, try fallback to old API
            if (JUPITER_API_KEY && response.status === 401) {
                console.log('[Quote API] API key may be invalid, falling back to legacy endpoint');
                const fallbackUrl = `https://quote-api.jup.ag/v6/quote?inputMint=${encodeURIComponent(inputMint)}&outputMint=${encodeURIComponent(outputMint)}&amount=${encodeURIComponent(amount)}&slippageBps=${encodeURIComponent(slippageBps)}`;
                const fallbackResponse = await fetch(fallbackUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-store',
                });
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    return NextResponse.json(fallbackData, {
                        headers: {
                            'Access-Control-Allow-Origin': '*',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                        },
                    });
                }
            }

            return NextResponse.json(
                { error: `Jupiter API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log('[Quote API] Success, outAmount:', data.outAmount);

        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[Quote API] Fetch error:', error);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            errorMessage = error.name === 'AbortError'
                ? 'Request timed out after 30 seconds'
                : error.message;
        }

        return NextResponse.json(
            { error: 'Failed to fetch quote from Jupiter', details: errorMessage },
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

