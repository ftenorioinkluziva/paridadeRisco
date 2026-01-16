
import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

async function run() {
    try {
        console.log('--- Debugging AI SDK ---');
        console.log('Imported streamText:', typeof streamText);

        // Mock model
        const model = google('gemini-1.5-flash');

        // Call streamText (mock)
        const result = streamText({
            model,
            messages: [{ role: 'user', content: 'Hello' }],
        });

        console.log('Result type:', typeof result);
        console.log('Result constructor:', result?.constructor?.name);
        console.log('Result keys:', Object.keys(result));
        console.log('Result prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(result)));

        if (typeof result.toDataStreamResponse === 'function') {
            console.log('SUCCESS: toDataStreamResponse exists!');
        } else {
            console.log('FAIL: toDataStreamResponse is MISSING.');
        }
    } catch (error) {
        console.error('Error running debug:', error);
    }
}

run();
