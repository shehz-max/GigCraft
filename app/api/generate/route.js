import { NextResponse } from 'next/server';
import { parseJob } from '@/backend/parser';
import { matchEvidence } from '@/backend/matcher';
import { buildStrategy } from '@/backend/strategist';
import { generateProposal } from '@/backend/generator';
import { critiqueProposal } from '@/backend/critic';
import { supabase } from '@/backend/supabaseClient';

export async function POST(request) {
    try {
        const body = await request.json();
        const { platform, jobDescription, clientReviews, userTone } = body;

        if (!platform || !jobDescription) {
            return NextResponse.json({ error: 'Platform and Job Description are required fields.' }, { status: 400 });
        }

        console.log(`[API Generate] Starting 5-Stage AI Orchestra for ${platform}...`);
        const pipelineStart = Date.now();

        // 1. Stage 1: Deep Parser (Groq)
        const parsedJob = await parseJob(jobDescription, clientReviews || '');
        console.log('[API Generate] Stage 1 Completed: Job parsed.');

        // 2. Match Evidence: Fuzzy Keyword Matching against Portfolios & Case Studies
        const matchedEvidence = await matchEvidence(parsedJob.technicalSkills || []);
        console.log('[API Generate] Semantic evidence matched.');

        // 3. Stage 2: Strategy Architect & Pricing Analyst (Gemini)
        const strategyBrief = await buildStrategy({
            parsedJob,
            matchedEvidence,
            platform,
            jobDescription,
            userTone: userTone || 'Conversational'
        });
        console.log('[API Generate] Stage 2 Completed: Strategy formulated.');

        // 4. Stage 3: Elite Copywriter (Groq - First Pass)
        let generatedPackage = await generateProposal({
            platform,
            jobDescription,
            parsedJob,
            strategyBrief,
            userTone: userTone || 'Conversational'
        });
        console.log('[API Generate] Stage 3 Completed: Cover letter drafted.');

        // 5. Stage 4: Quality Critic (Gemini - First Pass)
        let auditResult = await critiqueProposal({
            coverLetter: generatedPackage.coverLetter,
            parsedJob,
            strategyBrief,
            platform,
            jobDescription
        });
        console.log(`[API Generate] Stage 4 Completed: Initial audit result - ${auditResult.verdict} (Score: ${auditResult.overallScore})`);

        // 6. Refinement Loop: If Critic demands refinement, run Stage 3 & 4 one more time
        if (auditResult.verdict === 'REFINE' && auditResult.issues && auditResult.issues.length > 0) {
            console.log('[API Generate] Critic requested refinement. Initiating Stage 3 copywriter edit loop...');
            
            // Re-draft with issues feedback
            const refinedPackage = await generateProposal({
                platform,
                jobDescription,
                parsedJob,
                strategyBrief,
                userTone: userTone || 'Conversational',
                previousCoverLetter: generatedPackage.coverLetter,
                refinementIssues: auditResult.issues
            });
            console.log('[API Generate] Stage 3 Completed: Cover letter refined.');

            // Re-audit the refined version
            const refinedAudit = await critiqueProposal({
                coverLetter: refinedPackage.coverLetter,
                parsedJob,
                strategyBrief,
                platform,
                jobDescription
            });
            console.log(`[API Generate] Stage 4 Completed: Final audit result - ${refinedAudit.verdict} (Score: ${refinedAudit.overallScore})`);

            // Apply refined values
            generatedPackage.coverLetter = refinedPackage.coverLetter;
            auditResult = refinedAudit;
        }

        // Package all the orchestra metadata to store inside the loom script column (clean, backward-compatible persistence)
        const serializedLoomWithMetadata = JSON.stringify({
            script: generatedPackage.loomScript,
            strategyBrief: strategyBrief,
            qualityScore: auditResult.overallScore,
            criticIssues: auditResult.issues || [],
            bidScore: strategyBrief.bidScore || 0,
            bidVerdict: strategyBrief.bidVerdict || 'STRONG_BID',
            bidReasons: strategyBrief.bidReasons || [],
            parsedJob: parsedJob
        });

        // Extract job title from job description (first line or short summary)
        const jobTitle = jobDescription.split('\n')[0]?.substring(0, 80) || 'Untitled Project';

        // 7. Save to Database History
        const { data: historyItem, error: dbError } = await supabase
            .from('proposals_history')
            .insert({
                platform,
                job_title: jobTitle,
                job_description: jobDescription,
                client_name: parsedJob.clientName || 'there',
                generated_proposal: generatedPackage.coverLetter,
                generated_questions: generatedPackage.screeningAnswers || [],
                generated_loom_script: serializedLoomWithMetadata,
                generated_milestones: generatedPackage.milestones || [],
                status: 'Draft'
            })
            .select()
            .single();

        if (dbError) {
            console.error('[API Generate] Error saving proposal history to database:', dbError);
        }

        console.log(`[API Generate] 5-Stage Orchestra Pipeline completed successfully in ${Date.now() - pipelineStart}ms!`);

        // 8. Return complete response payload
        return NextResponse.json({
            id: historyItem?.id || null,
            parsedJob,
            matchedEvidence,
            strategyBrief,
            auditResult,
            proposal: {
                coverLetter: generatedPackage.coverLetter,
                screeningAnswers: generatedPackage.screeningAnswers || [],
                loomScript: generatedPackage.loomScript,
                milestones: generatedPackage.milestones || [],
                pricingTiers: strategyBrief.pricingIntelligence?.tiers || {
                    basic: { scope: 'N/A', price: 'N/A', delivery: 'N/A' },
                    standard: { scope: 'N/A', price: 'N/A', delivery: 'N/A' },
                    premium: { scope: 'N/A', price: 'N/A', delivery: 'N/A' }
                },
                strategyBrief,
                qualityScore: auditResult.overallScore,
                criticIssues: auditResult.issues || [],
                bidScore: strategyBrief.bidScore || 0,
                bidVerdict: strategyBrief.bidVerdict || 'STRONG_BID',
                bidReasons: strategyBrief.bidReasons || []
            }
        });

    } catch (err) {
        console.error('[API Generate] Server error in generate POST:', err);
        return NextResponse.json({ error: err.message || 'An error occurred during proposal generation.' }, { status: 500 });
    }
}
