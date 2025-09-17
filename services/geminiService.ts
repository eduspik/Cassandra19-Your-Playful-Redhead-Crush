
import { GoogleGenAI, Chat } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
