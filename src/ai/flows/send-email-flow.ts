'use server';
/**
 * @fileOverview Un flux Genkit pour envoyer des e-mails transactionnels via Brevo.
 *
 * - sendEmail - Une fonction pour envoyer un e-mail.
 * - SendEmailInput - Le type d'entrée pour la fonction sendEmail.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as SibApiV3Sdk from '@sendinblue/client';

export const SendEmailInputSchema = z.object({
  to: z.string().email().describe("L'adresse e-mail du destinataire."),
  subject: z.string().describe("L'objet de l'e-mail."),
  htmlContent: z.string().describe("Le contenu HTML de l'e-mail."),
});

export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

// Cette fonction est une enveloppe qui appelle le flux Genkit.
export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; message?: string }> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  },
  async (input) => {
    const { to, subject, htmlContent } = input;

    // Assurez-vous que la clé API Brevo est définie dans les variables d'environnement
    if (!process.env.BREVO_API_KEY) {
      console.error("La clé API Brevo n'est pas configurée. Veuillez l'ajouter à votre fichier .env");
      // Pour le développement, nous pouvons simuler un succès sans réellement envoyer d'e-mail.
      // Dans une application de production, vous devriez lancer une erreur ici.
      return { success: false, message: "La clé API Brevo n'est pas configurée." };
    }

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: 'LE QG DE LA SAPE', email: 'no-reply@leqgdelasape.com' }; // Remplacez par votre e-mail d'expéditeur

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return { success: true, message: 'E-mail envoyé avec succès.' };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail via Brevo:', error);
      return { success: false, message: 'Échec de l\'envoi de l\'e-mail.' };
    }
  }
);
