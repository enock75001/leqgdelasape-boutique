
'use server';
/**
 * @fileOverview A Genkit flow to generate a product description from an image.
 *
 * - generateProductDescription - A function to generate a description.
 * - GenerateProductDescriptionInput - The input type for the function.
 * - GenerateProductDescriptionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateProductDescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe("The generated product description."),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema },
  prompt: `Tu es un expert en marketing et copywriting pour une marque de vêtements tendance. En te basant sur l'image fournie, rédige une description de produit attrayante et détaillée.

La description doit être engageante, utiliser un ton moderne et inclure les éléments suivants :
- Un titre accrocheur ou une phrase d'introduction.
- Une description du style général de l'article (ex: streetwear, décontracté, élégant).
- Des suggestions sur les occasions où porter cet article.
- Une description des matériaux que tu imagines (ex: coton doux, tissu respirant).
- À quel type de personne cet article plairait-il ?

Image du produit : {{media url=photoDataUri}}`,
});


const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
