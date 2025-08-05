
'use server';
/**
 * @fileOverview A Genkit flow to recommend similar products based on a given product.
 * 
 * - recommendSimilarProducts - A function to get a list of similar product IDs.
 * - RecommendSimilarProductsInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { Product } from '@/lib/mock-data';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RecommendSimilarProductsInputSchema = z.object({
  productName: z.string().describe('The name of the product to find similar items for.'),
  productDescription: z.string().describe('The description of the product.'),
  productIdToExclude: z.string().describe('The ID of the current product to exclude from recommendations.'),
});
export type RecommendSimilarProductsInput = z.infer<typeof RecommendSimilarProductsInputSchema>;

// Defines the structure of each product in the catalog for the AI prompt.
const ProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
});

// Defines the output schema: an array of product IDs.
const RecommendSimilarProductsOutputSchema = z.array(z.string());

export async function recommendSimilarProducts(input: RecommendSimilarProductsInput): Promise<string[]> {
  return recommendSimilarProductsFlow(input);
}

const recommendSimilarProductsFlow = ai.defineFlow(
  {
    name: 'recommendSimilarProductsFlow',
    inputSchema: RecommendSimilarProductsInputSchema,
    outputSchema: RecommendSimilarProductsOutputSchema,
  },
  async ({ productName, productDescription, productIdToExclude }) => {

    // 1. Fetch all products from Firestore
    const productsSnapshot = await getDocs(collection(db, "products"));
    const allProducts = productsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Product))
        .filter(p => p.id !== productIdToExclude); // Exclude the current product

    // 2. Prepare the data for the AI prompt
    const productCatalog = allProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
    }));

    // 3. Define and call the AI prompt
    const prompt = ai.definePrompt({
      name: 'recommendationPrompt',
      input: {
        schema: z.object({
            productName: z.string(),
            productDescription: z.string(),
            productCatalog: z.array(ProductSchema)
        })
      },
      output: {
        schema: z.object({
            recommendedIds: z.array(z.string()).describe("An array of exactly 4 recommended product IDs.")
        })
      },
      prompt: `Tu es un styliste expert pour une boutique de mode en ligne. En te basant sur le produit consulté par le client, sélectionne exactement 4 articles les plus pertinents dans le catalogue fourni.

Produit Actuel:
- Nom: {{{productName}}}
- Description: {{{productDescription}}}

Catalogue de produits disponibles (réponds uniquement avec les IDs du catalogue) :
{{#each productCatalog}}
- ID: {{this.id}}, Nom: {{this.name}}, Description: {{this.description}}
{{/each}}

Retourne un tableau contenant uniquement les 4 IDs des produits les plus similaires en termes de style, de catégorie et d'attributs.
`,
    });

    const { output } = await prompt({
        productName,
        productDescription,
        productCatalog
    });
    
    return output?.recommendedIds || [];
  }
);
