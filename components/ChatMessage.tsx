import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  // Función para encontrar URLs en el texto y envolverlas en etiquetas de anclaje
  const linkify = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex items-end ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`px-4 py-3 rounded-2xl max-w-lg lg:max-w-xl xl:max-w-2xl break-words whitespace-pre-wrap ${
          isModel
            ? 'bg-gray-700 text-gray-100 rounded-bl-none'
            : 'bg-purple-600 text-white rounded-br-none'
        }`}
      >
        {linkify(message.content)}
      </div>
    </div>
  );
};

export default ChatMessage;
