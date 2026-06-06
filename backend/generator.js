import Groq from 'groq-sdk';
import { supabase } from './supabaseClient.js';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groq = null;
if (apiKey) {
    groq = new Groq({ apiKey });
}

/**
 * Stage 3: Elite Copywriter
 * Generates the cover letter, milestones, screening answers, and Loom script
 * by translating the Strategy Architect's brief into high-converting copy.
 * Supports a Refinement mode to process feedback from the Stage 4 Critic.
 * @param {object} params
 * @param {string} params.platform - Target job platform (Upwork, Freelancer, etc.)
 * @param {string} params.jobDescription - Raw job post description
 * @param {object} params.parsedJob - Parsed parameters from Stage 1 Deep Parser
 * @param {object} params.strategyBrief - Strategic brief from Stage 2 Strategy Architect
 * @param {string} [params.userTone='Conversational'] - Writing tone
 * @param {string} [params.previousCoverLetter=null] - Previous draft (if in refinement retry mode)
 * @param {string[]} [params.refinementIssues=null] - Critic feedback issues (if in refinement retry mode)
 * @returns {Promise<object>} Generated proposal elements
 */
export async function generateProposal({
    platform,
    jobDescription,
    parsedJob,
    strategyBrief,
    userTone = 'Conversational',
    previousCoverLetter = null,
    refinementIssues = null
}) {
    if (!groq) {
        throw new Error('Groq API Key is not configured in environment variables.');
    }

    console.log(`[Stage 3: Elite Copywriter] Generating proposal (Refinement mode: ${!!refinementIssues})...`);
    const startTime = Date.now();

    // Fetch platform-specific few-shot examples from Supabase for anchor context
    let fewShotContext = '';
    try {
        const { data: fewShot } = await supabase
            .from('few_shot_proposals')
            .select('*')
            .eq('platform', platform)
            .eq('status', 'Won')
            .limit(2);

        if (fewShot && fewShot.length > 0) {
            fewShotContext = 'PAST WINNING PROPOSAL EXAMPLES FOR THIS PLATFORM:\n';
            fewShot.forEach((example, index) => {
                fewShotContext += `Example #${index + 1}:\nJob Post: ${example.job_description}\nProposal Sent: ${example.proposal}\n\n`;
            });
        }
    } catch (err) {
        console.error('[Stage 3: Elite Copywriter] Failed to load few-shot examples:', err);
    }

    // Platform-Specific Guidelines (from our Knowledge Base)
    let platformGuidelines = '';
    const platformLower = platform.toLowerCase();
    if (platformLower === 'upwork') {
        platformGuidelines = `
- **LENGTH**: Strict target of 140-200 words.
- **THE HOOK (First 2 Lines)**: Do NOT use formal greetings (like "Dear Hiring Manager") or introduce yourself by name (e.g. "Hi, I am..."). Start immediately with the technical hook addressing their issue.
- **STRUCTURE**: Follow the P.A.C.E. framework:
  1. Problem: Technical bottleneck & business impact.
  2. Authority: Weave in proof from matched evidence with metrics.
  3. Custom Execution: 3-step technical roadmap.
  4. Call to Action (CTA): Low-friction, choice-based binary question.
- **EMOJIS**: Ban all emojis. Spacing and plain text punctuation only.
- **FORMATTING**: Plain text only. No Unicode bold/italics.
`;
    } else if (platformLower === 'freelancer') {
        platformGuidelines = `
- **LENGTH**: Target 110-160 words.
- **THE HOOK**: Direct, technical, and solution-focused.
- **STRUCTURE**:
  1. Hook: Call out the likely root cause and business impact.
  2. Authority: Refer to similar projects with metrics.
  3. Custom Execution: Brief 3-step action roadmap.
  4. Call to Action (CTA): Low-friction binary question.
- **COMPETITION**: Sound highly professional, technical, and human to stand out from spam bots.
`;
    } else if (platformLower === 'fiverr') {
        platformGuidelines = `
- **LENGTH**: Target 80-130 words.
- **STRUCTURE**: Focus on fast turnaround speed, exact deliverables, pricing transparency, and low-friction next steps.
`;
    } else if (platformLower === 'guru' || platformLower === 'peopleperhour') {
        platformGuidelines = `
- **LENGTH**: Target 130-180 words.
- **STRUCTURE**: Detailed Action Plan split into phases, referencing relevant portfolio items, and ending with a binary CTA.
`;
    } else {
        platformGuidelines = `
- **LENGTH**: Target 120-170 words.
- **STRUCTURE**: Technical hook, evidence integration with metrics, 3-step roadmap, low-friction binary CTA.
`;
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (previousCoverLetter && refinementIssues && refinementIssues.length > 0) {
        // REFINEMENT MODE
        systemPrompt = `You are GigCraft, an elite copyeditor. Your job is to take a draft proposal cover letter and refine it to resolve specific quality issues flagged by our lead critic.

You MUST adjust the text to satisfy the following critique issues:
${refinementIssues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

Guidelines for Refinement:
1. Preserve the good elements of the previous draft (methods, portfolio metrics, structure).
2. DO NOT introduce any banned words: "cutting-edge", "game-changing", "tailored solution", "excellence", "leverage", "passionate", "streamline".
3. Keep the target length for ${platform}: ${platformGuidelines}
4. You MUST respond with a raw JSON object ONLY, matching this EXACT schema:
{
  "coverLetter": "The revised cover letter, incorporating changes to resolve the critique issues while retaining all structural components."
}

Output ONLY valid JSON. No explanations, no markdown blocks.`;

        userPrompt = `PREVIOUS DRAFT:
--------------------------------------------------
${previousCoverLetter}
--------------------------------------------------

CRITIQUE ISSUES TO ADDRESS:
${refinementIssues.join(' | ')}`;

    } else {
        // INITIAL GENERATION MODE
        systemPrompt = `You are GigCraft, an elite B2B freelance proposal copywriter. Your goal is to write a highly customized, irresistible freelance pitch using a structured strategy brief.

You MUST translate the provided Strategy Brief into the final copy. Do not invent your own strategy; follow the instructions in the brief.

You MUST respond with a raw JSON object ONLY, matching this EXACT schema:
{
  "coverLetter": "The generated cover letter text, properly structured with line breaks",
  "screeningAnswers": [
    {
      "question": "Question text",
      "answer": "Tailored answer using Direct-Answer + STAR methodology"
    }
  ],
  "loomScript": "Custom 60-second video script addressing the client name, problem, and CTA",
  "milestones": [
    {
      "phase": "Phase Name (e.g. Phase 1: Sandbox Audit)",
      "description": "Brief description of phase deliverables",
      "pricePercentage": 30
    }
  ]
}

Rules for Generation:
1. Anti-AI Style: Write like a real, confident human. Alternate sentence lengths. Use contractions (I'll, doesn't, we've). BAN words like "cutting-edge", "game-changing", "tailored solution", "excellence", "leverage", "passionate", "streamline", "delighted".
2. Follow Hook Strategy: Execute the exact opening hook strategy outlined in the Strategy Brief. No introductory fluff ("My name is...").
3. Follow Pain-to-Solution Map: Structure the core body of the letter around the pains, business impacts, proposed fixes, and portfolio proofs listed in the Strategy Brief.
4. Integrate Evidence: Weave in the exact metrics (percentages, hours saved) and tools from the referenced portfolios.
5. Micro-Value: Seamlessly integrate the free micro-value insight from the Strategy Brief into the letter to build reciprocity.
6. CTA: Close with a low-friction binary choice CTA (e.g. "Do you have 5 minutes to discuss if we should use brightdata or local proxies for this?").
7. Screening Answers: If questions are found, answer them. First sentence answers directly, then show STAR methodology proof.

Platform: ${platform}
Writing Tone: ${userTone}

${platformGuidelines}
${fewShotContext}`;

        userPrompt = `STRATEGY BRIEF:
${JSON.stringify(strategyBrief, null, 2)}

RAW JOB DESCRIPTION:
${jobDescription}

JOB PARAMETERS:
Client Name: ${parsedJob.clientName || 'there'}
Pain Points: ${JSON.stringify(parsedJob.painPoints)}
Technical Skills Required: ${parsedJob.technicalSkills?.join(', ')}
Hidden Instructions: ${parsedJob.hiddenInstructions || 'None'}
Screening Questions Found: ${parsedJob.screeningQuestions?.join(' | ')}`;
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: model,
            temperature: previousCoverLetter ? 0.4 : 0.7, // Lower temperature for precision refinement
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0]?.message?.content;
        const parsed = JSON.parse(responseContent);

        console.log(`[Stage 3: Elite Copywriter] Completed in ${Date.now() - startTime}ms`);
        return parsed;
    } catch (error) {
        console.error('[Stage 3: Elite Copywriter] Error generating/refining proposal:', error);
        throw error;
    }
}
