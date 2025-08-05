
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

const SendEmailInputSchema = z.object({
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
      const errorMessage = "La clé API Brevo n'est pas configurée. Impossible d'envoyer l'e-mail.";
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    // IMPORTANT: L'adresse e-mail de l'expéditeur doit être validée dans votre compte Brevo.
    // Nous utilisons l'e-mail de l'admin car il a plus de chances d'être validé.
    sendSmtpEmail.sender = { name: 'LE QG DE LA SAPE', email: 'le.qg10delasape@gmail.com' };

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      return { success: true, message: 'E-mail envoyé avec succès.' };
    } catch (error: any) {
      const errorMessage = 'Échec de l\'envoi de l\'e-mail via le service externe.';
      // Log plus détaillé de l'erreur venant de Brevo
      console.error(errorMessage, error.response?.body || error.message);
      // Retourner un échec sans bloquer le reste de l'application
      return { success: false, message: `${errorMessage} Détail : ${error.response?.body?.message || error.message}` };
    }
  }
);
