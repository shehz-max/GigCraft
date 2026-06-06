import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groq = null;
if (apiKey) {
    groq = new Groq({ apiKey });
}

/**
 * Stage 1: Deep Parser — Extracts rich structured parameters from job descriptions
 * Runs on Groq for speed. Extracts pain points with business impact, budget analysis,
 * client personality, urgency, competition hints, red flags, and project complexity.
 * @param {string} jobDescription - Raw job description text
 * @param {string} clientReviews - Paste of past reviews/history (optional)
 * @returns {Promise<object>} Deeply structured parsed job parameters
 */
export async function parseJob(jobDescription, clientReviews = '') {
    if (!groq) {
        throw new Error('Groq API Key is not configured in environment variables.');
    }

    const systemPrompt = `You are DeepScan, an elite NLP analyst specializing in freelance job post intelligence extraction. Your job is to perform a DEEP analysis of a freelance job description and optional client reviews to extract every possible signal for proposal customization.

You MUST respond with a raw JSON object ONLY, matching this EXACT schema:
{
  "clientName": "Extracted client name from reviews or 'there' if not found",
  "painPoints": [
    {
      "symptom": "What the client literally described (e.g., 'website is slow')",
      "rootCause": "Your educated guess at the technical root cause (e.g., 'unoptimized database queries or missing CDN')",
      "businessImpact": "The business consequence (e.g., 'likely losing 10-20% of visitors to bounce, costing ~$X/month in lost revenue')"
    }
  ],
  "technicalSkills": ["Array of technical skills, libraries, frameworks, or tools required"],
  "toneStyle": "Client's writing style: Formal, Casual, Highly Technical, Urgent, Friendly",
  "hiddenInstructions": "Any hidden instructions, passwords, or check-phrases (e.g. 'start proposal with blue'), or null if none",
  "screeningQuestions": ["Array of explicit screening questions found in the text, or empty array if none"],
  "budgetAnalysis": {
    "min": null,
    "max": null,
    "type": "fixed or hourly or not_specified",
    "isRealistic": true,
    "reasoning": "Why this budget is or isn't realistic for the described scope"
  },
  "clientPersonality": {
    "formality": "formal or casual or mixed",
    "technicalDepth": "technical or non-technical or semi-technical",
    "decisionStyle": "decisive or exploratory or uncertain",
    "writingMirrorGuide": "Brief instruction on how to mirror their communication style"
  },
  "urgencyLevel": {
    "score": 3,
    "signals": ["List of urgency indicators found"],
    "reasoning": "Why this urgency score"
  },
  "competitionHints": ["Extracted clues about past freelancer failures or what went wrong before"],
  "redFlags": ["Array of client red flags: haggler, ghost, scope_creep, off_platform_payment, unrealistic_deadline, vague_requirements"],
  "projectComplexity": "simple or moderate or complex or enterprise",
  "estimatedHours": {
    "min": 0,
    "max": 0,
    "reasoning": "Brief explanation of hour estimate"
  }
}

## Extraction Guidelines:

### Client Name
Deeply scan the client reviews/history text. Look for patterns like "John was great", "Umer did an excellent job", "thanks to David". Extract the name of the person who POSTED the job.

### Pain Points (CRITICAL — be specific)
- Do NOT just list tasks. Identify the real BUSINESS PROBLEM.
- "Fix my scraper" → { symptom: "scraper blocked by Cloudflare", rootCause: "TLS fingerprint detection on requests-based scraper", businessImpact: "product catalog is stale — can't track competitor pricing changes" }
- "Redesign my website" → { symptom: "outdated website design", rootCause: "likely built 3-5 years ago with no mobile responsiveness", businessImpact: "losing mobile visitors (60%+ of traffic) → lower conversion rate" }
- Always quantify impact where possible (lost sales, wasted hours, security risk).

### Hidden Instructions
Look VERY carefully for phrases like: "start your bid with the word strawberry", "prove you read this by telling me 5+3", "mention red in your cover letter", "include the phrase 'I read everything'". These are CRITICAL — missing them = instant rejection.

### Budget Analysis
- Extract any mentioned budget range ($500-$1000, $25/hr, "budget is flexible")
- If no budget mentioned, set type to "not_specified" and estimate what's realistic
- Compare scope vs budget: a $50 budget for a full React app rebuild = unrealistic

### Client Personality
- Formal: "Dear developers, I require...", "Please provide your qualifications"
- Casual: "Hey! Need someone to fix my site", "looking for a cool dev"
- Technical: mentions specific tools, frameworks, error codes
- Non-technical: describes symptoms without technical terms

### Urgency
- Score 1: No deadline mentioned, exploratory
- Score 2: "No rush", "when you have time"
- Score 3: Standard project timeline (1-4 weeks)
- Score 4: "Need this done quickly", specific near deadline
- Score 5: "ASAP", "urgent", "needed yesterday", deadline < 3 days

### Red Flags (from our Knowledge Base)
- haggler: "can you do it for less?", extremely low budget for scope
- ghost: 0 hires despite many posted jobs
- scope_creep: "and other tasks as needed", vague open-ended requirements
- off_platform_payment: "pay via PayPal directly", "let's discuss on Telegram"
- unrealistic_deadline: massive scope + 2-day deadline
- vague_requirements: no clear deliverables, just "make it better"

### Project Complexity
- simple: bug fix, small script, single-page change (1-10 hours)
- moderate: feature addition, API integration, small app (10-40 hours)
- complex: full app build, major refactor, multi-system integration (40-120 hours)
- enterprise: large-scale system, team project, compliance requirements (120+ hours)

You must output ONLY valid JSON. No markdown code blocks, no explanations.`;

    const userPrompt = `JOB DESCRIPTION:\n${jobDescription}\n\nCLIENT REVIEWS / HISTORY:\n${clientReviews || 'No reviews provided.'}`;

    try {
        console.log('[Stage 1: Deep Parser] Starting analysis...');
        const startTime = Date.now();

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: model,
            temperature: 0.15, // Low temperature for precise parsing
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0]?.message?.content;
        const parsed = JSON.parse(responseContent);

        console.log(`[Stage 1: Deep Parser] Completed in ${Date.now() - startTime}ms`);
        return parsed;
    } catch (error) {
        console.error('[Stage 1: Deep Parser] Error:', error);
        throw error;
    }
}
