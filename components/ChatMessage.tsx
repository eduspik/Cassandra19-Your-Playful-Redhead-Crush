
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isModel = message.role === 'model';

  return (
    <div className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`px-4 py-3 rounded-2xl max-w-lg lg:max-w-xl xl:max-w-2xl break-words whitespace-pre-wrap ${
          isModel
            ? 'bg-gray-700 text-gray-100 rounded-bl-none'
            : 'bg-purple-600 text-white rounded-br-none'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessage;
