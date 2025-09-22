import React from 'react';
import { GalleryImage } from '../types';
import { AppStrings } from '../localization/i18n';

interface ImageGalleryProps {
  images: GalleryImage[];
  onImageClick: (imageUrl: string) => void;
  strings: AppStrings;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, onImageClick, strings }) => {
  if (!images || images.length === 0) {
    return (
      <div className="p-4 pt-0 text-center text-gray-500 text-sm">
        <div className="border-t border-gray-700 pt-4">{strings.galleryEmpty}</div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-gray-700 bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-400 mb-3 px-2">{strings.galleryTitle}</h3>
      <div className="max-h-36 overflow-y-auto pr-2">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="aspect-square bg-gray-700 rounded-lg overflow-hidden cursor-pointer group relative shadow-md hover:shadow-purple-500/30" 
              onClick={() => onImageClick(image.imageUrl)}
              title={`${strings.viewImageTitle}: ${image.prompt}`}
            >
              <img
                src={image.imageUrl}
                alt={image.prompt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageGallery;