'use server';
/**
 * @fileOverview A Genkit flow to generate a visual description from a text query.
 * 
 * - generateVisualQuery - A function to convert a search term into a visual description.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateVisualQueryInputSchema = z.object({
  query: z.string().describe('The user\'s search query, e.g., "jogging".'),
});

const GenerateVisualQueryOutputSchema = z.object({
  visualDescription: z.string().describe('A descriptive sentence of what the item might look like. For example, for "jogging", a good description would be "A comfortable two-piece tracksuit, often made of soft, breathable fabric, suitable for sports or casual wear."'),
});

export async function generateVisualQuery(query: string): Promise<string> {
  const result = await generateVisualQueryFlow({ query });
  return result.visualDescription;
}

const generateVisualQueryFlow = ai.defineFlow(
  {
    name: 'generateVisualQueryFlow',
    inputSchema: GenerateVisualQueryInputSchema,
    outputSchema: GenerateVisualQueryOutputSchema,
  },
  async ({ query }) => {
    const prompt = `Based on the user's search query for a clothing item, generate a concise, one-sentence visual description of that item. This description will be used to semantically search a product database.

User query: "${query}"

Visual description:`;
    
    const { output } = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      output: {
        schema: GenerateVisualQueryOutputSchema,
      },
    });

    return output || { visualDescription: query }; // Fallback to the original query
  }
);
