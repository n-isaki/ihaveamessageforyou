import { Timestamp } from "firebase/firestore";

export interface Note {
  id: string;
  title: string;
  content: string; // Markdown
  isPublic: boolean;
  slug?: string; // Für Public URLs (nur wenn public)
  tags: string[];
  collectionId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  authorId: string;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  previewImage?: string; // Screenshot/OG Image
  isPublic: boolean;
  slug?: string;
  tags: string[];
  collectionId?: string;
  createdAt: Timestamp;
  authorId: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: Timestamp;
}
