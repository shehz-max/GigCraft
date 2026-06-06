import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let genAI = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Generates content using Google's Gemini API with optional system prompt and JSON schema enforcement.
 * @param {object} params
 * @param {string} params.systemPrompt - System guidelines and constraints for the model
 * @param {string} params.userPrompt - Input user query or context
 * @param {number} [params.temperature=0.7] - Randomness control (0.0 to 2.0)
 * @param {boolean} [params.jsonMode=true] - If true, enforces JSON response formatting and parses it
 * @returns {Promise<object|string>} Parsed JSON object if jsonMode is true, otherwise raw text
 */
export async function geminiGenerate({ systemPrompt, userPrompt, temperature = 0.7, jsonMode = true }) {
    if (!genAI) {
        throw new Error('Gemini API Key is not configured in environment variables.');
    }

    try {
        console.log(`[Gemini Client] Generating content using model: ${modelName}...`);
        const startTime = Date.now();

        const config = {
            temperature: temperature,
        };

        if (jsonMode) {
            config.responseMimeType = 'application/json';
        }

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemPrompt,
        }, { apiVersion: 'v1beta' });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: config,
        });

        const textResponse = result.response.text();
        console.log(`[Gemini Client] Response generated in ${Date.now() - startTime}ms`);

        if (jsonMode) {
            try {
                return JSON.parse(textResponse);
            } catch (jsonErr) {
                console.error('[Gemini Client] Failed to parse JSON response. Raw text:', textResponse);
                throw new Error('Gemini model response was not valid JSON: ' + jsonErr.message);
            }
        }

        return textResponse;
    } catch (error) {
        console.error('[Gemini Client] Error generating content:', error);
        throw error;
    }
}
