import { GalleryImage } from '../types';

const GALLERY_STORAGE_KEY = 'cassandra-image-gallery';

/**
 * Retrieves all images from the gallery stored in localStorage.
 * @returns An array of GalleryImage objects.
 */
export const getGalleryImages = (): GalleryImage[] => {
  try {
    const savedGalleryJSON = localStorage.getItem(GALLERY_STORAGE_KEY);
    if (savedGalleryJSON) {
      const savedGallery = JSON.parse(savedGalleryJSON);
      if (Array.isArray(savedGallery)) {
        return savedGallery;
      }
    }
  } catch (e) {
    console.error("Failed to load gallery from localStorage:", e);
  }
  return [];
};

/**
 * Adds a new image to the gallery in localStorage.
 * Avoids adding duplicates based on imageUrl.
 * @param image The GalleryImage object to add.
 */
export const addGalleryImage = (image: GalleryImage): void => {
  try {
    const currentImages = getGalleryImages();
    // Prevent duplicates
    if (!currentImages.some(img => img.imageUrl === image.imageUrl)) {
      const newImages = [...currentImages, image];
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(newImages));
    }
  } catch (e) {
    console.error("Failed to save image to gallery:", e);
  }
};
