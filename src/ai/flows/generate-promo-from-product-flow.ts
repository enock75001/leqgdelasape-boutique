
'use server';
/**
 * @fileOverview A Genkit flow to generate a promotional slide from a product.
 *
 * - generatePromoFromProduct - A function to trigger the promotion generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Promotion } from '@/lib/mock-data';

// Define the input schema, which is just the product ID.
const GeneratePromoInputSchema = z.string().describe("The ID of the product to create a promotion for.");

// Define the output schema for the flow.
const GeneratePromoOutputSchema = z.object({
  promoId: z.string().optional(),
  error: z.string().optional(),
});

export async function generatePromoFromProduct(productId: string): Promise<z.infer<typeof GeneratePromoOutputSchema>> {
  return generatePromoFromProductFlow(productId);
}

// Define the schema for the data that will be passed to the prompt template.
const PromptInputSchema = z.object({
  productName: z.string(),
  productDescription: z.string(),
  productCategories: z.array(z.string()),
});

// Define the schema for the expected output from the AI model.
const AISchema = z.object({
  title: z.string().describe("A very short, catchy promotional title (max 5 words). Example: 'L'Élégance Redéfinie'"),
  description: z.string().describe("A short, appealing promotional description (max 15 words). Example: 'Découvrez notre nouvelle collection, où le style rencontre le confort.'"),
});

// Define the AI prompt.
const promoGenerationPrompt = ai.definePrompt({
    name: "promoGenerationPrompt",
    input: { schema: PromptInputSchema },
    output: { schema: AISchema },
    prompt: `You are a marketing expert for a high-end fashion brand. Based on the product details below, create a short, catchy promotional title and a compelling description for a homepage carousel slide.

Product Name: {{{productName}}}
Product Description: {{{productDescription}}}
Categories: {{#each productCategories}}{{{this}}}{{/each}}

Keep the title under 5 words and the description under 15 words. The tone should be modern, stylish, and aspirational.`,
});


const generatePromoFromProductFlow = ai.defineFlow(
  {
    name: 'generatePromoFromProductFlow',
    inputSchema: GeneratePromoInputSchema,
    outputSchema: GeneratePromoOutputSchema,
  },
  async (productId) => {
    // 1. Fetch product data from Firestore.
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return { error: "Produit non trouvé." };
    }
    const product = productSnap.data() as Product;

    if (!product.imageUrls || product.imageUrls.length === 0) {
        return { error: "Le produit n'a pas d'image principale."};
    }

    // 2. Call the AI model to generate promotional text.
    try {
        const { output } = await promoGenerationPrompt({
            productName: product.name,
            productDescription: product.description,
            productCategories: product.categories || [],
        });

        if (!output) {
            return { error: "L'IA n'a pas pu générer de texte promotionnel." };
        }

        // 3. Create a new promotion document in Firestore.
        const newPromotion: Omit<Promotion, 'id'> = {
            title: output.title,
            description: output.description,
            image: product.imageUrls[0], // Use the first image of the product
            hint: product.categories?.join(' ') || 'fashion', // Use categories as hint
            link: `/products/${productId}`, // Link directly to the product page
            enabled: true, // Enable by default
        };

        const promoCollectionRef = collection(db, "promotions");
        const docRef = await addDoc(promoCollectionRef, newPromotion);

        return { promoId: docRef.id };

    } catch (e: any) {
        console.error("Error during promo generation flow:", e);
        return { error: e.message || "Une erreur inconnue est survenue lors de la génération." };
    }
  }
);
