'use server';

/**
 * @fileOverview This file defines a Genkit flow for moderating user-generated content in a community feed.
 *
 * It includes:
 * - moderateCommunityContent - A function to moderate community content.
 * - ModerateCommunityContentInput - The input type for the moderateCommunityContent function.
 * - ModerateCommunityContentOutput - The output type for the moderateCommunityContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateCommunityContentInputSchema = z.object({
  content: z
    .string()
    .describe('The text content to be checked against community guidelines.'),
});
export type ModerateCommunityContentInput = z.infer<
  typeof ModerateCommunityContentInputSchema
>;

const ModerateCommunityContentOutputSchema = z.object({
  isViolating: z
    .boolean()
    .describe(
      'Whether the content violates community guidelines (true) or not (false).'
    ),
  reason: z
    .string()
    .describe(
      'The reason why the content is considered violating, if applicable.'
    ),
});
export type ModerateCommunityContentOutput = z.infer<
  typeof ModerateCommunityContentOutputSchema
>;

export async function moderateCommunityContent(
  input: ModerateCommunityContentInput
): Promise<ModerateCommunityContentOutput> {
  return moderateCommunityContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateCommunityContentPrompt',
  input: {schema: ModerateCommunityContentInputSchema},
  output: {schema: ModerateCommunityContentOutputSchema},
  prompt: `You are a content moderator for a community forum. Your task is to determine whether the given content violates the community guidelines.

Community Guidelines:
- No hate speech or discrimination.
- No harassment or bullying.
- No sexually explicit content.
- No illegal activities.
- No spam or misleading information.
- Respectful communication is expected from all users of this platform.

Content to be moderated: {{{content}}}

Based on these guidelines, determine if the content violates the guidelines. If it does, explain why. Return your response as a JSON object.`,
});

const moderateCommunityContentFlow = ai.defineFlow(
  {
    name: 'moderateCommunityContentFlow',
    inputSchema: ModerateCommunityContentInputSchema,
    outputSchema: ModerateCommunityContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
