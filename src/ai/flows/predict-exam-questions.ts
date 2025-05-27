
// src/ai/flows/predict-exam-questions.ts
'use server';
/**
 * @fileOverview Predicts potential exam questions based on uploaded documents,
 * incorporating analysis of past exam patterns if available.
 * All questions generated are multiple-choice (test type).
 *
 * - predictExamQuestions - A function that predicts exam questions.
 * - PredictExamQuestionsInput - The input type for the predictExamQuestions function.
 * - PredictedQuestion - The structure for a single predicted multiple-choice question.
 * - PredictExamQuestionsOutput - The return type for the predictExamQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AnalysisDetails } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';

const PredictExamQuestionsInputSchema = z.object({
  analysisSummary: z
    .string()
    .describe('A concise summary of the documents.'),
  recurringThemes: z
    .array(z.string())
    .optional()
    .describe('A list of recurring themes identified in the documents. This provides context on the main topics.'),
  numberOfQuestions: z.number().int().positive().optional().nullable().describe('The desired number of questions to generate.'),
  identifiedExamPatterns: z
    .string()
    .optional()
    .describe('Detailed observations about patterns, question types, and methodology if past exams were identified in the source material. This should heavily influence question generation style.'),
  potentialFocusAreas: z
    .array(z.string())
    .optional()
    .describe('Specific topics or areas identified as highly important for an exam, possibly derived from past exam analysis. These should be prioritized for question generation.'),
});

export type PredictExamQuestionsInput = z.infer<typeof PredictExamQuestionsInputSchema> & AnalysisDetails;


const PredictedQuestionSchema = z.object({
  questionText: z.string().describe('The text of the question.'),
  options: z.array(z.string()).describe('An array of at least 3-4 answer options for multiple-choice questions.'),
  correctAnswerIndex: z.number().describe('The 0-based index of the correct option in the options array for multiple-choice questions.'),
  explanation: z.string().optional().describe('A brief explanation for why the answer is correct (for multiple-choice).'),
  // questionType: z.enum(["test", "written", "oral"]).describe("The type of question generated.") // Removed
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
  prompt: `You are an expert exam question creator. Your task is to generate high-quality multiple-choice exam questions in Spanish.
These questions must be **directly and accurately** based on the provided "Document Summary", "Key Themes", "Potential Focus Areas", and importantly, any "Identified Exam Patterns & Methodology".
If possible, try to make the questions varied if the source material allows for it.

Document Summary:
{{{analysisSummary}}}

{{#if recurringThemes.length}}
Key Themes:
{{#each recurringThemes}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if potentialFocusAreas.length}}
Potential Focus Areas (prioritize these for question generation):
{{#each potentialFocusAreas}}
- {{{this}}}
{{/each}}
{{/if}}

{{#if identifiedExamPatterns}}
Identified Exam Patterns & Methodology (CRITICAL: Emulate this style, complexity, and question types if possible, focusing on multiple-choice):
{{{identifiedExamPatterns}}}
{{else}}
(No specific past exam patterns were identified. Generate general high-quality multiple-choice questions based on summary, themes, and focus areas.)
{{/if}}

{{#if numberOfQuestions}}
Please generate {{{numberOfQuestions}}} multiple-choice questions.
{{else}}
Please generate 10 multiple-choice questions.
{{/if}}
If the provided information is not rich enough to generate the target number of high-quality questions, generate as many high-quality questions as possible, up to the target number. Prioritize quality over quantity.

For each multiple-choice question:
1.  The \`questionText\` must be clear, unambiguous, and in Spanish. It should reflect the style and complexity suggested by any identified exam patterns.
2.  There must be exactly four \`options\`, all in Spanish.
3.  One \`option\` must be clearly correct according to the provided "Document Summary", "Key Themes", and "Potential Focus Areas".
4.  The other three \`options\` must be plausible distractors.
5.  The \`correctAnswerIndex\` must be the 0-based index of the correct option.
6.  The \`explanation\` must be a concise, clear, and accurate justification in Spanish, explaining *why* the correct answer is correct and *briefly* why the other options are not.

Return the questions as a list of JSON objects, each conforming to the multiple-choice structure.
Ensure all generated text is in Spanish.
The questions must test understanding of the key concepts, facts, and information presented, with a style influenced by identified past exam patterns if available.
  `,
});

const predictExamQuestionsFlow = ai.defineFlow(
  {
    name: 'predictExamQuestionsFlow',
    inputSchema: PredictExamQuestionsInputSchema,
    outputSchema: PredictExamQuestionsOutputSchema,
  },
  async (input: PredictExamQuestionsInput) => {
    let effectiveModel = 'googleai/gemini-2.0-flash';
    let effectiveTemperature: number | undefined = 0.7;

    if (db) {
      try {
        const settingsRef = doc(db, "appSettings", "globalConfig");
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
          const settingsData = settingsSnap.data();
          effectiveModel = settingsData.defaultAiModel || effectiveModel;
          effectiveTemperature = typeof settingsData.defaultTemperature === 'number' 
            ? settingsData.defaultTemperature 
            : effectiveTemperature;
        }
      } catch (error) {
        console.warn("predictExamQuestionsFlow: Could not fetch AI settings from Firestore, using defaults. Error:", error);
      }
    } else {
        console.warn("predictExamQuestionsFlow: Firestore db instance is not available, using default AI settings.");
    }
    
    const {output} = await prompt(input, { model: effectiveModel, temperature: effectiveTemperature });
    // Ensure output is not null and conforms to the schema
    if (!output || !Array.isArray(output.questions)) {
        return { questions: [] };
    }
    // Validate that each question has options and a correct answer index
    const validatedQuestions = output.questions.filter(
      q => Array.isArray(q.options) && q.options.length > 0 && typeof q.correctAnswerIndex === 'number'
    );

    return { questions: validatedQuestions };
  }
);
