'use server';
/**
 * @fileOverview A Genkit flow to generate an image from a text prompt.
 *
 * - generateImage - A function to generate an image.
 * - GenerateImageInput - The input type for the function (a string prompt).
 * - GenerateImageOutput - The return type, containing the image data URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImageInputSchema = z.string().describe("The text prompt to generate an image from.");
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
    imageDataUri: z.string().describe("The generated image as a data URI (e.g., 'data:image/png;base64,...')."),
    error: z.string().optional().describe("An error message if the generation failed."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(prompt: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(prompt);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (prompt) => {
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: prompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (!media?.url) {
            return { imageDataUri: '', error: "L'IA n'a pas retourné d'image. Réessayez avec un prompt différent." };
        }

        return { imageDataUri: media.url, error: undefined };

    } catch (e: any) {
        console.error("AI image generation failed:", e);
        let friendlyMessage = 'La génération d\'image par IA a échoué.';
        if (e.message?.includes('429') || e.message?.includes('resource has been exhausted')) {
            friendlyMessage = 'Le service est surchargé ou vous avez atteint votre quota. Veuillez réessayer plus tard.';
        } else if (e.message?.includes('prompt was blocked')) {
            friendlyMessage = 'Votre description a été bloquée par les filtres de sécurité. Essayez une autre formulation.';
        }
        return { imageDataUri: '', error: friendlyMessage };
    }
  }
);
