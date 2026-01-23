import { NextRequest, NextResponse } from 'next/server';

// Jupiter Swap Transaction API proxy
// Updated to use new api.jup.ag endpoint (quote-api.jup.ag is deprecated Jan 31, 2026)

const JUPITER_API_KEY = process.env.JUPITER_API_KEY || '';

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

        // Use new Jupiter API endpoint with fallback to old endpoint
        const swapUrl = JUPITER_API_KEY
            ? 'https://api.jup.ag/swap/v1/swap'
            : 'https://quote-api.jup.ag/v6/swap';

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (JUPITER_API_KEY) {
            headers['x-api-key'] = JUPITER_API_KEY;
        }

        const response = await fetch(swapUrl, {
            method: 'POST',
            headers,
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

            // Fallback to legacy endpoint if new API fails with 401
            if (JUPITER_API_KEY && response.status === 401) {
                const fallbackResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
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
                if (fallbackResponse.ok) {
                    const fallbackData = await fallbackResponse.json();
                    return NextResponse.json(fallbackData);
                }
            }

            return NextResponse.json(
                { error: `Jupiter Swap API error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: 'Failed to create swap transaction', details: errorMessage },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
