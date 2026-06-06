import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key on backend to bypass RLS (if needed), else fallback to anon key
const keyToUse = (typeof window === 'undefined' && supabaseServiceKey) ? supabaseServiceKey : supabaseAnonKey;

if (!supabaseUrl || !keyToUse) {
    console.error('Missing Supabase configuration in environment variables.');
}

export const supabase = createClient(supabaseUrl, keyToUse);
