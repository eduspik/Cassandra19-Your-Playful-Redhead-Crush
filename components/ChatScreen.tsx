import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from '../types';
import { createChatSession, sendMessage } from '../services/geminiService';
import { Chat } from '@google/genai';
import ChatMessage from './ChatMessage';
import { SendIcon, MicrophoneIcon } from './icons';
import { AppStrings } from '../localization/i18n';

// FIX: Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported';
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

declare var webkitSpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

// Define SpeechRecognition interface for TypeScript to handle vendor prefixes
interface CustomWindow extends Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
declare const window: CustomWindow;

interface ChatScreenProps {
  systemInstruction: string;
  strings: AppStrings;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ systemInstruction, strings }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = () => {
      try {
        const chatSession = createChatSession(systemInstruction);
        setChat(chatSession);
        setMessages([
          {
            role: 'model',
            content: strings.initialGreeting,
          },
        ]);
      } catch (e) {
        setError(strings.geminiInitError);
        console.error(e);
      }
    };
    initChat();
  }, [systemInstruction, strings]);

  useEffect(() => {
    // Cleanup recognition on component unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

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
      const stream = sendMessage(chat, input);
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: 'model', content: '' }]);

      // FIX: The `sendMessage` service returns a stream of strings, so `chunk` is already the text.
      // Accessing `chunk.text` was incorrect and caused a TypeScript error.
      for await (const chunk of stream) {
        modelResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = modelResponse;
          return newMessages;
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(strings.getAIResponseError(errorMessage));
      setMessages((prev) => [...prev, { role: 'model', content: strings.genericError(errorMessage) }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, chat, isLoading, strings]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.lang = navigator.language || 'es-ES';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setInput(''); 
      setError(null);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = strings.speechErrorGeneric;
      switch (event.error) {
        case 'no-speech':
          errorMessage = strings.speechErrorNoSpeech;
          break;
        case 'not-allowed':
          errorMessage = strings.speechErrorNotAllowed;
          break;
        case 'audio-capture':
          errorMessage = strings.speechErrorAudioCapture;
          break;
      }
      setError(errorMessage);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };


  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div>
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {strings.chatTitle}
            </h2>
            <p className="text-xs text-gray-400">{strings.chatSubtitle}</p>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-2xl p-3 max-w-lg rounded-bl-none">
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
            placeholder={isRecording ? strings.listeningPlaceholder : strings.inputPlaceholder}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            disabled={isLoading || isRecording}
            aria-label={strings.inputPlaceholder}
          />
          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={`ml-3 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-purple-600 hover:bg-purple-700'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
            aria-label={isRecording ? strings.micButtonLabelRecording : strings.micButtonLabel}
          >
            <MicrophoneIcon className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || isRecording}
            className="ml-3 p-2 rounded-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-5 h-5 text-white" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatScreen;