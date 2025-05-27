
'use server';
/**
 * @fileOverview Generates detailed content for a specific course module.
 *
 * - generateModuleContent - A function that handles module content generation.
 * - GenerateModuleContentInput - The input type.
 * - GenerateModuleContentOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateModuleContentInputSchema = z.object({
  moduleTitle: z.string().describe('The title of the course module for which to generate content.'),
  courseTopic: z.string().describe('The main topic of the overall course, for context.'),
  courseLevel: z.enum(['Principiante', 'Intermedio', 'Avanzado']).describe('The intended level of the course.'),
  courseGoals: z.string().optional().describe('Optional. Main learning objectives or goals for the students taking this course.'),
});
export type GenerateModuleContentInput = z.infer<typeof GenerateModuleContentInputSchema>;

const GenerateModuleContentOutputSchema = z.object({
  generatedContent: z.string().describe('The detailed, educational content generated for the module. Should be formatted for readability, potentially using Markdown-like structures (e.g., paragraphs, lists, key points).'),
});
export type GenerateModuleContentOutput = z.infer<typeof GenerateModuleContentOutputSchema>;

export async function generateModuleContent(input: GenerateModuleContentInput): Promise<GenerateModuleContentOutput> {
  return generateModuleContentFlow(input);
}

const generateContentPrompt = ai.definePrompt({
  name: 'generateModuleContentPrompt',
  input: {schema: GenerateModuleContentInputSchema},
  output: {schema: GenerateModuleContentOutputSchema},
  prompt: `Eres un experto diseñador de currículums y educador con vasta experiencia creando material didáctico.
Tu tarea es generar contenido detallado, educativo y bien estructurado para un módulo específico de un curso.

Información del curso y módulo:
- Tema Principal del Curso General: {{{courseTopic}}}
- Nivel del Curso: {{{courseLevel}}}
{{#if courseGoals}}
- Objetivos Principales del Curso General: {{{courseGoals}}}
{{/if}}
- Título del Módulo para el que generarás contenido: {{{moduleTitle}}}

Instrucciones para el contenido a generar:
1.  **Profundidad y Relevancia**: El contenido debe ser apropiado para el 'Nivel del Curso' y directamente relevante para el 'Título del Módulo' y el 'Tema Principal del Curso General'.
2.  **Claridad y Estructura**: Organiza el contenido de forma lógica y clara. Puedes usar párrafos, listas con viñetas o numeradas, y destacar puntos clave. El objetivo es que sea fácil de entender y aprender. Si es apropiado, puedes simular subsecciones dentro del contenido del módulo.
3.  **Extensión**: Proporciona suficiente detalle para cubrir los aspectos esenciales del módulo, pero evita ser excesivamente verboso. Apunta a un contenido que podría ocupar entre 1 y 3 páginas de texto si se imprimiera.
4.  **Tono Educativo**: Mantén un tono didáctico y accesible.
5.  **Idioma**: Todo el contenido generado debe estar en español.
6.  **Formato de Salida**: Devuelve el contenido como un único string en el campo "generatedContent".

Ejemplo de cómo podrías empezar el contenido para un módulo de "Introducción a la Programación" titulado "Variables y Tipos de Datos":
"En este módulo, exploraremos uno de los conceptos fundamentales en la programación: las variables y los tipos de datos. Una variable puede ser pensada como un contenedor en la memoria del ordenador donde podemos almacenar información que nuestro programa utilizará..."

Por favor, genera el contenido para el módulo especificado.
`,
});

const generateModuleContentFlow = ai.defineFlow(
  {
    name: 'generateModuleContentFlow',
    inputSchema: GenerateModuleContentInputSchema,
    outputSchema: GenerateModuleContentOutputSchema,
  },
  async (input) => {
    const {output} = await generateContentPrompt(input);
    if (!output || !output.generatedContent) {
      throw new Error('La IA no pudo generar contenido para el módulo.');
    }
    return output;
  }
);
