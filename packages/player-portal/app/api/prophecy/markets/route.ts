import { NextResponse } from 'next/server';

export const revalidate = 60; // Cache for 1 minute

export async function GET() {
    try {
        // Fetch live Crypto markets from Polymarket
        const cryptoRes = await fetch(
            'https://gamma-api.polymarket.com/events?tag_id=21&active=true&closed=false&limit=10&order=volume&ascending=false'
        );
        // Fetch live Sports markets for variety
        const sportsRes = await fetch(
            'https://gamma-api.polymarket.com/events?tag_id=6&active=true&closed=false&limit=5'
        );

        if (!cryptoRes.ok || !sportsRes.ok) {
            throw new Error(`Polymarket API error: ${cryptoRes.status} / ${sportsRes.status}`);
        }

        const cryptoData = await cryptoRes.json();
        const sportsData = await sportsRes.json();

        const allEvents = [...(cryptoData || []), ...(sportsData || [])];

        // Map to our card format
        const markets = allEvents.map((event: any) => {
            if (!event.markets || event.markets.length === 0) return null;
            const market = event.markets[0];

            let yesProb = 0.5;
            let noProb = 0.5;

            try {
                // outcomePrices can be a JSON string like "[\"0.135\", \"0.865\"]" or already an array
                let prices = market.outcomePrices;
                if (typeof prices === 'string') {
                    prices = JSON.parse(prices);
                }
                if (Array.isArray(prices) && prices.length >= 2) {
                    yesProb = parseFloat(prices[0]) || 0.5;
                    noProb = parseFloat(prices[1]) || 0.5;
                }
            } catch (e) { }

            return {
                id: market.id || event.id,
                event_id: event.id,
                question: market.question || event.title,
                yes_probability: yesProb,
                no_probability: noProb,
                volume: parseFloat(market.volume || '0'),
                end_date: market.endDate,
                source: "polymarket"
            };
        }).filter(Boolean);

        return NextResponse.json(markets);
    } catch (error) {
        console.error('Prophecy markets fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch prediction markets' },
            { status: 500 }
        );
    }
}
