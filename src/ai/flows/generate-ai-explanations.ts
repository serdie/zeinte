'use server';
/**
 * @fileOverview Generates AI-powered explanations for predicted exam questions.
 *
 * - generateAIExplanation - A function that generates an AI explanation for a given question.
 * - GenerateAIExplanationInput - The input type for the generateAIExplanation function.
 * - GenerateAIExplanationOutput - The return type for the generateAIExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAIExplanationInputSchema = z.object({
  question: z.string().describe('The question to generate an explanation for.'),
  topic: z.string().describe('The topic of the question.'),
});
export type GenerateAIExplanationInput = z.infer<typeof GenerateAIExplanationInputSchema>;

const GenerateAIExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated explanation for the question.'),
});
export type GenerateAIExplanationOutput = z.infer<typeof GenerateAIExplanationOutputSchema>;

export async function generateAIExplanation(input: GenerateAIExplanationInput): Promise<GenerateAIExplanationOutput> {
  return generateAIExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAIExplanationPrompt',
  input: {schema: GenerateAIExplanationInputSchema},
  output: {schema: GenerateAIExplanationOutputSchema},
  prompt: `You are an expert professor explaining complex topics to students.
  Your task is to provide a clear and concise explanation for the following question, as if you were teaching a class.
  Incorporate relevant examples and analogies to enhance understanding.

  Question: {{{question}}}
  Topic: {{{topic}}}

  Explanation:`, // Removed triple curly braces from topic and question to avoid HTML escaping.
});

const generateAIExplanationFlow = ai.defineFlow(
  {
    name: 'generateAIExplanationFlow',
    inputSchema: GenerateAIExplanationInputSchema,
    outputSchema: GenerateAIExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
