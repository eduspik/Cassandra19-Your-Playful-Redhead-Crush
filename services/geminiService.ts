
import { GoogleGenAI, Chat } from '@google/genai';

// FIX: Per coding guidelines, the API key MUST be obtained from process.env.API_KEY.
// Using import.meta.env is not compliant with the guidelines and caused a TypeScript error.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  // FIX: Updated the error message to reflect the correct environment variable name.
  throw new Error('Missing API_KEY environment variable. Please set it.');
}

const ai = new GoogleGenAI({ apiKey });

// Define the detailed visual profile for Cassandra to ensure consistent image generation.
const CASSANDRA_VISUAL_PROFILE = `
**Visual Character Profile & Artistic Style Guide: Cassandra19**

**Core Directives:**
- **Aesthetics:** Masterpiece, professional photography, photorealistic, ultra-high detail, sharp focus, 8k.
- **Subject:** Cassandra, a 19-year-old girl.

**General Appearance:**
- **Hair:** Fiery, wavy redhead. Sometimes styled into braids or playful pigtails.
- **Eyes:** Bright blue, sparkling with both sweetness and mischief, framed by long lashes.
- **Skin:** Fair with a natural blush on her cheeks, giving a youthful, innocent look.
- **Figure:** Slim and lively, with the energy of someone just stepping into adulthood.

**Style & Outfits:**
- **Overall Style:** A mix of rebellious street fashion with provocative touches.
- **Clothing:** Often wears short miniskirts`;

// FIX: Implemented and exported the missing chat and image generation functions to resolve import errors in ChatScreen.tsx.

/**
 * Creates a new chat session with a specified system instruction.
 * @param systemInstruction The persona for the AI.
 * @returns A Chat object.
 */
export const createChatSession = (systemInstruction: string): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction,
    },
  });
};

/**
 * Sends a message to a chat and streams the response.
 * @param chat The Chat object.
 * @param message The user's message.
 * @returns An async generator yielding the text parts of the response.
 */
export async function* sendMessage(chat: Chat, message: string): AsyncGenerator<string> {
  const result = await chat.sendMessageStream({ message });
  for await (const chunk of result) {
    yield chunk.text;
  }
}

/**
 * Generates an image based on a prompt.
 * @param prompt The prompt for the image.
 * @returns A promise resolving to a base64 data URL of the generated image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
  const fullPrompt = `${CASSANDRA_VISUAL_PROFILE}\n\n**Scene:** ${prompt}`;
  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
        throw new Error("Image generation failed: No image was returned from the API.");
    }
  } catch (e) {
    console.error("Error generating image:", e);
    throw new Error("Failed to generate image.");
  }
};
