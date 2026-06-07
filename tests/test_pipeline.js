import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Static imports removed to allow dotenv.config to load first (ESM hoisting workaround)

const sampleJobDescription = `
WordPress / WooCommerce Checkout Page Slow & Crashing
We run a high-traffic Shopify-alternative WooCommerce store selling custom items.
During traffic spikes, the checkout page takes over 5 seconds to load and often throws transactional database errors or crashes.
We are losing about 20% of cart conversions due to this friction.
We use PostgreSQL (AWS RDS) as the backend store, with a custom Node.js microservice syncing inventory to Shopify.
Need a senior engineer who has done database migrations and checkout performance optimizations.
Prove you read this by starting your proposal with the word 'Strawberry'.
Include answers to these questions:
1. What profiling tools would you use to trace this latency?
2. How do you handle database write locks during spike loads?
`;

const sampleReviews = `
"Great job, Muhammad Umer did a fantastic work rebuilding our API!" - Review from client
"Very skilled Next.js and backend engineer, highly recommended" - Review from client
`;

async function runTest() {
    console.log('--- Starting 5-Stage Orchestra Local Test ---');
    try {
        // Dynamically import backend modules after dotenv config has completed
        const { parseJob } = await import('../backend/parser.js');
        const { matchEvidence } = await import('../backend/matcher.js');
        const { buildStrategy } = await import('../backend/strategist.js');
        const { generateProposal } = await import('../backend/generator.js');
        const { critiqueProposal } = await import('../backend/critic.js');

        // 1. Stage 1: Parse
        console.log('\n[Stage 1: Parsing Job Posting]');
        const parsedJob = await parseJob(sampleJobDescription, sampleReviews);
        console.log(JSON.stringify(parsedJob, null, 2));

        // 2. Match Evidence
        console.log('\n[Matching Semantic Evidence]');
        const matchedEvidence = await matchEvidence(parsedJob.technicalSkills || []);
        console.log(`Matched ${matchedEvidence.matchedPortfolios.length} portfolio items and ${matchedEvidence.matchedCaseStudies.length} case studies.`);

        // 3. Stage 2: Strategy
        console.log('\n[Stage 2: Strategy formulation]');
        const strategyBrief = await buildStrategy({
            parsedJob,
            matchedEvidence,
            platform: 'Upwork',
            jobDescription: sampleJobDescription,
            userTone: 'Conversational'
        });
        console.log(JSON.stringify(strategyBrief, null, 2));

        // 4. Stage 3: Copywrite
        console.log('\n[Stage 3: Drafting Cover Letter]');
        let generatedPackage = await generateProposal({
            platform: 'Upwork',
            jobDescription: sampleJobDescription,
            parsedJob,
            strategyBrief,
            userTone: 'Conversational'
        });
        console.log('\n--- DRAFT COVER LETTER ---');
        console.log(generatedPackage.coverLetter);
        console.log('---------------------------');

        // 5. Stage 4: Critique
        console.log('\n[Stage 4: Quality Audit]');
        let auditResult = await critiqueProposal({
            coverLetter: generatedPackage.coverLetter,
            parsedJob,
            strategyBrief,
            platform: 'Upwork',
            jobDescription: sampleJobDescription
        });
        console.log(JSON.stringify(auditResult, null, 2));

        // 6. Refinement loop if needed
        if (auditResult.verdict === 'REFINE' && auditResult.issues?.length > 0) {
            console.log('\n[Initiating Stage 3 Refinement Loop]');
            const refinedPackage = await generateProposal({
                platform: 'Upwork',
                jobDescription: sampleJobDescription,
                parsedJob,
                strategyBrief,
                userTone: 'Conversational',
                previousCoverLetter: generatedPackage.coverLetter,
                refinementIssues: auditResult.issues
            });
            console.log('\n--- REFINED COVER LETTER ---');
            console.log(refinedPackage.coverLetter);
            console.log('-----------------------------');

            const refinedAudit = await critiqueProposal({
                coverLetter: refinedPackage.coverLetter,
                parsedJob,
                strategyBrief,
                platform: 'Upwork',
                jobDescription: sampleJobDescription
            });
            console.log(JSON.stringify(refinedAudit, null, 2));
        }

        console.log('\n--- Test Completed Successfully! ---');
    } catch (err) {
        console.error('Test crashed:', err);
    }
}

runTest();
