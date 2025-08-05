
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
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  title: z.string().describe("The generated product title."),
  description: z.string().describe("The generated product description."),
  error: z.string().optional().describe("An error message if the generation failed."),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: { schema: GenerateProductDescriptionInputSchema },
  output: { schema: GenerateProductDescriptionOutputSchema.omit({ error: true }) },
  prompt: `Tu es un expert en marketing et copywriting pour une marque de vêtements tendance. En te basant sur l'image fournie, rédige une description de produit attrayante et un titre percutant.

La réponse doit inclure :
- Un titre de produit court et accrocheur.
- Une description détaillée et engageante qui utilise un ton moderne et inclut :
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
    try {
        const { output } = await prompt(input);
        if (!output) {
             return { title: '', description: '', error: "La génération a échoué car le modèle n'a renvoyé aucune sortie." };
        }
        return { ...output, error: undefined };
    } catch (e: any) {
        console.error("AI generation failed:", e);
        // Extract a more user-friendly error message if possible
        const errorMessage = e.message || 'Une erreur inconnue est survenue.';
        let friendlyMessage = 'La génération par IA a échoué.';
        if (errorMessage.includes('503')) {
            friendlyMessage = 'Le service IA est actuellement surchargé. Veuillez réessayer dans quelques instants.';
        } else if (errorMessage.toLowerCase().includes('billing')) {
            friendlyMessage = 'Un problème de facturation est survenu avec le service IA.';
        }
        return { title: '', description: '', error: friendlyMessage };
    }
  }
);
