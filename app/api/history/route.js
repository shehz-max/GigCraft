import { NextResponse } from 'next/server';
import { supabase } from '@/backend/supabaseClient';

export async function GET() {
    try {
        const { data, error } = await supabase
            .from('proposals_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading history:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (err) {
        console.error('Server error in history GET:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'ID and Status are required fields.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('proposals_history')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating history status:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('Server error in history PATCH:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required.' }, { status: 400 });
        }

        const { error } = await supabase
            .from('proposals_history')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting proposal:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Server error in history DELETE:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
