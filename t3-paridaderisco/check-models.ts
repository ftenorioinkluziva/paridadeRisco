
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from 'process';

import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envFile.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim().replace(/"/g, '') : null; // Remove quotes if present

if (!apiKey) {
    console.error('API KEY missing!');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // A API não tem um método listModels direto no SDK fácil de usar sem auth complexo, 
        // mas vamos tentar fazer uma chamada simples para testar validade.

        console.log('Testing gemini-1.5-flash...');
        await model.generateContent("Test");
        console.log('gemini-1.5-flash OK!');
    } catch (e: any) {
        console.error('gemini-1.5-flash Failed:', e.message);
    }

    try {
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('Testing gemini-pro...');
        await model2.generateContent("Test");
        console.log('gemini-pro OK!');
    } catch (e: any) {
        console.error('gemini-pro Failed:', e.message);
    }
}

listModels();
