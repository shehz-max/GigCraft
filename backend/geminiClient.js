import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
let rawModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Next.js Dev hot-reload env concatenation bug workaround:
// If the env variable has duplicated itself (e.g. "gemini-2.5-flashgemini-2.5-flash"), extract the base model
if (rawModel.includes('gemini-2.5-flash')) {
    rawModel = 'gemini-2.5-flash';
} else if (rawModel.includes('gemini-2.5-pro')) {
    rawModel = 'gemini-2.5-pro';
} else if (rawModel.includes('gemini-1.5-pro')) {
    rawModel = 'gemini-1.5-pro';
} else if (rawModel.includes('gemini-1.5-flash')) {
    rawModel = 'gemini-1.5-flash';
}

const modelName = rawModel;

let genAI = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Helper to call model.generateContent with exponential backoff retries on 503/429 errors.
 */
async function callWithRetry(modelObj, userPrompt, config, maxRetries = 3) {
    let delay = 1500; // Start with a 1.5 second delay
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await modelObj.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: config,
            });
            return result;
        } catch (err) {
            const errText = (err.message || '').toLowerCase();
            const isRetryable = 
                err.status === 503 || 
                err.status === 429 || 
                errText.includes('503') || 
                errText.includes('429') || 
                errText.includes('overloaded') ||
                errText.includes('unavailable') ||
                errText.includes('high demand') ||
                errText.includes('limit');

            if (isRetryable && attempt < maxRetries) {
                console.warn(`[Gemini Client] Attempt ${attempt} failed with retryable error: "${err.message}". Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2.5; // Exponential backoff factor
            } else {
                throw err;
            }
        }
    }
}

/**
 * Generates content using Google's Gemini API with optional system prompt and JSON schema enforcement.
 * Automatically handles model fallbacks and retries on transient errors.
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

    // List of models to try in sequence if we hit high-demand or rate limits
    const modelsToTry = Array.from(new Set([
        modelName,
        'gemini-2.0-flash',     // extremely fast and stable Gemini 2.0
        'gemini-flash-latest',  // stable Gemini 1.5 Flash fallback
        'gemini-2.5-pro',       // high-tier 2.5 Pro fallback
        'gemini-pro-latest'     // stable Gemini 1.5 Pro fallback
    ]));

    let lastError = null;

    for (const currentModelId of modelsToTry) {
        try {
            console.log(`[Gemini Client] Attempting generation with model: ${currentModelId}...`);
            const startTime = Date.now();

            const config = {
                temperature: temperature,
            };

            if (jsonMode) {
                config.responseMimeType = 'application/json';
            }

            const modelObj = genAI.getGenerativeModel({
                model: currentModelId,
                systemInstruction: systemPrompt,
            }, { apiVersion: 'v1beta' });

            const result = await callWithRetry(modelObj, userPrompt, config, 3);
            const textResponse = result.response.text();
            
            console.log(`[Gemini Client] Success! Generated using ${currentModelId} in ${Date.now() - startTime}ms`);

            if (jsonMode) {
                try {
                    return JSON.parse(textResponse);
                } catch (jsonErr) {
                    console.error(`[Gemini Client] Failed to parse JSON response for model ${currentModelId}. Raw text:`, textResponse);
                    throw new Error('Gemini model response was not valid JSON: ' + jsonErr.message);
                }
            }

            return textResponse;
        } catch (error) {
            console.error(`[Gemini Client] Model ${currentModelId} failed:`, error.message);
            lastError = error;
            // Continue loop to try the next fallback model in the list
        }
    }

    // If all models failed, throw the last error encountered
    throw lastError || new Error('All attempted Gemini models failed to generate content.');
}
