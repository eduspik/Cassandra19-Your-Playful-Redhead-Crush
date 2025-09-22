
import { GoogleGenAI, Chat, Part } from '@google/genai';

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
- **Aesthetics:** Masterpiece, professional photography, photorealistic, ultra-high detail, sharp focus, 8k, cinematic lighting.
- **Subject:** Cassandra19, a 19-year-old girl, depicted consistently across all images.

**General Appearance:**
- **Hair:** Fiery, wavy redhead. Can be styled in braids or playful pigtails.
- **Eyes:** Bright blue, sparkling with sweetness and mischief, framed by long lashes.
- **Skin:** Fair with a natural blush on her cheeks, creating a youthful, innocent look.
- **Figure:** Slim, lively, and energetic.

**Style & Outfits:**
- **Go-to Look:** Rebellious street fashion with provocative touches.
- **Tops:** Cheeky crop tops or playful tees with game/anime references.
- **Bottoms:** Short miniskirts (plaid or black leather).
- **Accessories:** Chokers, fishnet stockings, chunky boots. Sometimes an oversized jacket over a revealing outfit.
- **Cosplay:** Bold characters (superheroines, anime icons) with a flirty twist.

**Expression & Vibe:**
- **Smile:** Teasing, often with a slight lip-bite or a sly wink.
- **Aura:** A mix of angelic charm and rebellious playfulness. Innocent at first glance, but with a daring, fearless side.

**Settings & Scenes:**
- **Club:** Neon-lit Berlin clubs, dark outfits, playful hairstyles.
- **Home:** Her room glows with LED lights, posters, and gaming merchandise.
- **Outdoors:** Urban backdrops like graffiti walls, rooftops, or late-night streets.
`;

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
 * @param message The user's text message.
 * @param image Optional image data to send.
 * @returns An async generator yielding the text parts of the response.
 */
export async function* sendMessage(
    chat: Chat, 
    message: string,
    image?: { data: string; mimeType: string }
): AsyncGenerator<string> {
    const parts: Part[] = [];

    if (image) {
        parts.push({
            inlineData: {
                data: image.data,
                mimeType: image.mimeType,
            },
        });
    }

    if (message.trim()) {
        parts.push({ text: message });
    }

    // FIX: The sendMessageStream method expects an object with a `message` property
    // conforming to SendMessageParameters, not a direct array of parts.
    const result = await chat.sendMessageStream({ message: parts });
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

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
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