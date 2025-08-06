
'use server';
/**
 * @fileOverview Un agent conversationnel IA pour conseiller sur la gestion des stocks.
 * 
 * - stockAdvisorFlow - Le flux principal qui gère la conversation.
 * - getLowStockProducts - Un outil qui récupère les produits avec un stock bas.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Variant } from '@/lib/mock-data';

// Schéma pour la sortie de l'outil qui récupère les produits à faible stock
const LowStockProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  variants: z.array(z.object({
    size: z.string(),
    stock: z.number(),
  })),
  totalStock: z.number(),
});
export type LowStockProduct = z.infer<typeof LowStockProductSchema>;

// Outil Genkit pour obtenir les produits avec un stock bas
const getLowStockProducts = ai.defineTool(
  {
    name: 'getLowStockProducts',
    description: 'Récupère la liste des produits dont le stock total est inférieur à un seuil donné.',
    inputSchema: z.object({
      threshold: z.number().default(5).describe('Le seuil de stock en dessous duquel un produit est considéré comme bas.'),
    }),
    outputSchema: z.array(LowStockProductSchema),
  },
  async ({ threshold }) => {
    const productsSnapshot = await getDocs(collection(db, "products"));
    const allProducts = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

    const lowStockProducts = allProducts.reduce((acc, product) => {
        const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
        if (totalStock < threshold) {
            acc.push({
                id: product.id,
                name: product.name,
                variants: product.variants.map(v => ({ size: v.size, stock: v.stock })),
                totalStock: totalStock,
            });
        }
        return acc;
    }, [] as LowStockProduct[]);
    
    return lowStockProducts;
  }
);


// Le flux principal de l'agent conversationnel
export const stockAdvisorFlow = ai.defineFlow(
  {
    name: 'stockAdvisorFlow',
    inputSchema: z.string().describe("La question de l'utilisateur concernant les stocks."),
    outputSchema: z.string().describe("La réponse de l'IA."),
  },
  async (prompt) => {

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.0-flash',
      tools: [getLowStockProducts],
      system: `Tu es un conseiller expert en gestion de stock pour une boutique de vêtements e-commerce.
        - Ton rôle est d'aider le gérant à identifier les problèmes de stock et à prendre des décisions.
        - Utilise l'outil 'getLowStockProducts' pour obtenir des informations en temps réel sur les produits.
        - Réponds de manière concise et claire, en français.
        - Si tu identifies des produits à faible stock, liste-les clairement avec leur nom et le stock restant.
        - Si aucun produit n'a un stock bas, rassure l'utilisateur en lui disant que tout est en ordre.
        - N'invente pas d'informations. Base-toi uniquement sur les données de l'outil.
        `,
    });

    return llmResponse.text;
  }
);
