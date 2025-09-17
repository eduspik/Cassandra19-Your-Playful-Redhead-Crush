
import { GoogleGenAI, Chat } from '@google/genai';

// FIX: Per coding guidelines, API key must be read from process.env.API_KEY. This resolves the TypeScript error 'Property 'env' does not exist on type 'ImportMeta''.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  // FIX: Updated error message to refer to API_KEY.
  throw new Error("API_KEY environment variable not set. Please ensure it is configured.");
}

const ai = new GoogleGenAI({ apiKey });

export function createChatSession(systemInstruction: string): Chat {
  const model = 'gemini-2.5-flash';
  
  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: systemInstruction,
    },
  });

  return chat;
}

export async function* sendMessage(chat: Chat, message: string): AsyncGenerator<string> {
  const result = await chat.sendMessageStream({ message });

  for await (const chunk of result) {
    yield chunk.text;
  }
}
