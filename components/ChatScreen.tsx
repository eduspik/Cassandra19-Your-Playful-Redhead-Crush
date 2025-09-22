import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, GalleryImage } from '../types';
import { createChatSession, sendMessage, generateImage } from '../services/geminiService';
import * as galleryService from '../services/galleryService';
import { Chat } from '@google/genai';
import ChatMessage from './ChatMessage';
import ImageGallery from './ImageGallery';
import { SendIcon, MicrophoneIcon, TrashIcon } from './icons';
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
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
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
        
        const savedMessagesJSON = localStorage.getItem('cassandra-chat-history');
        if (savedMessagesJSON) {
          let savedMessages = JSON.parse(savedMessagesJSON);
          if (Array.isArray(savedMessages) && savedMessages.length > 0) {
            // Add IDs to old messages if they don't have them for backward compatibility
            savedMessages = savedMessages.map((msg, index) => ({
                ...msg,
                id: msg.id || Date.now() + index,
            }));
            setMessages(savedMessages);
          } else {
            setMessages([{ id: Date.now(), role: 'model', content: strings.initialGreeting }]);
          }
        } else {
          setMessages([{ id: Date.now(), role: 'model', content: strings.initialGreeting }]);
        }

        // Load gallery images
        setGalleryImages(galleryService.getGalleryImages());

      } catch (e) {
        console.error("Error initializing chat or loading history:", e);
        setError(strings.geminiInitError); 
        setMessages([{ id: Date.now(), role: 'model', content: strings.initialGreeting }]);
      }
    };
    initChat();

  }, [systemInstruction, strings]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cassandra-chat-history', JSON.stringify(messages));
    }
  }, [messages]);
  

  useEffect(() => {
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

    const userMessage: Message = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const stream = sendMessage(chat, input);
      let modelResponse = '';
      const modelMessageId = Date.now();
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

      for await (const chunk of stream) {
        modelResponse += chunk;
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages.find(m => m.id === modelMessageId);
          if (lastMessage) {
            lastMessage.content = modelResponse;
          }
          return newMessages;
        });
      }

      // After stream is complete, check for image tag
      const imageTagRegex = /\[SEND_IMAGE:\s*(.*?)\]/im;
      const match = modelResponse.match(imageTagRegex);
      const finalModelText = modelResponse.replace(imageTagRegex, '').trim();
      
      // Update the final text message without the tag
      setMessages((prev) => prev.map(m => m.id === modelMessageId ? { ...m, content: finalModelText } : m));

      if (match && match[1]) {
        const imagePrompt = match[1];
        const imageLoadingMessage: Message = {
            id: Date.now(),
            role: 'model',
            content: '',
            imageUrl: 'loading'
        };
        setMessages(prev => [...prev, imageLoadingMessage]);

        try {
            const imageUrl = await generateImage(imagePrompt);
            const newGalleryImage: GalleryImage = { prompt: imagePrompt, imageUrl };
            galleryService.addGalleryImage(newGalleryImage);
            setGalleryImages(galleryService.getGalleryImages()); // Refresh gallery from source
            setMessages(prev => prev.map(m => m.id === imageLoadingMessage.id ? { ...m, imageUrl } : m));
        } catch (e) {
            console.error("Image generation failed:", e);
            setMessages(prev => prev.filter(m => m.id !== imageLoadingMessage.id));
            setError(strings.imageGenError);
        }
      }

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(strings.getAIResponseError(errorMessage));
      // Remove the potentially empty model message on error
      setMessages((prev) => prev.filter(m => m.content !== '' || m.role !== 'model'));
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

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;
    
    recognition.lang = navigator.language || 'es-ES';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onend = () => setIsRecording(false);

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = strings.speechErrorGeneric;
      if (event.error === 'no-speech') errorMessage = strings.speechErrorNoSpeech;
      else if (event.error === 'not-allowed') errorMessage = strings.speechErrorNotAllowed;
      else if (event.error === 'audio-capture') errorMessage = strings.speechErrorAudioCapture;
      setError(errorMessage);
    };

    recognition.start();
  };
  
  const handleClearChat = () => {
    if (window.confirm(strings.clearChatConfirmation)) {
      localStorage.removeItem('cassandra-chat-history');
      setMessages([{ id: Date.now(), role: 'model', content: strings.initialGreeting }]);
    }
  };

  const handleImageSelectFromGallery = (imageUrl: string) => {
    const imageMessage: Message = {
      id: Date.now(),
      role: 'model',
      content: '',
      imageUrl,
    };
    setMessages(prev => [...prev, imageMessage]);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 shadow-md">
        <div>
            <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {strings.chatTitle}
            </h2>
            <p className="text-xs text-gray-400">{strings.chatSubtitle}</p>
        </div>
        <div className="flex items-center space-x-2">
            <button
            onClick={handleClearChat}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label={strings.clearChatButtonLabel}
            title={strings.clearChatButtonLabel}
            >
            <TrashIcon className="w-5 h-5 text-gray-400" />
            </button>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
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
      
      <ImageGallery 
        images={galleryImages} 
        onImageSelect={handleImageSelectFromGallery} 
        strings={strings}
      />

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