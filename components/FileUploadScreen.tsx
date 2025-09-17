
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadScreenProps {
  onFileProcessed: (content: string, fileName: string) => void;
}

const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ onFileProcessed }) => {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          onFileProcessed(text, file.name);
        } else {
          setError('El archivo está vacío o no se pudo leer.');
          setFileName(null);
        }
      };
      reader.onerror = () => {
        setError('Error al leer el archivo.');
        setFileName(null);
      };
      reader.readAsText(file);
    }
  }, [onFileProcessed]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-800 rounded-2xl">
      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
          IA de Persona Fanvue
        </h1>
        <p className="text-gray-300 text-lg mb-8">
          Sube tu historial de chat de Fanvue (.txt) para crear una IA que hable como tú. Tu IA aprenderá tu estilo y personalidad para responder a los fans.
        </p>
        
        <div className="w-full p-6 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-400 transition-colors duration-300">
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
            <UploadIcon className="w-12 h-12 text-gray-500 mb-3" />
            <span className="font-semibold text-purple-300">
              {fileName ? `Archivo seleccionado: ${fileName}` : 'Haz clic para subir un archivo'}
            </span>
            <p className="text-sm text-gray-400 mt-1">
              (Se recomienda formato .txt)
            </p>
          </label>
          <input 
            id="file-upload" 
            name="file-upload" 
            type="file" 
            className="sr-only" 
            accept=".txt"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-red-400 mt-4">{error}</p>}

        <div className="mt-8 p-4 bg-gray-900/50 rounded-lg text-left text-sm text-gray-400">
          <h3 className="font-semibold text-gray-200 mb-2">Instrucciones:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Exporta tu historial de chat desde Fanvue.</li>
            <li>Guárdalo como un archivo de texto simple (.txt).</li>
            <li>Asegúrate de que el archivo contenga una conversación clara para que la IA aprenda mejor.</li>
            <li>Sube el archivo aquí para comenzar a chatear con tu propia IA.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FileUploadScreen;
