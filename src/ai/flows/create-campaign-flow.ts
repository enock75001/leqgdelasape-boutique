'use server';
/**
 * @fileOverview A Genkit flow for creating and sending email campaigns via Brevo.
 *
 * - createCampaign - A function to create an email campaign.
 * - CreateCampaignInput - The input type for the createCampaign function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as SibApiV3Sdk from '@sendinblue/client';

const CreateCampaignInputSchema = z.object({
  name: z.string().describe('The name of the campaign.'),
  subject: z.string().describe('The subject of the campaign email.'),
  htmlContent: z.string().describe('The HTML content of the email.'),
  listIds: z.array(z.number()).describe('An array of Brevo list IDs to send the campaign to.'),
});

export type CreateCampaignInput = z.infer<typeof CreateCampaignInputSchema>;

// This function is a wrapper that calls the Genkit flow.
export async function createCampaign(input: CreateCampaignInput): Promise<{ success: boolean; message?: string }> {
  return createCampaignFlow(input);
}

const createCampaignFlow = ai.defineFlow(
  {
    name: 'createCampaignFlow',
    inputSchema: CreateCampaignInputSchema,
    outputSchema: z.object({ success: z.boolean(), message: z.string().optional() }),
  },
  async (input) => {
    const { name, subject, htmlContent, listIds } = input;

    // Ensure Brevo API key is set in environment variables
    if (!process.env.BREVO_API_KEY) {
      console.error("Brevo API key is not set. Please add it to your .env file");
      return { success: false, message: "Brevo API key is not configured." };
    }

    const apiInstance = new SibApiV3Sdk.EmailCampaignsApi();
    apiInstance.setApiKey(SibApiV3Sdk.EmailCampaignsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

    const emailCampaign = new SibApiV3Sdk.CreateEmailCampaign();
    
    emailCampaign.name = name;
    emailCampaign.subject = subject;
    emailCampaign.htmlContent = htmlContent;
    emailCampaign.sender = { name: 'LE QG DE LA SAPE', email: 'no-reply@leqgdelasape.com' }; // Replace with your sender email
    emailCampaign.type = "classic";
    emailCampaign.recipients = { listIds };
    // You can also add `scheduledAt` for scheduling the campaign
    // emailCampaign.scheduledAt = '2024-01-01 00:00:01';

    try {
      await apiInstance.createEmailCampaign(emailCampaign);
      return { success: true, message: 'Campaign created successfully. It will be sent shortly.' };
    } catch (error) {
      console.error('Error creating campaign with Brevo:', error);
      return { success: false, message: 'Failed to create the campaign.' };
    }
  }
);
