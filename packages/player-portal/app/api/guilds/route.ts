import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/guilds - List all guilds
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('guilds')
            .select(`
                *,
                guild_members (
                    wallet_address,
                    role,
                    xp_contributed
                )
            `)
            .order('total_xp', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json({ guilds: data });
    } catch (error) {
        console.error('Error fetching guilds:', error);
        return NextResponse.json(
            { error: 'Failed to fetch guilds' },
            { status: 500 }
        );
    }
}

// POST /api/guilds - Create a new guild
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, leaderWallet } = body;

        if (!name || !leaderWallet) {
            return NextResponse.json(
                { error: 'Missing required fields: name, leaderWallet' },
                { status: 400 }
            );
        }

        // Check if user is already in a guild
        const { data: existingMember } = await supabase
            .from('guild_members')
            .select('guild_id')
            .eq('wallet_address', leaderWallet)
            .single();

        if (existingMember) {
            return NextResponse.json(
                { error: 'You are already in a guild. Leave your current guild first.' },
                { status: 400 }
            );
        }

        // Create the guild
        const { data: guild, error: guildError } = await supabase
            .from('guilds')
            .insert({
                name,
                description,
                leader_wallet: leaderWallet,
            })
            .select()
            .single();

        if (guildError) {
            if (guildError.code === '23505') {
                return NextResponse.json(
                    { error: 'Guild name already taken' },
                    { status: 400 }
                );
            }
            throw guildError;
        }

        // Add leader as first member
        const { error: memberError } = await supabase
            .from('guild_members')
            .insert({
                guild_id: guild.id,
                wallet_address: leaderWallet,
                role: 'leader',
            });

        if (memberError) throw memberError;

        return NextResponse.json({ guild }, { status: 201 });
    } catch (error) {
        console.error('Error creating guild:', error);
        return NextResponse.json(
            { error: 'Failed to create guild' },
            { status: 500 }
        );
    }
}

export const dynamic = 'force-dynamic';
