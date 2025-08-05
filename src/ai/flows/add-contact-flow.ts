'use server';
/**
 * @fileOverview Un flux Genkit pour ajouter ou mettre à jour un contact dans Brevo.
 *
 * - addContact - Une fonction pour ajouter un contact à une liste Brevo.
 * - AddContactInput - Le type d'entrée pour la fonction addContact.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as SibApiV3Sdk from '@sendinblue/client';

const AddContactInputSchema = z.object({
  email: z.string().email().describe("L'adresse e-mail du contact."),
  // Vous pouvez ajouter d'autres attributs ici si nécessaire (ex: nom, prénom)
});

export type AddContactInput = z.infer<typeof AddContactInputSchema>;

export async function addContact(input: AddContactInput): Promise<{ success: boolean; message?: string }> {
  return addContactFlow(input);
}

const addContactFlow = ai.defineFlow(
  {
    name: 'addContactFlow',
    inputSchema: AddContactInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  },
  async (input) => {
    const { email } = input;
    
    // Assurez-vous que la clé API Brevo est définie dans les variables d'environnement
    if (!process.env.BREVO_API_KEY) {
      const errorMessage = "La clé API Brevo n'est pas configurée. Impossible d'ajouter le contact.";
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const apiInstance = new SibApiV3Sdk.ContactsApi();
    apiInstance.setApiKey(SibApiV3Sdk.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const createContact = new SibApiV3Sdk.CreateContact();
    createContact.email = email;
    createContact.listIds = [2]; // IMPORTANT : Remplacez 2 par l'ID de votre liste de contacts Brevo
    // createContact.attributes = { 'NOM': 'Doe', 'PRENOM': 'John' }; // Décommentez pour ajouter des attributs
    createContact.updateEnabled = true; // Mettre à jour le contact s'il existe déjà

    try {
      await apiInstance.createContact(createContact);
      return { success: true, message: `Contact ${email} ajouté/mis à jour avec succès.` };
    } catch (error) {
      const errorMessage = `Échec de l'ajout du contact ${email} à Brevo.`;
      console.error(errorMessage, error);
      // Ne pas retourner une erreur bloquante pour ne pas interrompre le parcours utilisateur
      return { success: false, message: errorMessage };
    }
  }
);
