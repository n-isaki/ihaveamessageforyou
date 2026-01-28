import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

const COLLECTION_NAME = "gift_orders";

export const createEtsyOrder = async (data) => {
    // Data: { recipientName, senderName, personalizationText, etsyOrderId, productType }
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...data,
            status: 'open',
            platform: 'etsy',
            securityToken: self.crypto.randomUUID(), // Secure Token for Magic Link
            locked: false,
            createdAt: serverTimestamp(),
            viewed: false,
            setupStarted: false
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating etsy order:", error);
        throw error;
    }
};

export const createGift = async (giftData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            securityToken: self.crypto.randomUUID(), // Ensure every gift has a token for setup
            ...giftData,
            createdAt: serverTimestamp(),
            viewed: false,
            viewedAt: null
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating gift:", error);
        throw error;
    }
};

export const updateGift = async (id, giftData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...giftData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating gift:", error);
        throw error;
    }
};

export const deleteGift = async (id) => {
    try {
        // 1. Get Data to find URLs to delete from storage
        const gift = await getGiftById(id);

        if (gift) {
            // Collect all potential file URLs
            const potentialFiles = [gift.audioUrl, gift.meaningAudioUrl, gift.designImage];

            // Filter only valid Firebase Storage URLs
            const filesToDelete = potentialFiles.filter(url => url && typeof url === 'string' && url.includes('firebasestorage.googleapis.com'));

            // Delete each file
            for (const url of filesToDelete) {
                try {
                    const fileRef = ref(storage, url);
                    await deleteObject(fileRef);
                    console.log("Deleted file from storage:", url);
                } catch (err) {
                    // Ignore errors if file doesn't exist anymore or isn't deletable
                    console.warn("Could not delete file (maybe already gone or external URL):", url);
                }
            }
        }

        // 2. Delete the DB Document
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting gift:", error);
        throw error;
    }
};

export const getGifts = async () => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting gifts:", error);
        throw error;
    }
};

export const getGiftById = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting gift:", error);
        throw error;
    }
};

export const markGiftAsViewed = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            viewed: true,
            viewedAt: serverTimestamp()
        });
        // ... existing code ...
    } catch (error) {
        console.error("Error marking gift as viewed:", error);
        throw error;
    }
};

export const markSetupAsStarted = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            setupStarted: true,
            setupStartedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error marking setup as started:", error);
        // Don't throw, just log. It's analytics.
    }
};
