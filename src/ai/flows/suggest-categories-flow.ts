
'use server';
/**
 * @fileOverview A Genkit flow to suggest product categories.
 * 
 * - suggestCategoriesForProduct - A function to get category suggestions.
 * - SuggestCategoriesInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SuggestCategoriesInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('The description of the product.'),
  existingCategories: z.array(z.string()).describe('A list of all existing category names in the store.'),
});
export type SuggestCategoriesInput = z.infer<typeof SuggestCategoriesInputSchema>;

const SuggestCategoriesOutputSchema = z.array(z.string()).describe('An array of suggested category names. It can include existing categories and new suggestions.');

export async function suggestCategoriesForProduct(input: SuggestCategoriesInput): Promise<string[]> {
  return suggestCategoriesFlow(input);
}

const suggestCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestCategoriesFlow',
    inputSchema: SuggestCategoriesInputSchema,
    outputSchema: SuggestCategoriesOutputSchema,
  },
  async ({ productName, productDescription, existingCategories }) => {
    
    const prompt = ai.definePrompt({
        name: "suggestCategoriesPrompt",
        input: { schema: SuggestCategoriesInputSchema },
        output: { schema: z.object({ suggestions: SuggestCategoriesOutputSchema }) },
        prompt: `You are an expert e-commerce merchandiser for a fashion store.
Based on the product name and description, suggest the most relevant categories.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}

Here is a list of all available categories:
{{#each existingCategories}}
- {{{this}}}
{{/each}}

Analyze the product and identify up to 3 of the most fitting categories from the list above.
If you think a more specific or better category is missing from the list, suggest a new category name. Do not suggest a new category if a similar one already exists. For example, if "T-Shirts" exists, do not suggest "Tee-shirt".
Return a JSON object with a "suggestions" key, which is an array of strings containing your recommended category names (both existing and new).`,
    });

    try {
      const { output } = await prompt({ productName, productDescription, existingCategories });
      return output?.suggestions || [];
    } catch (error) {
      console.error("Error in suggestCategoriesFlow:", error);
      // In case of an error, return an empty array to avoid breaking the UI.
      return [];
    }
  }
);
