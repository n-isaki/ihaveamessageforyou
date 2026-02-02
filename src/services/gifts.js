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
import { db, storage, auth } from "../firebase";
import { getExperience } from "../modules/registry";
import { hashPin } from "./pinSecurity";

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
        // Debug: Check authentication before creating
        const currentUser = auth.currentUser;
        console.log("🔍 createGift Debug:", {
            isAuthenticated: !!currentUser,
            userId: currentUser?.uid,
            email: currentUser?.email,
            hostname: window.location.hostname,
            platform: giftData.platform || 'manual'
        });
        
        // Determine if this product type requires setup
        const exp = getExperience(giftData);
        const requiresSetup = exp.isSetupRequired !== false; // Default to true if not specified
        
        // For products that don't require setup (Noor, Bracelet), set locked: true by default
        // unless explicitly set to false
        const shouldBeLocked = !requiresSetup && giftData.locked !== false;
        
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            securityToken: self.crypto.randomUUID(), // Ensure every gift has a token for setup
            platform: giftData.platform || 'manual', // Ensure platform is set for Firestore rules
            ...giftData,
            locked: shouldBeLocked ? true : (giftData.locked ?? false),
            createdAt: serverTimestamp(),
            viewed: false,
            viewedAt: null
        });
        
        console.log("✅ Gift created with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("❌ Error creating gift:", error);
        console.error("Error details:", {
            code: error.code,
            message: error.message,
            hostname: window.location.hostname,
            isAuthenticated: auth?.currentUser != null
        });
        throw error;
    }
};

export const updateGift = async (id, giftData) => {
    try {
        // Debug: Log what we're trying to update
        const currentUser = auth.currentUser;
        console.log("🔍 updateGift Debug:", {
            id,
            isAuthenticated: !!currentUser,
            userId: currentUser?.uid,
            email: currentUser?.email,
            hostname: window.location.hostname,
            dataToUpdate: giftData,
            hasSecurityToken: !!giftData.securityToken,
            securityTokenValue: giftData.securityToken ? giftData.securityToken.substring(0, 10) + '...' : null,
            fieldsToUpdate: Object.keys(giftData)
        });
        
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...giftData,
            updatedAt: serverTimestamp()
        });
        console.log("✅ Gift updated successfully");
    } catch (error) {
        console.error("❌ Error updating gift:", error);
        console.error("Error details:", {
            code: error.code,
            message: error.message,
            hostname: window.location.hostname,
            isAuthenticated: auth?.currentUser != null,
            dataTried: giftData
        });
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

export const getGiftById = async (id, retries = 3) => {
    // Debug: Check authentication
    const currentUser = auth.currentUser;
    console.log("🔍 getGiftById Debug:", {
        id,
        isAuthenticated: !!currentUser,
        userId: currentUser?.uid,
        email: currentUser?.email,
        hostname: window.location.hostname,
        retriesLeft: retries
    });
    
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log("✅ Gift found on attempt", attempt + 1);
                return { id: docSnap.id, ...docSnap.data() };
            } else {
                // Document doesn't exist yet, wait and retry
                if (attempt < retries - 1) {
                    console.log(`⏳ Document not found, waiting... (attempt ${attempt + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                    continue;
                }
                return null;
            }
        } catch (error) {
            console.error(`❌ Error getting gift (attempt ${attempt + 1}/${retries}):`, error);
            console.error("Error details:", {
                code: error.code,
                message: error.message,
                hostname: window.location.hostname,
                isAuthenticated: auth?.currentUser != null
            });
            
            // If it's a permission error and we have retries left, wait and retry
            if (error.code === 'permission-denied' && attempt < retries - 1) {
                console.log(`⏳ Permission denied, waiting and retrying... (attempt ${attempt + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                continue;
            }
            
            // Last attempt or non-permission error - throw
            throw error;
        }
    }
    
    return null;
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
