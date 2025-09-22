import React from 'react';
import { DownloadIcon, XIcon } from './icons';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = imageUrl.split('/').pop()?.split('#')[0].split('?')[0] || 'cassandra-image.jpg';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      window.open(imageUrl, '_blank');
    }
  };

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative bg-gray-900/50 p-2 rounded-lg shadow-2xl max-w-4xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt="Cassandra's generated image - full view"
          className="object-contain w-full h-full max-w-full max-h-[calc(90vh-4rem)]"
        />
        <div className="absolute top-2 right-2 flex space-x-2 md:top-4 md:right-4">
           <button
            onClick={handleDownload}
            className="p-2 bg-gray-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-100 transition-colors"
            aria-label="Download image"
            title="Download image"
          >
            <DownloadIcon className="w-6 h-6" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-100 transition-colors"
            aria-label="Close image view"
            title="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;