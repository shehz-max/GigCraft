import { geminiGenerate } from './geminiClient.js';

/**
 * Stage 5: SOW (Scope of Work) Generator
 * Auto-generates a comprehensive Scope of Work document in markdown format.
 * Runs on Gemini for deep compliance structure and clear business layouts.
 * @param {object} params
 * @param {string} params.clientName - Client name
 * @param {string} params.jobTitle - Project title
 * @param {string} params.jobDescription - Original job description
 * @param {string} params.coverLetter - Original cover letter text
 * @param {array} params.milestones - Milestones phase array
 * @param {object} [params.pricingTiers=null] - Optional standard tier pricing
 * @returns {Promise<string>} Beautifully formatted Scope of Work markdown document
 */
export async function generateSOW({ clientName, jobTitle, jobDescription, coverLetter, milestones, pricingTiers }) {
    console.log(`[SOW Generator] Generating Scope of Work for project: "${jobTitle}"...`);
    const startTime = Date.now();

    const systemPrompt = `You are a professional B2B IT project manager. Your job is to draft a comprehensive, legally clear, and highly organized Scope of Work (SOW) document based on a freelance project details and milestones.

Your output MUST be a beautifully formatted Markdown document only. Do NOT output any conversational wrapper text. Start directly with the document title '# SCOPE OF WORK'.

The SOW should include the following standard professional sections:
1. Document Header: Title, Client Name, Date (default to Current), and Project Name.
2. Project Overview & Objectives: Synthesized business objective (e.g. rebuild dashboard for latency reduction, solve Cloudflare bypass).
3. Detailed Deliverables & Phases: Break down the milestones into clear phases. For each phase, list:
   - Phase Name
   - Clear technical deliverables (what is explicitly included, e.g. virtualization, pagination, charts setup)
   - Estimated timeline
   - Suggested payment release percentage / amount
4. Out of Scope: Explicitly state what is NOT included in this project (e.g., third-party API subscription costs, custom graphics, features not listed in Section 3). This protects against scope creep.
5. Client Responsibilities: What the client must provide (e.g. API credentials, Supabase sandbox access, prompt feedback within 24 hours).
6. Terms & Conditions: Revision limits (typically 2 rounds per phase), payment release timeline, communication channel SLA (e.g., Slack, Upwork messages).
7. Sign-off block: Structured approval lines for both client and developer.

Ensure the document is structured professionally, using tables for milestones and bullet points for lists. Make it look ready to be exported as a PDF or signed immediately.`;

    const userPrompt = `CLIENT: ${clientName}
PROJECT TITLE: ${jobTitle}
RAW JOB DESCRIPTION:
${jobDescription}

PROPOSAL COVER LETTER:
----------------------------------
${coverLetter}
----------------------------------

MILESTONES SUMMARY:
${JSON.stringify(milestones, null, 2)}

PRICING TIERS context:
${JSON.stringify(pricingTiers, null, 2)}`;

    try {
        const markdown = await geminiGenerate({
            systemPrompt,
            userPrompt,
            temperature: 0.3, // Low temperature for high structure
            jsonMode: false // We want raw markdown text, not JSON
        });

        console.log(`[SOW Generator] Completed in ${Date.now() - startTime}ms`);
        return markdown;
    } catch (error) {
        console.error('[SOW Generator] Error generating Scope of Work:', error);
        throw error;
    }
}
