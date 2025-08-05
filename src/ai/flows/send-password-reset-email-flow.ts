
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
    <body style="font-family: Arial, sans-serif; background-color: #f4f4f7; color: #333; margin: 0; padding: 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
                <td align="center">
                    <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #ffffff; padding: 20px;">
                                <img src="https://i.postimg.cc/BZmF1f1y/Whats-App-Image-2025-08-05-11-40-27-cdafc518.jpg" alt="Logo" width="40" height="40" style="border-radius: 50%; object-fit: cover; margin-right: 10px; vertical-align: middle;">
                                <h1 style="display: inline-block; vertical-align: middle; margin: 0; font-size: 24px; font-weight: bold; color: #333;">LE QG DE LA SAPE</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 30px 25px;">
                                <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 15px;">Réinitialisez votre mot de passe</h2>
                                <p>Bonjour,</p>
                                <p style="margin-bottom: 25px;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                    <td align="center">
                                      <a href="${resetLink}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
                                    </td>
                                  </tr>
                                </table>
                                <p style="margin-top: 25px; font-size: 12px; color: #6c757d;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px;">
                                <p style="margin: 0;">© ${new Date().getFullYear()} LE QG DE LA SAPE. Tous droits réservés.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
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
