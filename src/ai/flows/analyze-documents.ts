// use server'
'use server';

/**
 * @fileOverview Analyzes uploaded documents to identify frequently asked questions and recurring themes.
 *
 * - analyzeDocuments - A function that handles the document analysis process.
 * - AnalyzeDocumentsInput - The input type for the analyzeDocuments function.
 * - AnalyzeDocumentsOutput - The return type for the analyzeDocuments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentsInputSchema = z.object({
  documentContent: z.string().describe('The text content of the document to analyze.'),
});
export type AnalyzeDocumentsInput = z.infer<typeof AnalyzeDocumentsInputSchema>;

const AnalyzeDocumentsOutputSchema = z.object({
  frequentQuestions: z
    .array(z.string())
    .describe('A list of frequently asked questions identified in the document.'),
  recurringThemes: z
    .array(z.string())
    .describe('A list of recurring themes identified in the document.'),
  summary: z.string().describe('A summary of the document.'),
});
export type AnalyzeDocumentsOutput = z.infer<typeof AnalyzeDocumentsOutputSchema>;

export async function analyzeDocuments(input: AnalyzeDocumentsInput): Promise<AnalyzeDocumentsOutput> {
  return analyzeDocumentsFlow(input);
}

const analyzeDocumentsPrompt = ai.definePrompt({
  name: 'analyzeDocumentsPrompt',
  input: {schema: AnalyzeDocumentsInputSchema},
  output: {schema: AnalyzeDocumentsOutputSchema},
  prompt: `You are an expert in analyzing educational documents.

  Your task is to analyze the content of the provided document and identify frequently asked questions, recurring themes, and provide a summary of the document.

  Document Content: {{{documentContent}}}

  Format the output as a JSON object with the following keys:
  - frequentQuestions: A list of frequently asked questions identified in the document.
  - recurringThemes: A list of recurring themes identified in the document.
  - summary: A summary of the document.
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
    return output!;
  }
);
