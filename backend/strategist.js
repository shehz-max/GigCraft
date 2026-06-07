import { geminiGenerate } from './geminiClient.js';
import { supabase } from './supabaseClient.js';

/**
 * Stage 2: Strategy Architect + Pricing Analyst
 * Takes parsed job info and matched portfolios/case studies, queries profiles for base rates,
 * and calls Gemini to construct an elite bid strategy, pricing tiers, and a pre-flight bid recommendation.
 * @param {object} params
 * @param {object} params.parsedJob - Output of Stage 1 parser
 * @param {object} params.matchedEvidence - Output of matcher
 * @param {string} params.platform - Target platform (Upwork, Freelancer, Fiverr, etc.)
 * @param {string} params.jobDescription - Original job description
 * @param {string} params.userTone - User chosen tone (Conversational, Highly Technical, Urgent, Friendly, Formal)
 * @returns {Promise<object>} Detailed proposal strategy and pricing brief
 */
export async function buildStrategy({ parsedJob, matchedEvidence, platform, jobDescription, userTone }) {
    console.log('[Stage 2: Strategy Architect] Starting strategy formulation...');
    const startTime = Date.now();

    let userBaseRate = 45; // Default fallback
    let userName = 'Freelancer';

    try {
        // Fetch user profile (id='1' for single-tenant local database)
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', '1')
            .single();

        if (error) {
            console.error('[Stage 2: Strategy Architect] Error fetching profile:', error);
        } else if (profile) {
            userBaseRate = profile.base_rate || 45;
            userName = profile.name || 'Freelancer';
        }
    } catch (dbErr) {
        console.error('[Stage 2: Strategy Architect] DB query crashed:', dbErr);
    }

    // Prepare portfolio and case studies context for the strategy LLM
    let evidenceContext = 'RELEVANT PORTFOLIO ITEMS:\n';
    matchedEvidence.matchedPortfolios.forEach((item, index) => {
        evidenceContext += `[Portfolio #${index + 1}]: ${item.title}\nDescription: ${item.description}\nTech Stack: ${item.technologies?.join(', ')}\nLink: ${item.link || 'N/A'}\nMetrics/Results: ${item.metrics || 'N/A'}\n\n`;
    });

    evidenceContext += 'RELEVANT CASE STUDIES:\n';
    matchedEvidence.matchedCaseStudies.forEach((item, index) => {
        evidenceContext += `[Case Study #${index + 1}]: ${item.title}\nProblem: ${item.problem}\nSolution: ${item.solution}\nResult: ${item.result}\nTech Stack: ${item.technologies?.join(', ')}\n\n`;
    });

    const systemPrompt = `You are a world-class IT Business Development Strategist and Pricing Analyst. Your job is to analyze a parsed freelance job description, relevant portfolio items/case studies, the freelancer's profile details, and the target platform to formulate an elite proposal strategy and market-accurate pricing tiers.

You MUST respond with a raw JSON object ONLY matching this EXACT schema:
{
  "hookStrategy": "A detailed strategy on how to write the opening hook. Focus on the core technical diagnosis, stack-guessing, or pain identification. Ban generic greetings.",
  "painToSolutionMap": [
    {
      "pain": "The identified client pain point/symptom",
      "businessImpact": "The business implication (e.g. money lost, time wasted, security threat)",
      "proposedFix": "Exact technical methodology to resolve it, detailing tools/libraries",
      "evidenceToUse": "Title of the specific portfolio item or case study to weave in as proof"
    }
  ],
  "technicalRoadmap": [
    "Step 1: Phase name & exact technical action (e.g., Run database index auditing using pg_stat_activity)",
    "Step 2: Phase name & exact technical action (e.g., Implement Redis cache layering for checkout query response caching)",
    "Step 3: Phase name & exact technical action (e.g., Set up automated performance load-testing script using k6)"
  ],
  "differentiators": ["2-3 specific ways our bid will stand out from 50 competing spam proposals (e.g., custom diagnostic checklist, daily status updates dashboard, custom post-launch sandbox)"],
  "toneCalibration": "Instructions on how to write the cover letter using a specific writing tone, matching the client's personality (e.g. mirror their brief style, explain jargon using analogies, use high-octane technical terms)",
  "microValue": "A free quick-win, audit suggestion, or minor optimization recommendation related to their job that we will include to trigger reciprocity (e.g. 'I noticed your page is missing WebP compression; switching images could shave off 1.5s')",
  "pricingIntelligence": {
    "clientBudget": {
      "min": 0,
      "max": 0,
      "type": "fixed or hourly or not_specified"
    },
    "marketRate": {
      "low": 0,
      "median": 0,
      "high": 0,
      "reasoning": "Reasoning behind the market rates for this platform and tech stack"
    },
    "recommendedBid": 0,
    "bidReasoning": "Why this specific bid price or hourly rate is recommended based on client budget, job complexity, developer base rate, and platform norms",
    "tiers": {
      "basic": {
        "scope": "Minimal viable scope to solve the core problem (budget-conscious)",
        "price": "Exact suggested price or hourly rate (e.g., '$200' or '$35/hr')",
        "delivery": "Estimated delivery time (e.g., '3 days')"
      },
      "standard": {
        "scope": "Recommended scope. Solves the problem completely + basic testing & optimization",
        "price": "Exact price or hourly rate",
        "delivery": "Estimated delivery time"
      },
      "premium": {
        "scope": "Elite scope. Full package + automated testing + 30 days post-launch support & documentation",
        "price": "Exact price or hourly rate",
        "delivery": "Estimated delivery time"
      }
    }
  },
  "bidScore": 85,
  "bidVerdict": "STRONG_BID or CAUTIOUS or SKIP",
  "bidReasons": ["List of clear factors contributing to this scoring decision"]
}

## INSTRUCTIONS FOR PRICING STRATEGY & MARKET ACCURACY:
1. Base Rate Anchor: The freelancer's base rate is $${userBaseRate}/hr. Use this to calculate pricing if it's hourly, or to estimate time * rate for fixed projects.
2. Platform Customization:
   - Fiverr: High volume, low-mid pricing. Deliverables must be highly modular.
   - Freelancer: Extremely competitive. Target mid-low range but build authority to justify standard pricing.
   - Upwork: Value-focused. Professional, mid-high rates. Pitch for standard/premium.
   - Guru / PeoplePerHour: Mid rates. Standard structures.
3. Market Realism:
   - Do NOT suggest unrealistically low or high numbers.
   - Analyze the complexity of the project. A basic bug fix is cheap ($100-$250). A full app build is expensive ($2,000-$10,000+).
   - If the client's budget is specified, match it closely in standard/recommended. Use the basic tier to capture it if they are price-sensitive. Use premium to anchor a higher value.
   - Never recommend fixed prices below $100 or hourly rates below $15/hr.

## INSTRUCTIONS FOR BID SCORE & VERDICT:
- Calculate a score from 0 to 100 based on these four criteria (25 points each):
  - Budget Realism: Is their budget realistic for the required scope? (0-25)
  - Client Quality: Based on their reviews, do they hire often? Are they rating freelancers well? (0-25)
  - Scope Clarity: Is the job description clear and detailed, or vague and unstructured? (0-25)
  - Red Flag Penalty: Deduct points for each red flag present (haggler, ghost, off-platform, scope creep, unrealistic deadlines).
- Verdict Thresholds:
  - 80-100: STRONG_BID (Excellent opportunity, perfect fit, high likelihood of hire)
  - 50-79: CAUTIOUS (Good fit but watch out for specific risks/budget limitations)
  - 0-49: SKIP (Low hire rate, low-ball budget, major red flags, high risk of unpaid work/bad feedback)

Output ONLY valid JSON. No markdown backticks, no explanations.`;

    const userPrompt = `USER PROFILE DETAILS:
Developer Name: ${userName}
Base Hourly Rate: $${userBaseRate}/hr

TARGET PLATFORM: ${platform}
PREFERRED TONE: ${userTone}

RAW JOB DESCRIPTION:
${jobDescription}

PARSED JOB PARAMETERS:
${JSON.stringify(parsedJob, null, 2)}

MATCHED EVIDENCE:
${evidenceContext}`;

    try {
        const brief = await geminiGenerate({
            systemPrompt,
            userPrompt,
            temperature: 0.5, // Moderately low for steady reasoning and pricing calculations
            jsonMode: true
        });

        console.log(`[Stage 2: Strategy Architect] Completed in ${Date.now() - startTime}ms. Score: ${brief.bidScore}, Verdict: ${brief.bidVerdict}`);
        return brief;
    } catch (error) {
        console.error('[Stage 2: Strategy Architect] Error building strategy brief:', error);
        throw error;
    }
}
