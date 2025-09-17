import { GoogleGenAI, Chat } from '@google/genai';

// FIX: Per coding guidelines, the API key MUST be obtained from process.env.API_KEY.
// Using import.meta.env is not compliant with the guidelines and caused a TypeScript error.
const apiKey = process.env.API_KEY;

if (!apiKey) {
  // FIX: Updated the error message to reflect the correct environment variable name.
  throw new Error('Missing API_KEY environment variable. Please set it.');
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
