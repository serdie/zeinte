'use server';
/**
 * @fileOverview Provides a mock/demonstration for finding external documents based on a topic.
 *
 * - findExternalDocuments - A function that simulates finding documents.
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
    simulatedTextContent: z.string().describe("Simulated text content for demonstration purposes."),
});
export type DocumentSearchResult = z.infer<typeof DocumentSearchResultSchema>;

const FindExternalDocumentsOutputSchema = z.object({
  results: z.array(DocumentSearchResultSchema).describe("A list of mock document search results."),
  message: z.string().describe("A message to the user about the status or limitations of the search."),
});
export type FindExternalDocumentsOutput = z.infer<typeof FindExternalDocumentsOutputSchema>;

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
    // In a real implementation, this flow would use a tool to call a search API,
    // then potentially another tool or process to fetch and parse document content.
    // For now, we return mocked data and a clear message.

    let mockResults: DocumentSearchResult[] = [];
    const genericTopicResults = [
        { id: 'ds_gen1', title: `Documento Relevante sobre ${input.topic} (Ejemplo 1)`, source: "ejemplo.com/doc1", simulatedTextContent: `Este es un texto simulado sobre ${input.topic}. Contiene información clave y detalles específicos del tema para demostración.` },
        { id: 'ds_gen2', title: `Investigación Clave de ${input.topic} (Ejemplo 2)`, source: "ejemplo.com/doc2", simulatedTextContent: `Más contenido simulado referente a ${input.topic}, enfocado en investigaciones y hallazgos.` },
    ];

    if (input.topic.toLowerCase().includes("agente forestal")) {
        mockResults = [
            { id: 'ds_af1', title: "Temario Oposiciones Agente Forestal 2024 - Ejemplo PDF", source: "fuenteimaginaria.com/temario.pdf", simulatedTextContent: "Contenido simulado del temario de agente forestal PDF. Incluye temas como legislación, fauna, flora y procedimientos." },
            { id: 'ds_af2', title: "Guía de Estudio para Agentes Forestales - Ejemplo DOCX", source: "estudiosforestales.org/guia.docx", simulatedTextContent: "Texto de ejemplo de la guía de estudio DOCX para agentes forestales. Cubre técnicas de estudio y casos prácticos simulados." },
            { id: 'ds_af3', title: "Legislación Medioambiental Aplicable - Ficticio", source: "boeoficial.example/legislacion", simulatedTextContent: "Simulación de artículos de legislación medioambiental relevantes para agentes forestales. Leyes de montes, conservación de especies, etc." },
        ];
    } else if (input.topic.trim() !== "") {
         mockResults = genericTopicResults;
    }


    return {
      results: mockResults,
      message: mockResults.length > 0 
                 ? "Nota: Esta es una demostración. Los documentos son ejemplos con contenido simulado. Selecciona los que quieras añadir para el análisis."
                 : "No se encontraron resultados simulados para este tema. Prueba con 'agente forestal' para ver un ejemplo. La búsqueda real de documentos no está implementada.",
    };
  }
);
