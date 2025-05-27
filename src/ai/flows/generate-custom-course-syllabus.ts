
'use server';
/**
 * @fileOverview Generates a custom course syllabus based on user inputs.
 *
 * - generateCustomCourseSyllabus - A function that handles syllabus generation.
 * - GenerateCustomCourseSyllabusInput - The input type.
 * - GenerateCustomCourseSyllabusOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateCustomCourseSyllabusInputSchema = z.object({
  courseTopic: z.string().describe('The main topic or subject of the course. Example: "Química para 1º de Bachillerato", "Introducción a la Programación con Python".'),
  courseLevel: z.enum(['Principiante', 'Intermedio', 'Avanzado']).describe('The intended level of the course.'),
  courseGoals: z.string().optional().describe('Optional. Main learning objectives or goals for the students taking this course. Example: "Entender los principios básicos de la termodinámica y ser capaz de resolver problemas estequiométricos."'),
  targetAudience: z.string().optional().describe('Optional. Describe the target audience for this course. Example: "Estudiantes de secundaria con interés en ciencias", "Profesionales que quieren reconvertirse al sector tecnológico".'),
});
export type GenerateCustomCourseSyllabusInput = z.infer<typeof GenerateCustomCourseSyllabusInputSchema>;

export const GenerateCustomCourseSyllabusOutputSchema = z.object({
  syllabusItems: z.array(z.string()).describe('A list of main topics or modules for the course syllabus. Each item should be a concise title for a section or unit.'),
  estimatedDuration: z.string().describe('An estimated duration for the course. Example: "Aproximadamente 4-6 semanas, dedicando 5 horas por semana".'),
  courseTitleSuggestion: z.string().describe('A catchy and descriptive title suggestion for the course.'),
});
export type GenerateCustomCourseSyllabusOutput = z.infer<typeof GenerateCustomCourseSyllabusOutputSchema>;

export async function generateCustomCourseSyllabus(input: GenerateCustomCourseSyllabusInput): Promise<GenerateCustomCourseSyllabusOutput> {
  return generateCustomCourseSyllabusFlow(input);
}

const generateSyllabusPrompt = ai.definePrompt({
  name: 'generateCustomCourseSyllabusPrompt',
  input: {schema: GenerateCustomCourseSyllabusInputSchema},
  output: {schema: GenerateCustomCourseSyllabusOutputSchema},
  prompt: `Eres un experto diseñador de currículums y educador. Tu tarea es generar una propuesta de temario detallado y atractivo para un curso personalizado, junto con una duración estimada y una sugerencia de título para el curso.

Información del curso proporcionada por el usuario:
- Tema Principal del Curso: {{{courseTopic}}}
- Nivel del Curso: {{{courseLevel}}}
{{#if courseGoals}}
- Objetivos Principales: {{{courseGoals}}}
{{/if}}
{{#if targetAudience}}
- Público Objetivo: {{{targetAudience}}}
{{/if}}

Basado en esta información, por favor, genera:
1.  **Sugerencia de Título del Curso (courseTitleSuggestion)**: Un título que sea conciso, atractivo y refleje el contenido y nivel del curso.
2.  **Temario (syllabusItems)**: Una lista de entre 5 y 10 módulos o unidades principales que compondrían el curso. Cada ítem del temario debe ser un título claro y conciso para esa sección. El temario debe ser coherente con el tema, nivel, objetivos y público del curso.
3.  **Duración Estimada (estimatedDuration)**: Una estimación realista de la duración del curso (ej. "Aproximadamente 4-6 semanas, dedicando 5 horas por semana", "Unas 20 horas de contenido total").

Asegúrate de que toda la salida esté en español.
Devuelve únicamente un objeto JSON con las claves "courseTitleSuggestion", "syllabusItems", y "estimatedDuration".
`,
});

const generateCustomCourseSyllabusFlow = ai.defineFlow(
  {
    name: 'generateCustomCourseSyllabusFlow',
    inputSchema: GenerateCustomCourseSyllabusInputSchema,
    outputSchema: GenerateCustomCourseSyllabusOutputSchema,
  },
  async (input) => {
    const {output} = await generateSyllabusPrompt(input);
    if (!output) {
      throw new Error('La IA no pudo generar una propuesta de temario.');
    }
    // Ensure syllabusItems is always an array, even if AI fails to produce it as such
    if (!Array.isArray(output.syllabusItems)) {
        output.syllabusItems = ['Error: No se pudo generar el temario. Intenta de nuevo.'];
    }
    return output;
  }
);
