import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import type { Note, Link, Collection } from "@/types";

// Collection References (mit Prefix für Trennung)
const NOTES_COLLECTION = "karakedimartin_notes";
const LINKS_COLLECTION = "karakedimartin_links";
const COLLECTIONS_COLLECTION = "karakedimartin_collections";

// ============================================
// NOTES
// ============================================

export async function createNote(data: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const now = Timestamp.now();
    // Entferne undefined Werte (Firestore erlaubt keine undefined)
    const cleanData: any = {
      title: data.title,
      content: data.content || "",
      isPublic: data.isPublic,
      tags: data.tags || [],
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
    };
    // Entferne slug wenn undefined oder leer
    if (data.slug && data.slug.trim()) {
      cleanData.slug = data.slug;
    }
    
    console.log("Firestore: Erstelle Notiz in Collection:", NOTES_COLLECTION);
    console.log("Firestore: Daten:", cleanData);
    console.log("Firestore: DB:", db);
    
    const notesRef = collection(db, NOTES_COLLECTION);
    console.log("Firestore: Collection Reference:", notesRef);
    
    const docRef = await addDoc(notesRef, cleanData);
    console.log("Firestore: Notiz erstellt mit ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("Firestore Error beim Erstellen der Notiz:", error);
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    throw error;
  }
}

export async function getNote(id: string): Promise<Note | null> {
  const docRef = doc(db, NOTES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Note;
}

export async function getAllNotes(userId: string): Promise<Note[]> {
  try {
    console.log("Firestore: Lade Notizen für User:", userId);
    console.log("Firestore: Collection:", NOTES_COLLECTION);
    
    // Erst ohne orderBy versuchen (kein Index nötig)
    const q = query(
      collection(db, NOTES_COLLECTION),
      where("authorId", "==", userId)
    );
    
    console.log("Firestore: Query erstellt");
    const querySnapshot = await getDocs(q);
    console.log("Firestore: Anzahl Notizen:", querySnapshot.docs.length);
    
    const notes = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log("Firestore: Notiz gefunden:", doc.id, data);
      return { id: doc.id, ...data } as Note;
    });
    
    // Sortiere client-side nach updatedAt
    notes.sort((a, b) => {
      const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate().getTime() : 0;
      const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
    
    return notes;
  } catch (error: any) {
    console.error("Firestore Error beim Laden der Notizen:", error);
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    throw error;
  }
}

export async function getPublicNotes(): Promise<Note[]> {
  const q = query(
    collection(db, NOTES_COLLECTION),
    where("isPublic", "==", true),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
}

export async function updateNote(id: string, data: Partial<Note>) {
  const docRef = doc(db, NOTES_COLLECTION, id);
  // Entferne undefined Werte
  const cleanData: any = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });
  await updateDoc(docRef, cleanData);
}

export async function deleteNote(id: string) {
  const docRef = doc(db, NOTES_COLLECTION, id);
  await deleteDoc(docRef);
}

// ============================================
// LINKS
// ============================================

export async function createLink(data: Omit<Link, "id" | "createdAt">): Promise<string> {
  try {
    const now = Timestamp.now();
    // Entferne undefined Werte (Firestore erlaubt keine undefined)
    const cleanData: any = {
      url: data.url,
      title: data.title,
      isPublic: data.isPublic,
      tags: data.tags || [],
      authorId: data.authorId,
      createdAt: now,
    };
    // Entferne slug wenn undefined oder leer
    if (data.slug && data.slug.trim()) {
      cleanData.slug = data.slug;
    }
    // Entferne optionale Felder wenn undefined oder leer
    if (data.description && data.description.trim()) {
      cleanData.description = data.description;
    }
    if (data.previewImage && data.previewImage.trim()) {
      cleanData.previewImage = data.previewImage;
    }
    
    console.log("Firestore: Erstelle Link in Collection:", LINKS_COLLECTION);
    console.log("Firestore: Daten:", cleanData);
    console.log("Firestore: DB:", db);
    
    const linksRef = collection(db, LINKS_COLLECTION);
    console.log("Firestore: Collection Reference:", linksRef);
    
    const docRef = await addDoc(linksRef, cleanData);
    console.log("Firestore: Link erstellt mit ID:", docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error("Firestore Error beim Erstellen des Links:", error);
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    throw error;
  }
}

export async function getLink(id: string): Promise<Link | null> {
  const docRef = doc(db, LINKS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Link;
}

export async function getAllLinks(userId: string): Promise<Link[]> {
  try {
    console.log("Firestore: Lade Links für User:", userId);
    console.log("Firestore: Collection:", LINKS_COLLECTION);
    
    // Erst ohne orderBy versuchen (kein Index nötig)
    const q = query(
      collection(db, LINKS_COLLECTION),
      where("authorId", "==", userId)
    );
    
    console.log("Firestore: Query erstellt");
    const querySnapshot = await getDocs(q);
    console.log("Firestore: Anzahl Links:", querySnapshot.docs.length);
    
    const links = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log("Firestore: Link gefunden:", doc.id, data);
      return { id: doc.id, ...data } as Link;
    });
    
    // Sortiere client-side nach createdAt
    links.sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    });
    
    return links;
  } catch (error: any) {
    console.error("Firestore Error beim Laden der Links:", error);
    console.error("Error Code:", error.code);
    throw error;
  }
}

export async function getPublicLinks(): Promise<Link[]> {
  const q = query(
    collection(db, LINKS_COLLECTION),
    where("isPublic", "==", true),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Link));
}

export async function updateLink(id: string, data: Partial<Link>) {
  const docRef = doc(db, LINKS_COLLECTION, id);
  // Entferne undefined Werte
  const cleanData: any = { ...data };
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });
  await updateDoc(docRef, cleanData);
}

export async function deleteLink(id: string) {
  const docRef = doc(db, LINKS_COLLECTION, id);
  await deleteDoc(docRef);
}

// ============================================
// COLLECTIONS
// ============================================

export async function createCollection(data: Omit<Collection, "id" | "createdAt">) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, COLLECTIONS_COLLECTION), {
    ...data,
    createdAt: now,
  });
  return docRef.id;
}

export async function getCollection(id: string): Promise<Collection | null> {
  const docRef = doc(db, COLLECTIONS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Collection;
}

export async function getAllCollections(userId: string): Promise<Collection[]> {
  const q = query(
    collection(db, COLLECTIONS_COLLECTION),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection));
}

export async function updateCollection(id: string, data: Partial<Collection>) {
  const docRef = doc(db, COLLECTIONS_COLLECTION, id);
  await updateDoc(docRef, data);
}

export async function deleteCollection(id: string) {
  const docRef = doc(db, COLLECTIONS_COLLECTION, id);
  await deleteDoc(docRef);
}
