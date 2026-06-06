import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;
const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

let groq = null;
if (apiKey) {
    groq = new Groq({ apiKey });
}

/**
 * Generates context-aware follow-up messages for sent proposals
 * @param {object} params
 * @param {string} params.clientName - Client name
 * @param {string} params.jobDescription - Original job description
 * @param {string} params.coverLetter - Original cover letter text
 * @param {string} params.followUpType - Type of follow-up: 'value_add' (Day 3), 'breakup' (Day 10), or 'retainer' (Post-delivery)
 * @returns {Promise<string>} The generated follow-up message text
 */
export async function generateFollowUp({ clientName, jobDescription, coverLetter, followUpType }) {
    if (!groq) {
        throw new Error('Groq API Key is not configured in environment variables.');
    }

    console.log(`[Follow-Up Generator] Generating ${followUpType} message...`);
    const startTime = Date.now();

    let followUpGuidelines = '';

    if (followUpType === 'value_add') {
        followUpGuidelines = `
- **GOAL**: Send a value-add follow-up roughly 3 days after bidding. Offer a free insight, micro-audit tip, or technical suggestion related to their stack.
- **STYLE**: Sound helpful, professional, and completely non-pushy. Do NOT ask "did you read my proposal?" or "are you still looking?".
- **CONTENT**: Propose a specific minor technical improvement or check (e.g. check image compression, inspect Edge Function warm-ups, look for API call redundancies, optimize SQL indexes).
- **CTA**: Close with a low-friction question inviting a chat about the idea (e.g., "Let me know if you want me to check this for you?").
- **LENGTH**: Under 80 words.
`;
    } else if (followUpType === 'breakup') {
        followUpGuidelines = `
- **GOAL**: Send a professional "closing the file" message roughly 10 days after bidding. 
- **STYLE**: Confident, direct, polite. Creates urgency by letting the client know you are allocating your slots to other clients.
- **CONTENT**: State that since you haven't heard back, you are closing your notes on this project. Offer a polite sign-off.
- **CTA**: No direct call to action, just a final friendly sign-off. (e.g., "If things change, let me know. Otherwise, best of luck!").
- **LENGTH**: Under 60 words.
`;
    } else if (followUpType === 'retainer') {
        followUpGuidelines = `
- **GOAL**: Pitch a monthly retainer after completing the main project.
- **STYLE**: Business-minded, proactive, value-focused.
- **CONTENT**: Call out post-launch needs: regular dependency upgrades (security patches), database/query performance monitoring, API deprecation checks, or small feature requests.
- **CTA**: Ask if they want you to send a brief retainer proposal or jump on a quick call to map out maintenance needs.
- **LENGTH**: Under 90 words.
`;
    }

    const systemPrompt = `You are a high-end freelance consultant. Your task is to write a highly effective, contextually aware follow-up message to a client.
You MUST write like a confident, natural human. Use contractions (I'd, it's, let's). Do NOT use generic templates or sales speak. Avoid fluff and corporate jargon.

${followUpGuidelines}

Format the message with clean line breaks. Respond with the raw message text ONLY. No introduction, no wrappers.`;

    const userPrompt = `CLIENT NAME: ${clientName || 'there'}
FOLLOW-UP TYPE: ${followUpType}

ORIGINAL JOB POSTING:
${jobDescription}

SENT PROPOSAL COVER LETTER:
----------------------------------
${coverLetter}
----------------------------------`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: model,
            temperature: 0.65
        });

        const text = completion.choices[0]?.message?.content?.trim();
        console.log(`[Follow-Up Generator] Completed in ${Date.now() - startTime}ms`);
        return text;
    } catch (error) {
        console.error('[Follow-Up Generator] Error generating message:', error);
        throw error;
    }
}
