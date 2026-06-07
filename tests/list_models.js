import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not defined in .env.local');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
    try {
        console.log('Querying available Gemini models...');
        // We need to use v1beta to list models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('\nAvailable Models:');
        data.models.forEach(m => {
            console.log(`- ID: ${m.name} (${m.displayName})`);
            console.log(`  Supported Actions: ${m.supportedGenerationMethods.join(', ')}`);
        });
    } catch (err) {
        console.error('Failed to list models:', err);
    }
}

list();
