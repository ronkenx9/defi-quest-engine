import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/guilds/[id] - Get guild details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: guild, error } = await supabase
            .from('guilds')
            .select(`
                *,
                guild_members (
                    wallet_address,
                    role,
                    xp_contributed,
                    joined_at
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!guild) {
            return NextResponse.json({ error: 'Guild not found' }, { status: 404 });
        }

        return NextResponse.json({ guild });
    } catch (error) {
        console.error('Error fetching guild:', error);
        return NextResponse.json(
            { error: 'Failed to fetch guild' },
            { status: 500 }
        );
    }
}

// POST /api/guilds/[id] - Join guild
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { walletAddress } = body;

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing walletAddress' },
                { status: 400 }
            );
        }

        // Check if user is already in a guild
        const { data: existingMember } = await supabase
            .from('guild_members')
            .select('guild_id')
            .eq('wallet_address', walletAddress)
            .single();

        if (existingMember) {
            return NextResponse.json(
                { error: 'You are already in a guild. Leave your current guild first.' },
                { status: 400 }
            );
        }

        // Join the guild
        const { error: joinError } = await supabase
            .from('guild_members')
            .insert({
                guild_id: id,
                wallet_address: walletAddress,
                role: 'member',
            });

        if (joinError) throw joinError;

        // Update member count
        await supabase.rpc('increment_guild_member_count', { guild_id: id });

        return NextResponse.json({ success: true, message: 'Joined guild successfully' });
    } catch (error) {
        console.error('Error joining guild:', error);
        return NextResponse.json(
            { error: 'Failed to join guild' },
            { status: 500 }
        );
    }
}

// DELETE /api/guilds/[id] - Leave guild
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Missing wallet parameter' },
                { status: 400 }
            );
        }

        // Check if user is the leader
        const { data: guild } = await supabase
            .from('guilds')
            .select('leader_wallet')
            .eq('id', id)
            .single();

        if (guild?.leader_wallet === walletAddress) {
            return NextResponse.json(
                { error: 'Leaders cannot leave. Transfer leadership or disband the guild.' },
                { status: 400 }
            );
        }

        // Leave the guild
        const { error } = await supabase
            .from('guild_members')
            .delete()
            .eq('guild_id', id)
            .eq('wallet_address', walletAddress);

        if (error) throw error;

        // Decrement member count
        await supabase.rpc('decrement_guild_member_count', { guild_id: id });

        return NextResponse.json({ success: true, message: 'Left guild successfully' });
    } catch (error) {
        console.error('Error leaving guild:', error);
        return NextResponse.json(
            { error: 'Failed to leave guild' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
