import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const apiKey = process.env.JUPITER_API_KEY;

        if (!apiKey) {
            console.error('JUPITER_API_KEY is not defined in the environment variables.');
            return NextResponse.json({ error: 'Internal Server Error: Missing API Key' }, { status: 500 });
        }

        // Fetch trending crypto events including nested markets
        const response = await fetch(
            'https://api.jup.ag/prediction/v1/events?' + new URLSearchParams({
                category: 'crypto',
                filter: 'trending',
                includeMarkets: 'true',
            }),
            {
                headers: {
                    'x-api-key': apiKey,
                },
                // Revalidate cache relatively often to keep prediction data fresh
                next: { revalidate: 60 }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Jupiter API Error (${response.status}):`, errorText);
            return NextResponse.json({ error: 'Failed to fetch prediction data from Jupiter' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching Jupiter prediction events:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
