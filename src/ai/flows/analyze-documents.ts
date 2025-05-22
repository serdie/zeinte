
// use server'
'use server';

/**
 * @fileOverview Analyzes uploaded documents to identify frequently asked questions,
 * recurring themes, summaries, and patterns from past exams if present.
 *
 * - analyzeDocuments - A function that handles the document analysis process.
 * - AnalyzeDocumentsInput - The input type for the analyzeDocuments function.
 * - AnalyzeDocumentsOutput - The return type for the analyzeDocuments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { AnalysisDetails } from '@/types';


const AnalyzeDocumentsInputSchema = z.object({
  documentContent: z.string().describe('The text content of the document to analyze.'),
});
export type AnalyzeDocumentsInput = z.infer<typeof AnalyzeDocumentsInputSchema>;

const AnalyzeDocumentsOutputSchema = z.object({
  frequentQuestions: z
    .array(z.string())
    .describe('A list of general frequently asked questions identified in the document content.'),
  recurringThemes: z
    .array(z.string())
    .describe('A list of general recurring themes identified in the document content.'),
  summary: z.string().describe('A concise summary of all the document content.'),
  identifiedExamPatterns: z
    .string()
    .optional()
    .describe(
      'A description of observed patterns, question types, and methodology if past exams were identified in the content. If not, this may be omitted or state that no clear patterns were found.'
    ),
  potentialFocusAreas: z
    .array(z.string())
    .optional()
    .describe(
      'A list of topics or areas that seem highly important for an exam, derived from all content and especially from any past exam analysis.'
    ),
});
export type AnalyzeDocumentsOutput = z.infer<typeof AnalyzeDocumentsOutputSchema> & AnalysisDetails;

export async function analyzeDocuments(input: AnalyzeDocumentsInput): Promise<AnalyzeDocumentsOutput> {
  return analyzeDocumentsFlow(input);
}

const analyzeDocumentsPrompt = ai.definePrompt({
  name: 'analyzeDocumentsPrompt',
  input: {schema: AnalyzeDocumentsInputSchema},
  output: {schema: AnalyzeDocumentsOutputSchema},
  prompt: `You are an expert academic assistant specializing in analyzing educational materials and past exam papers.
Your task is to meticulously review the provided "Document Content".

Based on your analysis, you must:

1.  **Overall Summary**: Provide a concise summary of all the document content.
2.  **Recurring Themes**: Identify general recurring themes from all documents.
3.  **Frequent Questions**: List potential frequently asked questions based on the general material. This is speculative based on content density or importance.

4.  **Past Exam Analysis (If Applicable)**:
    *   Critically assess if any part of the "Document Content" appears to be a past exam paper or a collection of past exam questions.
    *   If past exam papers are identified:
        a.  Describe any recurring patterns in question types (e.g., multiple-choice, short answer, problem-solving, case studies).
        b.  Identify specific topics or concepts that appear frequently in these past exams.
        c.  Note any discernible methodology or style in how questions are posed (e.g., focus on definitions, application of theory, critical thinking, data interpretation).
        d.  Compile these observations into the 'identifiedExamPatterns' field. If no clear past exam content is found, state "No clear past exam patterns were identified in the provided documents."

5.  **Potential Focus Areas for Exam Preparation**:
    *   Based on ALL documents (including any insights from past exams if found, and general study material), identify a list of topics or areas that seem highly important for an upcoming exam. These should be more specific than general themes if possible. Store this in 'potentialFocusAreas'.

Document Content:
{{{documentContent}}}

Format the output STRICTLY as a JSON object with the following keys: "frequentQuestions", "recurringThemes", "summary", "identifiedExamPatterns", "potentialFocusAreas".
Ensure all text output is in Spanish.
  `,
});

const analyzeDocumentsFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentsFlow',
    inputSchema: AnalyzeDocumentsInputSchema,
    outputSchema: AnalyzeDocumentsOutputSchema,
  },
  async input => {
    const {output} = await analyzeDocumentsPrompt(input);
    if (!output) {
      throw new Error("Analysis output was null or undefined.");
    }
    return output;
  }
);
