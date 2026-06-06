import { NextResponse } from 'next/server';
import { generateSOW } from '@/backend/sow';
import { supabase } from '@/backend/supabaseClient';

export async function POST(request) {
    try {
        const body = await request.json();
        const { proposalId, clientName, jobTitle, jobDescription, coverLetter, milestones, pricingTiers } = body;

        let finalClientName = clientName;
        let finalJobTitle = jobTitle;
        let finalJobDescription = jobDescription;
        let finalCoverLetter = coverLetter;
        let finalMilestones = milestones;
        let finalPricingTiers = pricingTiers;

        // If a proposal ID is provided, query it from Supabase history
        if (proposalId) {
            console.log(`[API SOW] Fetching proposal history for ID: ${proposalId}...`);
            const { data: proposal, error } = await supabase
                .from('proposals_history')
                .select('*')
                .eq('id', proposalId)
                .single();

            if (error) {
                console.error('[API SOW] Database query error:', error);
            } else if (proposal) {
                finalClientName = proposal.client_name || 'Client';
                finalJobTitle = proposal.job_title || 'Untitled Project';
                finalJobDescription = proposal.job_description || '';
                finalCoverLetter = proposal.generated_proposal || '';
                finalMilestones = proposal.generated_milestones || [];
                
                // Parse strategy brief pricing from the loom script metadata wrapper
                const loomScript = proposal.generated_loom_script;
                if (loomScript && loomScript.trim().startsWith('{')) {
                    try {
                        const meta = JSON.parse(loomScript);
                        finalPricingTiers = meta.strategyBrief?.pricingIntelligence?.tiers || null;
                    } catch (e) {
                        console.warn('[API SOW] Could not parse pricing tiers from loom script:', e);
                    }
                }
            }
        }

        if (!finalJobDescription || !finalCoverLetter) {
            return NextResponse.json({ error: 'Job description and cover letter are required to formulate a Scope of Work.' }, { status: 400 });
        }

        console.log(`[API SOW] Triggering SOW generator for: "${finalJobTitle}"...`);
        const sowMarkdown = await generateSOW({
            clientName: finalClientName || 'Client',
            jobTitle: finalJobTitle || 'Freelance Project',
            jobDescription: finalJobDescription,
            coverLetter: finalCoverLetter,
            milestones: finalMilestones || [],
            pricingTiers: finalPricingTiers
        });

        return NextResponse.json({ sow: sowMarkdown });
    } catch (err) {
        console.error('[API SOW] Server error:', err);
        return NextResponse.json({ error: err.message || 'An error occurred during SOW generation.' }, { status: 500 });
    }
}
