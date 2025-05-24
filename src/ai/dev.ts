import { config } from 'dotenv';
config();

import '@/ai/flows/generate-ai-explanations.ts';
import '@/ai/flows/predict-exam-questions.ts';
import '@/ai/flows/analyze-documents.ts';
import '@/ai/flows/find-external-documents.ts';
