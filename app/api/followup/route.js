import { NextResponse } from 'next/server';
import { generateFollowUp } from '@/backend/followup';

export async function POST(request) {
    try {
        const body = await request.json();
        const { clientName, jobDescription, coverLetter, followUpType } = body;

        if (!jobDescription || !coverLetter || !followUpType) {
            return NextResponse.json({ error: 'Job Description, Cover Letter, and Follow-Up Type are required fields.' }, { status: 400 });
        }

        console.log(`[API Follow-Up] Generating ${followUpType} follow-up...`);
        const message = await generateFollowUp({
            clientName: clientName || 'there',
            jobDescription,
            coverLetter,
            followUpType
        });

        return NextResponse.json({ message });
    } catch (err) {
        console.error('[API Follow-Up] Server error:', err);
        return NextResponse.json({ error: err.message || 'An error occurred during follow-up generation.' }, { status: 500 });
    }
}
