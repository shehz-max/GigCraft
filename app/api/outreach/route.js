import { NextResponse } from 'next/server';
import { generateOutreach } from '@/backend/outreach';

export async function POST(request) {
    try {
        const body = await request.json();
        const { prospectName, companyName, prospectPain, portfolioContext } = body;

        if (!prospectName || !companyName || !prospectPain) {
            return NextResponse.json({ error: 'Prospect Name, Company Name, and Pain Point are required fields.' }, { status: 400 });
        }

        console.log(`[API Outreach] Generating outreach package for ${prospectName} at ${companyName}...`);
        const outreach = await generateOutreach({
            prospectName,
            companyName,
            prospectPain,
            portfolioContext: portfolioContext || ''
        });

        return NextResponse.json(outreach);
    } catch (err) {
        console.error('[API Outreach] Server error:', err);
        return NextResponse.json({ error: err.message || 'An error occurred during outreach generation.' }, { status: 500 });
    }
}
