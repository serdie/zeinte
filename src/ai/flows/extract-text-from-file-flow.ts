
'use server';
/**
 * @fileOverview Extracts text content from various file types, including OCR for images.
 *
 * - extractTextFromFile - A function that handles text extraction.
 * - ExtractTextFromFileInput - The input type.
 * - ExtractTextFromFileOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextFromFileInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file content as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  fileName: z.string().describe('The original name of the file, for context.'),
});
export type ExtractTextFromFileInput = z.infer<typeof ExtractTextFromFileInputSchema>;

const ExtractTextFromFileOutputSchema = z.object({
  extractedText: z.string().describe('The text extracted from the file. This could be from OCR for images or direct text extraction for documents.'),
});
export type ExtractTextFromFileOutput = z.infer<typeof ExtractTextFromFileOutputSchema>;

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractTextFromFileOutput> {
  return extractTextFromFileFlow(input);
}

const extractTextPrompt = ai.definePrompt({
  name: 'extractTextFromFilePrompt',
  input: {schema: ExtractTextFromFileInputSchema},
  output: {schema: ExtractTextFromFileOutputSchema},
  prompt: `Eres una herramienta experta en extracción de datos. Tu tarea es extraer TODO el contenido textual del archivo proporcionado.

Consideraciones:
- Si el archivo es una IMAGEN (PNG, JPG, WEBP, etc.), realiza un Reconocimiento Óptico de Caracteres (OCR) para obtener todo el texto visible.
- Si el archivo es un DOCUMENTO (PDF, DOCX, TXT, etc.), extrae su contenido textual completo.
- Intenta preservar la estructura básica como párrafos y listas si es posible, pero el objetivo principal es obtener el texto.
- Si el archivo no contiene texto o no se puede procesar, devuelve una cadena vacía o un mensaje breve indicando el problema.

Nombre del archivo (para contexto): {{{fileName}}}

Contenido del archivo:
{{media url=fileDataUri}}

Por favor, devuelve solo el texto extraído en el campo "extractedText".
Si el archivo es un DOCX y tienes dificultades para procesarlo directamente, indica que el formato DOCX puede requerir conversión a PDF o TXT para una mejor extracción.
Si el archivo está vacío o no contiene texto legible, devuelve una cadena vacía para "extractedText".
`,
});

const extractTextFromFileFlow = ai.defineFlow(
  {
    name: 'extractTextFromFileFlow',
    inputSchema: ExtractTextFromFileInputSchema,
    outputSchema: ExtractTextFromFileOutputSchema,
  },
  async (input) => {
    // Consider adding safety settings if dealing with diverse user uploads
    const {output} = await extractTextPrompt(input, { model: 'googleai/gemini-2.0-flash' });
    if (!output) {
      // Fallback or error handling if the AI provides no output
      return { extractedText: "" };
    }
    return output;
  }
);

    