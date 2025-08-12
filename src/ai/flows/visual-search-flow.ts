
'use server';
/**
 * @fileOverview Un flux Genkit pour trouver des produits similaires à partir d'une image.
 *
 * - findSimilarProductsByImage - Analyse une image et renvoie les ID de produits similaires.
 * - FindSimilarProductsInput - Le type d'entrée pour la fonction.
 * - FindSimilarProductsOutput - Le type de sortie de la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const FindSimilarProductsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "Une photo d'un article de mode, sous forme de data URI avec encodage Base64. Format attendu : 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FindSimilarProductsInput = z.infer<typeof FindSimilarProductsInputSchema>;

const FindSimilarProductsOutputSchema = z.object({
    similarProductIds: z.array(z.string()).describe("Un tableau d'ID de produits correspondants."),
});
export type FindSimilarProductsOutput = z.infer<typeof FindSimilarProductsOutputSchema>;

export async function findSimilarProductsByImage(input: FindSimilarProductsInput): Promise<FindSimilarProductsOutput> {
  return visualSearchFlow(input);
}

// Schéma pour la description visuelle générée par l'IA
const VisualDescriptionSchema = z.object({
    description: z.string().describe("Une description textuelle détaillée de l'article de mode principal sur l'image, incluant le type, la couleur, le style et tout autre détail pertinent."),
});

// Schéma pour la structure d'un produit dans le catalogue
const ProductSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    categories: z.array(z.string()).optional(),
});


const visualSearchFlow = ai.defineFlow(
  {
    name: 'visualSearchFlow',
    inputSchema: FindSimilarProductsInputSchema,
    outputSchema: FindSimilarProductsOutputSchema,
  },
  async ({ photoDataUri }) => {
    // 1. Générer une description textuelle à partir de l'image
    const descriptionPrompt = ai.definePrompt({
        name: 'visualDescriptionPrompt',
        input: { schema: z.object({ photo: z.string() }) },
        output: { schema: VisualDescriptionSchema },
        prompt: `Analyse cette image d'un article de mode. Décris l'article principal en détail, en te concentrant sur des mots-clés qui seraient utiles pour une recherche dans une base de données de vêtements. Inclus le type de vêtement (ex: t-shirt, robe, pantalon), la couleur principale, le style (ex: streetwear, formel, décontracté), et les motifs ou textures visibles.

Image: {{media url=photo}}`,
    });
    
    const { output: descriptionOutput } = await descriptionPrompt({ photo: photoDataUri });
    if (!descriptionOutput?.description) {
        console.warn("L'IA n'a pas pu générer de description pour l'image.");
        return { similarProductIds: [] };
    }
    const visualDescription = descriptionOutput.description;

    // 2. Récupérer tous les produits de la base de données
    const productsSnapshot = await getDocs(collection(db, "products"));
    const allProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || '',
        description: doc.data().description || '',
        categories: doc.data().categories || [],
    }));

    // 3. Utiliser un autre prompt IA pour faire la correspondance (matching)
    const matchingPrompt = ai.definePrompt({
        name: 'productMatchingPrompt',
        input: {
            schema: z.object({
                searchDescription: z.string(),
                productCatalog: z.array(ProductSchema)
            })
        },
        output: {
            schema: z.object({
                matchedIds: z.array(z.string()).describe("Un tableau des 4 ID de produits les plus pertinents du catalogue.")
            })
        },
        prompt: `Tu es un expert en stylisme. En te basant sur la description de recherche suivante, sélectionne les 4 articles les plus similaires dans le catalogue de produits fourni.

Description de recherche : "{{{searchDescription}}}"

Catalogue de produits :
{{#each productCatalog}}
- ID: {{this.id}}, Nom: {{this.name}}, Description: {{this.description}}, Catégories: {{#each this.categories}}{{{this}}}{{/each}}
{{/each}}

Retourne un tableau contenant uniquement les 4 IDs des produits qui correspondent le mieux à la description.`,
    });

    const { output: matchingOutput } = await matchingPrompt({
        searchDescription: visualDescription,
        productCatalog: allProducts
    });
    
    return { similarProductIds: matchingOutput?.matchedIds || [] };
  }
);
