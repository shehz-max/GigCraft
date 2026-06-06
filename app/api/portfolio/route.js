import { NextResponse } from 'next/server';
import { supabase } from '@/backend/supabaseClient';

export async function GET() {
    try {
        const { data: portfolios, error: portError } = await supabase
            .from('portfolio_items')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: cases, error: caseError } = await supabase
            .from('case_studies')
            .select('*')
            .order('created_at', { ascending: false });

        if (portError) console.error('Error loading portfolios:', portError);
        if (caseError) console.error('Error loading case studies:', caseError);

        return NextResponse.json({
            portfolios: portfolios || [],
            caseStudies: cases || []
        });
    } catch (err) {
        console.error('Server error in portfolio GET:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { type, title, description, technologies, link, metrics, problem, solution, result } = body;

        // Split technologies text into an array if it comes as a string
        let techArray = [];
        if (typeof technologies === 'string') {
            techArray = technologies.split(',').map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(technologies)) {
            techArray = technologies;
        }

        if (type === 'case_study') {
            const { data, error } = await supabase
                .from('case_studies')
                .insert({
                    title,
                    problem,
                    solution,
                    result,
                    technologies: techArray
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ type: 'case_study', data });
        } else {
            const { data, error } = await supabase
                .from('portfolio_items')
                .insert({
                    title,
                    description,
                    technologies: techArray,
                    link,
                    metrics
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ type: 'portfolio', data });
        }
    } catch (err) {
        console.error('Server error in portfolio POST:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
