
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const apiKeyMatch = envFile.match(/GOOGLE_GENERATIVE_AI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim().replace(/"/g, '') : null;

if (!apiKey) {
    console.error('API KEY missing!');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error('Error fetching models:', JSON.stringify(data.error, null, 2));
        } else {
            console.log('Available Models:');
            data.models?.forEach((m: any) => console.log(`- ${m.name} (${m.displayName})`));
        }
    })
    .catch(err => console.error('Fetch error:', err));
