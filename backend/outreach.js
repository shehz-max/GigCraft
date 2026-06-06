import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groq = null;
if (apiKey) {
    groq = new Groq({ apiKey });
}

/**
 * Generates cold outreach messages for outbound business development
 * @param {object} params
 * @param {string} params.prospectName - Name of the person (e.g., "Sarah Chen")
 * @param {string} params.companyName - Name of the company (e.g., "FinTrack")
 * @param {string} params.prospectPain - Identified pain point/need (e.g., "mobile app load time is slow")
 * @param {string} [params.portfolioContext=''] - Optional description of relevant portfolio proof
 * @returns {Promise<object>} Generated outreach packages (LinkedIn message, cold email, drip sequence)
 */
export async function generateOutreach({ prospectName, companyName, prospectPain, portfolioContext = '' }) {
    if (!groq) {
        throw new Error('Groq API Key is not configured in environment variables.');
    }

    console.log(`[Outreach Generator] Generating outreach package for ${prospectName} at ${companyName}...`);
    const startTime = Date.now();

    const systemPrompt = `You are a world-class IT Business Development outreach copywriter. Your goal is to write high-converting, personalized outbound copy targeting a specific prospect's business pain.
You MUST write like a confident, respectful, and highly competent human. BAN all automated templates and typical AI greeting patterns (e.g. "I hope this email finds you well", "Dear [Name]"). Use contractions (I'll, we've, details).

You MUST respond with a raw JSON object ONLY, matching this EXACT schema:
{
  "linkedinMessage": "A connection request note under 300 characters. Highly specific, low friction, focusing on their pain and your evidence. End with a soft, non-salesy question.",
  "coldEmail": {
    "subject": "Compelling, short, open-loop subject line (e.g. 'thought on FinTrack performance' or 'quick suggestion')",
    "body": "A short, highly personalized cold email (under 130 words). Starts directly with the observed pain at their company, details why it happens technically, references portfolio proof with metrics, offers a free diagnostic suggestion, and ends with a low-friction binary choice CTA."
  },
  "dripSequence": [
    {
      "step": 1,
      "subject": "Follow-up: [Previous Subject]",
      "body": "Brief follow-up 4 days later (under 80 words) adding a quick case study metric or warning of a common mistake companies make when fixing this problem."
    },
    {
      "step": 2,
      "subject": "One final thought for [Company]",
      "body": "A 'breakup' email 9 days later (under 70 words) providing one last free value nugget, stating you're closing the loop, and leaving the door open."
    }
  ]
}

Guidelines:
1. Direct Pain Focus: Start the email immediately by calling out the problem. E.g. "I was checking out FinTrack's mobile app and noticed the dashboard cards take 4-5 seconds to render..."
2. Technical Diagnostic: Explain why the problem exists in simple but authoritative technical terms. E.g. "Usually, this is due to unoptimized state updates or lack of server-side virtualization."
3. Proof: Connect this to your portfolio item. E.g. "I recently resolved this exact issue for [Portfolio], cutting load times by 62%."
4. Emojis: Strictly banned.

Output ONLY valid JSON. No markdown blocks.`;

    const userPrompt = `PROSPECT: ${prospectName}
COMPANY: ${companyName}
PAIN POINT: ${prospectPain}
PORTFOLIO EVIDENCE TO WEAVE: ${portfolioContext || 'General Next.js & Supabase experience'}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: model,
            temperature: 0.7,
            response_format: { type: "json_object" }
        });

        const responseContent = completion.choices[0]?.message?.content;
        const parsed = JSON.parse(responseContent);

        console.log(`[Outreach Generator] Completed in ${Date.now() - startTime}ms`);
        return parsed;
    } catch (error) {
        console.error('[Outreach Generator] Error generating package:', error);
        throw error;
    }
}
