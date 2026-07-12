import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-3.5-flash',
});
