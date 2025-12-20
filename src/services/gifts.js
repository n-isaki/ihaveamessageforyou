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
import { db } from "../firebase";

const COLLECTION_NAME = "gift_orders";

export const createGift = async (giftData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
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

/**
 * Creates a simulated order as if it came from Shopify.
 * @param {Object} orderData 
 */
export const createSimulatedOrder = async (orderData) => {
    try {
        // Map simulation data to our internal schema
        const docData = {
            orderId: `SIM-${Date.now().toString().slice(-6)}`, // Fake Order ID
            customerName: orderData.customerName || 'Test Kunde',
            customerEmail: orderData.customerEmail || 'test@example.com',
            recipientName: orderData.recipientName || 'Empfänger',
            senderName: orderData.senderName || 'Absender',

            // Core Product Data
            productType: orderData.productType, // 'mug' or 'bracelet'
            designImage: orderData.designImage || null, // For Mug

            // Status Tracking
            status: 'pending_creation', // Waiting for user input (Ritual/Upload)
            viewed: false,
            createdAt: serverTimestamp(),

            // Placeholder for the content the user will create
            messages: [],
            accessCode: '',
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
        return docRef.id;
    } catch (error) {
        console.error("Error creating simulated order:", error);
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
    } catch (error) {
        console.error("Error marking gift as viewed:", error);
        throw error;
    }
};
