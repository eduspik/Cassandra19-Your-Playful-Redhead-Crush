
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '../types';
import { createChatSession, sendMessage } from '../services/geminiService';
import { Chat } from '@google/genai';
import ChatMessage from './ChatMessage';
import { SendIcon } from './icons';

interface ChatScreenProps {
  systemInstruction: string;
  fileName: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ systemInstruction, fileName }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        const chatSession = createChatSession(systemInstruction);
        setChat(chatSession);
        setMessages([
          {
            role: 'model',
            content: `Hey tú 👀 Gracias por pasarte... ¿quieres quedarte un ratito más y jugar? 💋`,
          },
        ]);
      } catch (e) {
        setError('Error al inicializar la API de Gemini. Asegúrate de que la clave de API esté configurada.');
        console.error(e);
      }
    };
    initChat();
  }, [systemInstruction]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // FIX: The `sendMessage` function is an async generator and returns an iterator directly.
      // The `await` keyword is not needed here and is incorrect.
      const stream = sendMessage(chat, input);
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
      setError(`Error al obtener respuesta de la IA: ${errorMessage}`);
      setMessages((prev) => [...prev, { role: 'model', content: `Lo siento, tuve un problema. ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, chat, isLoading]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div className="flex items-center">
            <div>
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                Chateando como Cassandra19
                </h2>
                <p className="text-xs text-gray-400">Personalidad IA activa</p>
            </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-2xl p-3 max-w-lg">
              <span className="text-gray-300">Cassandra está escribiendo</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {error && <p className="text-red-400 text-center text-sm px-4 pb-2">{error}</p>}

      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-purple-500 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="ml-3 p-2 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;
