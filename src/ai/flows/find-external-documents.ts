
'use server';
/**
 * @fileOverview Uses AI to suggest relevant document titles and abstracts based on a topic,
 * then provides mock/demonstration documents with simulated content.
 *
 * - findExternalDocuments - A function that handles suggesting and returning mock documents.
 * - FindExternalDocumentsInput - The input type.
 * - FindExternalDocumentsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindExternalDocumentsInputSchema = z.object({
  topic: z.string().describe('The topic to search documents for.'),
});
export type FindExternalDocumentsInput = z.infer<typeof FindExternalDocumentsInputSchema>;

const DocumentSearchResultSchema = z.object({
  id: z.string().describe("A unique ID for the search result"),
  title: z.string().describe("The title of the found document."),
  source: z.string().describe("A mock source or URL for the document."),
  simulatedTextContent: z.string().describe("Simulated text content for demonstration purposes, potentially enriched by AI abstract."),
});
export type DocumentSearchResult = z.infer<typeof DocumentSearchResultSchema>;

const FindExternalDocumentsOutputSchema = z.object({
  results: z.array(DocumentSearchResultSchema).describe("A list of AI-suggested and mock document search results."),
  message: z.string().describe("A message to the user about the status or limitations of the search."),
});
export type FindExternalDocumentsOutput = z.infer<typeof FindExternalDocumentsOutputSchema>;

// Schema for AI-suggested document details
const AISuggestedDocumentSchema = z.object({
    title: z.string().describe("Título del documento o artículo académico sugerido."),
    abstract: z.string().describe("Breve resumen (1-2 frases) o puntos clave del contenido del documento.")
});

const AISuggestionOutputSchema = z.object({
    suggestions: z.array(AISuggestedDocumentSchema).describe("Lista de sugerencias de documentos.")
});

const suggestDocumentsPrompt = ai.definePrompt({
    name: 'suggestDocumentsPrompt',
    input: { schema: FindExternalDocumentsInputSchema },
    output: { schema: AISuggestionOutputSchema },
    prompt: `Eres un asistente de investigación experto. Dado el tema "{{topic}}", sugiere entre 3 y 5 títulos de documentos o artículos académicos altamente relevantes, específicos y plausibles que serían extremadamente útiles para preparar un examen sobre este tema. Para cada título, proporciona un resumen muy breve (1-2 frases) o puntos clave del contenido simulado. Asegúrate de que los títulos y resúmenes estén en español.

    Ejemplo de formato de salida esperado para una sugerencia:
    {
      "title": "Título Específico del Documento Relacionado con {{topic}}",
      "abstract": "Este documento cubre los aspectos cruciales de X y Y, fundamentales para entender {{topic}}."
    }
    Devuelve únicamente el objeto JSON con la clave "suggestions".
    `,
});


export async function findExternalDocuments(input: FindExternalDocumentsInput): Promise<FindExternalDocumentsOutput> {
  return findExternalDocumentsFlow(input);
}

const findExternalDocumentsFlow = ai.defineFlow(
  {
    name: 'findExternalDocumentsFlow',
    inputSchema: FindExternalDocumentsInputSchema,
    outputSchema: FindExternalDocumentsOutputSchema,
  },
  async (input) => {
    let message = "";
    let documentResults: DocumentSearchResult[] = [];

    try {
      const { output } = await suggestDocumentsPrompt(input);
      if (output && output.suggestions && output.suggestions.length > 0) {
        documentResults = output.suggestions.map((suggestion, index) => ({
          id: `ai_suggested_${Date.now()}_${index}`,
          title: suggestion.title,
          source: "Sugerido por IA (fuente simulada)",
          simulatedTextContent: `${suggestion.abstract}\n\n(Contenido detallado adicional simulado para demostración: Este documento profundiza en los conceptos mencionados en el resumen, ofreciendo ejemplos y análisis relevantes para el tema "${input.topic}".)`
        }));
        message = `La IA ha sugerido ${documentResults.length} documentos relevantes para "${input.topic}". El contenido detallado es simulado. Selecciona los que quieras añadir para el análisis.`;
      } else {
        message = `La IA no pudo generar sugerencias específicas para "${input.topic}" en este momento. Puedes intentarlo de nuevo o con un tema diferente.`;
      }
    } catch (error) {
        console.error("Error calling AI for document suggestions:", error);
        message = "Error al contactar con la IA para sugerencias de documentos. Se mostrarán ejemplos genéricos si es posible.";
        // Fallback to generic examples if AI fails
        if (input.topic.trim() !== "") {
            documentResults = [
                { id: 'ds_gen1_fallback', title: `Documento Ejemplo sobre ${input.topic} (Fallback 1)`, source: "ejemplo.com/doc1", simulatedTextContent: `Este es un texto simulado sobre ${input.topic} por si falla la IA.` },
                { id: 'ds_gen2_fallback', title: `Investigación Clave de ${input.topic} (Fallback 2)`, source: "ejemplo.com/doc2", simulatedTextContent: `Más contenido simulado referente a ${input.topic}, enfocado en IA.` },
            ];
        }
    }
    
    // Specific mock for "agente forestal" as a stronger example if the topic matches
    if (input.topic.toLowerCase().includes("agente forestal")) {
        const agenteForestalDocs: DocumentSearchResult[] = [
            { id: 'ds_af1', title: "Temario Oposiciones Agente Forestal 2024 - Ejemplo PDF (Sugerido por IA)", source: "fuenteimaginaria.com/temario.pdf", simulatedTextContent: "Contenido simulado del temario de agente forestal PDF. Incluye temas como legislación, fauna, flora y procedimientos, enriquecido con análisis de la IA." },
            { id: 'ds_af2', title: "Guía de Estudio para Agentes Forestales - Ejemplo DOCX (Sugerido por IA)", source: "estudiosforestales.org/guia.docx", simulatedTextContent: "Texto de ejemplo de la guía de estudio DOCX para agentes forestales. Cubre técnicas de estudio y casos prácticos simulados, con enfoque IA." },
        ];
        // Add these to the results, potentially replacing or augmenting AI suggestions if topic is specific
        documentResults = [...agenteForestalDocs, ...documentResults.filter(doc => !doc.title.toLowerCase().includes("agente forestal"))].slice(0,5); // Keep a reasonable number
         message = `La IA ha sugerido documentos para "agente forestal". El contenido detallado es simulado.`;
    }


    if (documentResults.length === 0 && !message.includes("Error al contactar con la IA")) {
         message = "No se encontraron o sugirieron documentos para este tema. La búsqueda real y obtención de documentos no está implementada en esta demostración.";
    }


    return {
      results: documentResults,
      message: message,
    };
  }
);

