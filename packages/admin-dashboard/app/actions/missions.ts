'use server';

import { createClient } from '@supabase/supabase-js';
import type { CreateMissionInput, Mission, UpdateMissionInput } from '@/lib/supabase-services';

// Server-side supabase client with service role key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function createMissionAction(input: CreateMissionInput): Promise<{ data?: Mission, error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('missions')
        .insert([{
            name: input.name,
            description: input.description || '',
            type: input.type,
            difficulty: input.difficulty,
            points: input.points,
            reset_cycle: input.reset_cycle || 'none',
            requirement: input.requirement || {},
            is_active: input.is_active ?? true,
        }])
        .select()
        .single();

    if (error) {
        console.error('[Action/CreateMission] Error:', error);
        return { error: error.message };
    }
    return { data };
}

export async function updateMissionAction(id: string, input: UpdateMissionInput): Promise<{ data?: Mission, error?: string }> {
    const { data, error } = await supabaseAdmin
        .from('missions')
        .update({
            ...input,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[Action/UpdateMission] Error:', error);
        return { error: error.message };
    }
    return { data };
}

export async function toggleMissionAction(id: string): Promise<{ data?: Mission, error?: string }> {
    // First get current status
    const { data: current, error: fetchError } = await supabaseAdmin
        .from('missions')
        .select('is_active')
        .eq('id', id)
        .single();

    if (fetchError) {
        console.error('[Action/ToggleMission] Fetch Error:', fetchError);
        return { error: fetchError.message };
    }

    // Toggle it
    const { data, error } = await supabaseAdmin
        .from('missions')
        .update({
            is_active: !current.is_active,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[Action/ToggleMission] Update Error:', error);
        return { error: error.message };
    }
    return { data };
}

export async function deleteMissionAction(id: string): Promise<{ success: boolean, error?: string }> {
    const { error } = await supabaseAdmin
        .from('missions')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[Action/DeleteMission] Error:', error);
        return { success: false, error: error.message };
    }
    return { success: true };
}
