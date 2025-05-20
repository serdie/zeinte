// src/ai/flows/predict-exam-questions.ts
'use server';
/**
 * @fileOverview Predicts potential exam questions based on uploaded documents.
 *
 * - predictExamQuestions - A function that predicts exam questions.
 * - PredictExamQuestionsInput - The input type for the predictExamQuestions function.
 * - PredictedQuestion - The structure for a single predicted multiple-choice question.
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

const PredictedQuestionSchema = z.object({
  questionText: z.string().describe('The text of the multiple-choice question.'),
  options: z.array(z.string()).describe('An array of at least 3-4 answer options.'),
  correctAnswerIndex: z.number().describe('The 0-based index of the correct option in the options array.'),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct.')
});
export type PredictedQuestion = z.infer<typeof PredictedQuestionSchema>;

const PredictExamQuestionsOutputSchema = z.object({
  questions: z
    .array(PredictedQuestionSchema)
    .describe('An array of potential multiple-choice exam questions.'),
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

  Predict potential exam questions.
  Each question must be multiple-choice style, similar to what might appear in an exam based on the provided documents.
  Return them as a list of JSON objects. Each object must have the following structure:
  {
    "questionText": "The text of the question in Spanish.",
    "options": ["Option A in Spanish", "Option B in Spanish", "Option C in Spanish", "Option D in Spanish"],
    "correctAnswerIndex": 0, // (0-based index of the correct option)
    "explanation": "A brief explanation in Spanish of why this is the correct answer."
  }
  Ensure there are 4 options for each question.
  All text (questionText, options, explanation) must be in Spanish.
  Generate at least 5-10 questions if the document analysis is rich enough.
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
    // Ensure output is not null and conforms to the schema, especially if the model might return slightly off results.
    // Basic validation: if output is null or questions is not an array, return an empty array.
    if (!output || !Array.isArray(output.questions)) {
        return { questions: [] };
    }
    // Further validation could be added here if needed, e.g., ensuring each question has options, etc.
    return output;
  }
);

