import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  // Función para encontrar y formatear URLs y texto en negrita (**texto**)
  const formatContent = (text: string) => {
    // La expresión regular divide el texto por URLs o texto en negrita, pero mantiene
    // los delimitadores (URLs, texto en negrita) en el array resultante gracias a los paréntesis de captura.
    const parts = text.split(/(\*\*.+?\*\*|https?:\/\/[^\s.,!?]+)/g);

    return parts
      // Filtra cualquier cadena vacía que pueda resultar de la división.
      .filter(part => part)
      .map((part, index) => {
        // Comprueba si la parte es una URL.
        if (/^https?:\/\//.test(part)) {
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
        // Comprueba si la parte es texto en negrita.
        if (part.startsWith('**') && part.endsWith('**')) {
          // Extrae el texto de entre los asteriscos para ponerlo en negrita.
          return <strong key={index}>{part.substring(2, part.length - 2)}</strong>;
        }
        // Si no es ninguno de los anteriores, es texto normal.
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
        {formatContent(message.content)}
      </div>
    </div>
  );
};

export default ChatMessage;
