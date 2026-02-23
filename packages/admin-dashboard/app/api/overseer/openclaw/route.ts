import { NextRequest, NextResponse } from 'next/server';

// Note: If openclaw-sdk is not published on npm, this will need to be provided locally 
// or replaced with a raw WebSocket/fetch connection to ws://127.0.0.1:18789
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetWallet = "test_wallet_123", token = "SOL" } = body;

        // Try importing openclaw-node, fallback to mock if unavailable during build
        let claw: any;
        try {
            // @ts-ignore
            const openclawNode = await import(/* webpackIgnore: true */ "openclaw-node");
            const Client = openclawNode.OpenClawClient || openclawNode.Client;
            claw = new Client({ url: "ws://127.0.0.1:18789" });
            console.log(`[OpenClaw] Connected to local OpenClaw socket process`);
        } catch (e) {
            console.warn('[OpenClaw warning] openclaw-node not found locally. Ensure it is installed or running.');
            return NextResponse.json({
                error: 'OpenClaw SDK not installed. Please install it to use this endpoint.',
                details: String(e)
            }, { status: 500 });
        }

        console.log(`[OpenClaw] Dispatching Agent 'overseer' for ${targetWallet}...`);

        // Connect to the local OpenClaw socket process
        const result = await claw.runAgent("overseer", {
            wallet_address: targetWallet,
            token: token
        });

        return NextResponse.json({
            success: true,
            agent_result: result,
            reasoning: "Generated autonomously via DeepSeek V3.2 & OpenClaw."
        });

    } catch (error: any) {
        console.error('[OpenClaw Error]', error);
        return NextResponse.json({ error: 'OpenClaw Agent Failed', details: error.message }, { status: 500 });
    }
}
