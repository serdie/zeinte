// src/ai/flows/predict-exam-questions.ts
'use server';
/**
 * @fileOverview Predicts potential exam questions based on uploaded documents.
 *
 * - predictExamQuestions - A function that predicts exam questions.
 * - PredictExamQuestionsInput - The input type for the predictExamQuestions function.
 * - PredictExamQuestionsOutput - The return type for the predictExamQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictExamQuestionsInputSchema = z.object({
  documentsAnalysis: z
    .string()
    .describe(
      'Analysis of the documents including topics, frequency, and importance.'
    ),
});
export type PredictExamQuestionsInput = z.infer<typeof PredictExamQuestionsInputSchema>;

const PredictExamQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('An array of potential exam questions.'),
});
export type PredictExamQuestionsOutput = z.infer<typeof PredictExamQuestionsOutputSchema>;

export async function predictExamQuestions(input: PredictExamQuestionsInput): Promise<PredictExamQuestionsOutput> {
  return predictExamQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictExamQuestionsPrompt',
  input: {schema: PredictExamQuestionsInputSchema},
  output: {schema: PredictExamQuestionsOutputSchema},
  prompt: `Based on the analysis of the uploaded documents:

  {{{documentsAnalysis}}}

  Predict potential exam questions. Return them as a list.
  Make sure the questions are in spanish.
  `,
});

const predictExamQuestionsFlow = ai.defineFlow(
  {
    name: 'predictExamQuestionsFlow',
    inputSchema: PredictExamQuestionsInputSchema,
    outputSchema: PredictExamQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
