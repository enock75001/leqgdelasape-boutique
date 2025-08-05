'use server';
/**
 * @fileOverview Un flux Genkit pour envoyer un e-mail de réinitialisation de mot de passe.
 *
 * - sendPasswordResetEmail - Une fonction pour envoyer l'e-mail.
 * - SendPasswordResetEmailInput - Le type d'entrée pour la fonction.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as SibApiV3Sdk from '@sendinblue/client';

const SendPasswordResetEmailInputSchema = z.object({
  email: z.string().email().describe("L'adresse e-mail de l'utilisateur demandant la réinitialisation."),
  resetLink: z.string().url().describe("Le lien de réinitialisation de mot de passe à inclure dans l'e-mail."),
});

export type SendPasswordResetEmailInput = z.infer<typeof SendPasswordResetEmailInputSchema>;

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<{ success: boolean; message?: string }> {
  return sendPasswordResetEmailFlow(input);
}

const getPasswordResetEmailHtml = (resetLink: string) => {
  return `
    <h1>Réinitialisation de votre mot de passe</h1>
    <p>Bonjour,</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte LE QG DE LA SAPE.</p>
    <p>Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
    <p><a href="${resetLink}" target="_blank">Réinitialiser mon mot de passe</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail.</p>
    <p>Merci,</p>
    <p>L'équipe LE QG DE LA SAPE</p>
  `;
};

const sendPasswordResetEmailFlow = ai.defineFlow(
  {
    name: 'sendPasswordResetEmailFlow',
    inputSchema: SendPasswordResetEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  },
  async ({ email, resetLink }) => {
    if (!process.env.BREVO_API_KEY) {
      const errorMessage = "La clé API Brevo n'est pas configurée.";
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = 'Réinitialisation de votre mot de passe LE QG DE LA SAPE';
    sendSmtpEmail.htmlContent = getPasswordResetEmailHtml(resetLink);
    sendSmtpEmail.sender = { name: 'LE QG DE LA SAPE', email: 'le.qg10delasape@gmail.com' };

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return { success: true, message: 'E-mail de réinitialisation envoyé avec succès.' };
    } catch (error: any) {
      const errorMessage = 'Échec de l\'envoi de l\'e-mail de réinitialisation.';
      console.error(errorMessage, error.response?.body || error.message);
      return { success: false, message: `${errorMessage} Détail : ${error.response?.body?.message || error.message}` };
    }
  }
);
