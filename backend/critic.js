import { geminiGenerate } from './geminiClient.js';

/**
 * Stage 4: Quality Critic
 * Audits the generated cover letter against Knowledge Base rules, scoring multiple dimensions.
 * Returns a PASS/REFINE verdict and detailed improvement tasks for the Copywriter.
 * @param {object} params
 * @param {string} params.coverLetter - Generated proposal cover letter text
 * @param {object} params.parsedJob - Output of Stage 1 parser
 * @param {object} params.strategyBrief - Output of Stage 2 strategist
 * @param {string} params.platform - Target job platform
 * @param {string} params.jobDescription - Raw job description
 * @returns {Promise<object>} Audit report containing scores, issues, and verdict
 */
export async function critiqueProposal({ coverLetter, parsedJob, strategyBrief, platform, jobDescription }) {
    console.log('[Stage 4: Quality Critic] Commencing quality audit...');
    const startTime = Date.now();

    const systemPrompt = `You are the Lead Quality Critic at GigCraft, an elite freelance consultancy. Your job is to strictly audit proposal cover letters against our strict performance guidelines.

Evaluate the cover letter on these 9 dimensions (score each 1 to 10):
1. hookQuality: Does it immediately start with a technical insight or bottleneck? Any greeting (e.g., 'Hi', 'Hello') or self-introduction (e.g., 'My name is', 'I am a developer') yields a score of 3 or lower.
2. painPointDepth: Does it explain the business consequences (lost sales, downtime) rather than just repeating tasks?
3. evidenceIntegration: Are specific portfolio items or case studies mentioned alongside real metrics (percentages, hours saved)?
4. antiAiNaturalness: Does it sound human? Banned words list: 'cutting-edge', 'game-changing', 'tailored', 'leverage', 'excellence', 'passionate', 'streamline', 'delighted', 'dive', 'tapestry', 'moreover', 'essentially', 'look no further', 'testament', 'innovative', 'seamlessly'. If any of these are present, score is 4 or lower.
5. ctaEffectiveness: Is the Call to Action a low-friction, choice-based binary question?
6. platformCompliance: Does it fit platform-specific length requirements? (Upwork: 140-200 words, Freelancer: 110-160 words, Fiverr: 80-130, Guru: 130-180). If any markdown formatting like bolding (**text**), headers (#), or bullet list tags are used, score is 4 or lower.
7. hiddenInstructionCompliance: If the job description required a check-phrase, password, or direct action, did the proposal include it? (If no hidden instruction, score 10).
8. pricingRealism: Are the recommended rates and pricing tiers appropriate for the complexity?
9. technicalDepth: Does the proposal use specific technical terms and methodology instead of generic guarantees?

You MUST respond with a raw JSON object ONLY matching this EXACT schema:
{
  "scores": {
    "hookQuality": 0,
    "painPointDepth": 0,
    "evidenceIntegration": 0,
    "antiAiNaturalness": 0,
    "ctaEffectiveness": 0,
    "platformCompliance": 0,
    "hiddenInstructionCompliance": 0,
    "pricingRealism": 0,
    "technicalDepth": 0
  },
  "overallScore": 0,
  "issues": ["List of specific, actionable instructions to fix weaknesses in the text. E.g., 'Rewrite first line: remove \"Hi there,\" and lead directly with connection pool diagnosis.'"],
  "verdict": "PASS or REFINE"
}

## CRITICAL SCORING RULES:
- If the first sentence contains any greeting (e.g. "Hi", "Hello", "Dear") or introduces the writer (e.g. "My name is...", "I am a senior...") -> hookQuality MUST be 3 or lower.
- If any banned words ("cutting-edge", "game-changing", "tailored", "leverage", "dive", "tapestry", "moreover", "essentially", "look no further", "testament", etc.) are present -> antiAiNaturalness MUST be 4 or lower.
- If there are graphical emojis or markdown text decorations (**bold**, # headers) -> platformCompliance MUST be 4 or lower.
- overallScore is the average of the 9 scores.
- If overallScore >= 7.0 AND all individual scores are >= 5 -> verdict is "PASS".
- Otherwise -> verdict is "REFINE".

Output ONLY valid JSON. No markdown formatting.`;

    const userPrompt = `TARGET PLATFORM: ${platform}
HIDDEN INSTRUCTIONS EXPECTED: ${parsedJob.hiddenInstructions || 'None'}

ORIGINAL JOB DESCRIPTION:
${jobDescription}

STRATEGY BRIEF SUMMARY:
${JSON.stringify({
    hookStrategy: strategyBrief.hookStrategy,
    painToSolutionMap: strategyBrief.painToSolutionMap,
    microValue: strategyBrief.microValue,
    pricingTiers: strategyBrief.pricingIntelligence?.tiers
}, null, 2)}

GENERATED COVER LETTER TO AUDIT:
--------------------------------------------------
${coverLetter}
--------------------------------------------------`;

    try {
        const audit = await geminiGenerate({
            systemPrompt,
            userPrompt,
            temperature: 0.2, // Low temperature for consistent, strict grading
            jsonMode: true
        });

        console.log(`[Stage 4: Quality Critic] Audit finished. Score: ${audit.overallScore}, Verdict: ${audit.verdict}, Issues: ${audit.issues?.length || 0}`);
        return audit;
    } catch (error) {
        console.error('[Stage 4: Quality Critic] Error during audit:', error);
        throw error;
    }
}
