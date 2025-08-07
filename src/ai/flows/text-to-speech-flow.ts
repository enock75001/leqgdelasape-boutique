
'use server';
/**
 * @fileOverview A Genkit flow to convert text to speech.
 * 
 * - textToSpeech - A function to convert text into a playable audio data URI.
 * - TextToSpeechInput - The input type for the function (a string).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const TextToSpeechInputSchema = z.string().describe("The text to be converted to speech.");
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

export async function textToSpeech(input: TextToSpeechInput): Promise<{ media: string }> {
  return textToSpeechFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: z.object({ media: z.string().describe("The audio data URI in WAV format.") }),
  },
  async (query) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A standard male voice
          },
        },
      },
      prompt: query,
    });
    
    if (!media?.url) {
      throw new Error('No audio media was returned from the AI model.');
    }
    
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    
    const wavBase64 = await toWav(audioBuffer);

    return {
      media: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);
