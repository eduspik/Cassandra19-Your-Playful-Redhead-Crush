
import React, { useEffect } from 'react';
import ChatScreen from './components/ChatScreen';
import { getLocaleStrings } from './localization/i18n';

const App: React.FC = () => {
  const strings = getLocaleStrings();

  useEffect(() => {
    document.title = strings.chatTitle;
  }, [strings.chatTitle]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-4xl h-[90vh] flex flex-col bg-gray-800 rounded-2xl shadow-2xl shadow-purple-500/10 border border-gray-700">
        <ChatScreen systemInstruction={strings.CASSANDRA_PERSONA_INSTRUCTION} strings={strings} />
      </div>
       <footer className="text-center text-gray-500 text-sm mt-4">
        {strings.footerText}
      </footer>
    </div>
  );
};

export default App;