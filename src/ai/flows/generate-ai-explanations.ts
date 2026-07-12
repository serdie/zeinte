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
  questionText: z.string().describe('The main text of the multiple-choice question.'),
  options: z.array(z.string()).describe('An array of answer options for the question.'),
  correctAnswerIndex: z.number().describe('The 0-based index of the correct option in the options array.'),
  topic: z.string().optional().describe('The general topic of the question, if available.'),
});
export type GenerateAIExplanationInput = z.infer<typeof GenerateAIExplanationInputSchema>;

const GenerateAIExplanationOutputSchema = z.object({
  explanation: z.string().describe('The AI-generated detailed explanation for the question, covering all options.'),
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
  Your task is to provide a clear, detailed, and concise explanation for the following multiple-choice question.
  Explain why the correct answer is correct, and why each of the incorrect options is incorrect.
  Incorporate relevant examples and analogies to enhance understanding, as if you were teaching a class.
  All explanations must be in Spanish.

  Question: {{{questionText}}}

  Options:
  {{#each options}}
  - {{this}}
  {{/each}}

  Correct Answer: {{lookup options correctAnswerIndex}}

  Topic (if provided): {{{topic}}}

  Provide a comprehensive explanation below:
  Explanation:`,
});

const generateAIExplanationFlow = ai.defineFlow(
  {
    name: 'generateAIExplanationFlow',
    inputSchema: GenerateAIExplanationInputSchema,
    outputSchema: GenerateAIExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('La IA no pudo generar una explicación.');
    }
    return output;
  }
);
