
export interface Message {
  id: number;
  role: 'user' | 'model';
  content: string;
  imageUrl?: string;
}

export interface GalleryImage {
  prompt: string;
  imageUrl: string;
}
