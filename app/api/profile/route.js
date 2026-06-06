import { NextResponse } from 'next/server';
import { supabase } from '@/backend/supabaseClient';

export async function GET() {
    try {
        // Query profile for ID '1' (default personal profile)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', '1')
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error loading profile:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Return empty structure if profile not found yet
        return NextResponse.json(data || { id: '1', name: '', headline: '', base_rate: 0, bio: '', tone: 'Conversational' });
    } catch (err) {
        console.error('Server error in profile GET:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, headline, base_rate, bio, tone } = body;

        const { data, error } = await supabase
            .from('profiles')
            .upsert({
                id: '1',
                name,
                headline,
                base_rate,
                bio,
                tone,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving profile:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error('Server error in profile POST:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
