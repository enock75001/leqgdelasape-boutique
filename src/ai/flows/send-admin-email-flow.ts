
'use server';
/**
 * @fileOverview Un flux Genkit pour envoyer des e-mails transactionnels à l'administrateur via Resend.
 *
 * - sendAdminEmail - Une fonction pour envoyer un e-mail à l'admin.
 * - SendAdminEmailInput - Le type d'entrée pour la fonction sendAdminEmail.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Resend } from 'resend';

const SendAdminEmailInputSchema = z.object({
  to: z.string().email().describe("L'adresse e-mail du destinataire (admin)."),
  subject: z.string().describe("L'objet de l'e-mail."),
  htmlContent: z.string().describe("Le contenu HTML de l'e-mail."),
});

export type SendAdminEmailInput = z.infer<typeof SendAdminEmailInputSchema>;

export async function sendAdminEmail(input: SendAdminEmailInput): Promise<{ success: boolean; message?: string }> {
  return sendAdminEmailFlow(input);
}

const sendAdminEmailFlow = ai.defineFlow(
  {
    name: 'sendAdminEmailFlow',
    inputSchema: SendAdminEmailInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  },
  async (input) => {
    const { to, subject, htmlContent } = input;

    // Assurez-vous que la clé API Resend est définie
    if (!process.env.RESEND_API_KEY) {
      const errorMessage = "La clé API Resend n'est pas configurée.";
      console.error(errorMessage);
      return { success: false, message: errorMessage };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
      await resend.emails.send({
        from: 'LE QG DE LA SAPE <onboarding@resend.dev>', // Doit être un domaine vérifié sur Resend
        to: to,
        subject: subject,
        html: htmlContent,
      });
      return { success: true, message: 'E-mail administrateur envoyé avec succès via Resend.' };
    } catch (error: any) {
      const errorMessage = 'Échec de l\'envoi de l\'e-mail administrateur via Resend.';
      console.error(errorMessage, error.message);
      return { success: false, message: `${errorMessage} Détail : ${error.message}` };
    }
  }
);
