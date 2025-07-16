
'use server';
/**
 * @fileOverview Generates a visually structured summary from document content.
 *
 * - generateSummary - A function that handles the summary generation.
 * - GenerateSummaryInput - The input type.
 * - GenerateSummaryOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSummaryInputSchema = z.object({
  documentContent: z.string().describe('The text content of the document to summarize.'),
});
export type GenerateSummaryInput = z.infer<typeof GenerateSummaryInputSchema>;

const SummarySectionSchema = z.object({
  title: z.string().describe('The title of this summary section.'),
  content: z.string().describe('The detailed content of this section.'),
  icon: z.string().optional().describe('A relevant icon name from the lucide-react library (e.g., "BookOpen", "Lightbulb", "Target").'),
});

const GenerateSummaryOutputSchema = z.object({
  title: z.string().describe('A concise, overall title for the summary.'),
  introduction: z.string().describe('A brief introductory paragraph that sets the context.'),
  keyPoints: z.array(z.string()).describe('A bulleted list of the most critical points or takeaways from the document.'),
  sections: z.array(SummarySectionSchema).describe('An array of structured sections, each with a title, content, and an optional icon.'),
  conclusion: z.string().describe('A concluding paragraph that wraps up the main ideas.'),
});
export type GenerateSummaryOutput = z.infer<typeof GenerateSummaryOutputSchema>;

export async function generateSummary(input: GenerateSummaryInput): Promise<GenerateSummaryOutput> {
  return generateSummaryFlow(input);
}

const generateSummaryPrompt = ai.definePrompt({
  name: 'generateSummaryPrompt',
  input: { schema: GenerateSummaryInputSchema },
  output: { schema: GenerateSummaryOutputSchema },
  prompt: `You are an expert academic summarizer. Your task is to transform the provided document content into a clear, well-structured, and visually appealing summary. The summary should be easy to digest and study.

Document Content:
{{{documentContent}}}

Based on the content, generate a summary with the following structure:
1.  **title**: Create a concise and descriptive overall title for the summary.
2.  **introduction**: Write a brief paragraph (2-3 sentences) that introduces the main topic and purpose of the document.
3.  **keyPoints**: Extract and list 3 to 5 of the most crucial, high-level points or conclusions from the text. These should be short and impactful.
4.  **sections**: Divide the main body of the document into logical sections. For each section:
    a.  Provide a clear 'title'.
    b.  Write the detailed summary 'content' for that section.
    c.  Suggest a relevant 'icon' name from the lucide-react icon library (e.g., "BookOpen", "Lightbulb", "Target", "BarChart", "Users", "Settings", "ShieldCheck"). The icon should visually represent the section's theme.
5.  **conclusion**: Write a short concluding paragraph that synthesizes the main ideas and provides a final thought or takeaway.

Ensure all text output is in Spanish. Format the output STRICTLY as a JSON object adhering to the specified schema.
`,
});

const generateSummaryFlow = ai.defineFlow(
  {
    name: 'generateSummaryFlow',
    inputSchema: GenerateSummaryInputSchema,
    outputSchema: GenerateSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await generateSummaryPrompt(input);
    if (!output) {
      throw new Error('The AI could not generate a summary.');
    }
    return output;
  }
);
