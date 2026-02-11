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
  orderBy,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { getExperience } from "../modules/registry";
import { hashPin } from "./pinSecurity";
import { deleteAllAlbumImages } from "./albumUpload";

const COLLECTION_NAME = "gift_orders";

export const createEtsyOrder = async (data) => {
  // Data: { recipientName, senderName, personalizationText, etsyOrderId, productType }
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      status: "open",
      platform: "etsy",
      securityToken: self.crypto.randomUUID(), // Secure Token for Magic Link
      contributionToken: self.crypto.randomUUID(), // Token for Social Gifting (Public Write Access)
      allowContributions: false, // Teilbar: nur wenn Admin oder Käufer (Add-on) aktiviert
      locked: false,
      createdAt: serverTimestamp(),
      viewed: false,
      setupStarted: false,
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
      platform: giftData.platform || "manual",
    });

    // Determine if this product type requires setup
    const exp = getExperience(giftData);
    const requiresSetup = exp.isSetupRequired !== false; // Default to true if not specified

    // For products that don't require setup (Noor, Bracelet), set locked: true by default
    // unless explicitly set to false
    const shouldBeLocked = !requiresSetup && giftData.locked !== false;

    // Separate sensitive fields if necessary (for now flat structure but prepared)
    const dataToSave = {
      ...giftData,
      status: "open", // open, sealed, archived
      securityToken: self.crypto.randomUUID(), // Setup & Ownership Token
      contributionToken: self.crypto.randomUUID(), // Social Gifting Token (Write-Only)
      pinHash: null, // Will be set upon sealing
      locked: shouldBeLocked,
      setupStarted: false,
      isPublic: false, // Default: Private until customer chooses in setup
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Hash PIN if provided (server-side security)
    let accessCodeHash = null;
    if (
      giftData.accessCode &&
      typeof giftData.accessCode === "string" &&
      giftData.accessCode.length > 0
    ) {
      try {
        accessCodeHash = await hashPin(giftData.accessCode);
        // Keep plain text for backward compatibility and QR code printing
        // In future, we can remove accessCode and only use accessCodeHash
      } catch (error) {
        console.error("Error hashing PIN, storing plain text:", error);
        // Fallback: Store plain text if hashing fails (backward compatibility)
      }
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      securityToken: self.crypto.randomUUID(), // Ensure every gift has a token for setup
      platform: giftData.platform || "manual", // Ensure platform is set for Firestore rules
      ...giftData,
      contributionToken: dataToSave.contributionToken,
      allowContributions: giftData.allowContributions === true, // Teilbar: nur wenn explizit aktiviert (Admin oder Add-on)
      // Store both hash and plain text for now (migration period)
      // accessCodeHash will be used for verification, accessCode for display/QR codes
      ...(accessCodeHash && { accessCodeHash }),
      locked: shouldBeLocked ? true : giftData.locked ?? false,
      createdAt: serverTimestamp(),
      viewed: false,
      viewedAt: null,
    });

    console.log("✅ Gift created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating gift:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      hostname: window.location.hostname,
      isAuthenticated: auth?.currentUser != null,
    });
    throw error;
  }
};

export const updateGift = async (id, giftData) => {
  try {
    // Debug: Log what we're trying to update (PIN/accessCode never logged)
    const currentUser = auth.currentUser;
    const safeData = { ...giftData };
    if (safeData.accessCode != null) safeData.accessCode = "[REDACTED]";
    if (safeData.securityToken != null)
      safeData.securityToken = safeData.securityToken.substring(0, 10) + "...";
    console.log("🔍 updateGift Debug:", {
      id,
      isAuthenticated: !!currentUser,
      userId: currentUser?.uid,
      email: currentUser?.email,
      hostname: window.location.hostname,
      dataToUpdate: safeData,
      fieldsToUpdate: Object.keys(giftData),
    });

    // Hash PIN if accessCode is being updated; clear hash if PIN is removed
    let accessCodeHash = null;
    const hasPin =
      giftData.accessCode &&
      typeof giftData.accessCode === "string" &&
      giftData.accessCode.length > 0;
    if (hasPin) {
      try {
        accessCodeHash = await hashPin(giftData.accessCode);
      } catch (error) {
        console.error("Error hashing PIN during update:", error);
      }
    }

    const updateData = {
      ...giftData,
      updatedAt: serverTimestamp(),
    };
    if (accessCodeHash) {
      updateData.accessCodeHash = accessCodeHash;
    } else {
      // PIN entfernt oder leer → Hash löschen, damit Geschenk ohne PIN zugänglich ist
      updateData.accessCodeHash = null;
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updateData);
    console.log("✅ Gift updated successfully");
  } catch (error) {
    console.error("❌ Error updating gift:", error);
    const safeTried = giftData && { ...giftData };
    if (safeTried?.accessCode != null) safeTried.accessCode = "[REDACTED]";
    if (safeTried?.securityToken != null)
      safeTried.securityToken =
        safeTried.securityToken.substring(0, 10) + "...";
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      hostname: window.location.hostname,
      isAuthenticated: auth?.currentUser != null,
      dataTried: safeTried,
    });
    throw error;
  }
};

export const deleteGift = async (id) => {
  try {
    // 1. Get Data to find URLs to delete from storage
    const gift = await getGiftById(id);

    if (gift) {
      // Collect all potential file URLs (legacy single files)
      const potentialFiles = [
        gift.audioUrl,
        gift.meaningAudioUrl,
        gift.designImage,
      ];

      // Filter only valid Firebase Storage URLs
      const filesToDelete = potentialFiles.filter(
        (url) =>
          url &&
          typeof url === "string" &&
          url.includes("firebasestorage.googleapis.com")
      );

      // Delete each file
      for (const url of filesToDelete) {
        try {
          const fileRef = ref(storage, url);
          await deleteObject(fileRef);
          console.log("Deleted file from storage:", url);
        } catch {
          // Ignore errors if file doesn't exist anymore or isn't deletable
          console.warn(
            "Could not delete file (maybe already gone or external URL):",
            url
          );
        }
      }

      // Delete album images (gift-images/{giftId}/...)
      if (
        gift.albumImages &&
        Array.isArray(gift.albumImages) &&
        gift.albumImages.length > 0
      ) {
        await deleteAllAlbumImages(gift.albumImages);
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
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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
    retriesLeft: retries,
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
          console.log(
            `⏳ Document not found, waiting... (attempt ${
              attempt + 1
            }/${retries})`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          ); // Exponential backoff
          continue;
        }
        return null; // Not found
      }
    } catch (error) {
      // Log the actual error code for debugging on Staging
      console.warn(
        "Firestore error caught in getGiftById:",
        error.code,
        error.message
      );

      // SECURITY UPDATE: Handle locked gifts (PERMISSION_DENIED)
      // Check for multiple variations of permission denied error
      if (
        error.code === "permission-denied" ||
        error.code === "PERMISSION_DENIED" ||
        (error.code && error.code.toLowerCase().includes("permission")) ||
        (error.message && error.message.toLowerCase().includes("permission")) ||
        (error.message && error.message.toLowerCase().includes("privilege"))
      ) {
        console.warn(
          "🔒 Gift is locked (PERMISSION_DENIED). Attempting to fetch public data..."
        );
        try {
          // Import dynamically to avoid circular dependencies if any,
          // or ensure pinSecurity.js is imported at top
          const { getPublicGiftData } = await import("./pinSecurity");
          const result = await getPublicGiftData(id);

          if (result && result.exists) {
            return result.publicData;
          }
          return null;
        } catch (secError) {
          console.error("Failed to fetch public gift data:", secError);
          throw secError;
        }
      }

      console.error(
        `❌ Error getting gift (attempt ${attempt + 1}/${retries}):`,
        error
      );

      // Retry other errors
      if (attempt < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
        continue;
      }

      // Last attempt - throw
      throw error;
    }
  }

  return null;
};

// ============================================
// SOCIAL GIFTING (CONTRIBUTIONS)
// ============================================

export const getGiftByContributionToken = async (token) => {
  // Use Cloud Function for secure lookup (Project: ihmfy)
  const { httpsCallable, getFunctions } = await import("firebase/functions");
  const functions = getFunctions();
  const getGift = httpsCallable(functions, "getGiftByContributionToken");

  try {
    const result = await getGift({ token });
    return result.data; // { giftId, recipientName, senderName, title, ... }
  } catch (error) {
    console.error("Error fetching gift by token:", error);
    throw error;
  }
};

export const addContribution = async (giftId, contributionData) => {
  // ContributionData: { author, content, type, mediaUrl?, contributionToken }
  // Write to sub-collection: gift_orders/{giftId}/contributions
  try {
    const contributionsRef = collection(
      db,
      COLLECTION_NAME,
      giftId,
      "contributions"
    );
    await addDoc(contributionsRef, {
      ...contributionData,
      status: "approved", // Default approved for MVP
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding contribution:", error);
    throw error;
  }
};

export const getContributions = async (giftId) => {
  try {
    const contributionsRef = collection(
      db,
      COLLECTION_NAME,
      giftId,
      "contributions"
    );
    // Order by timestamp so they appear in sequence
    const q = query(contributionsRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.warn(
      "Error fetching contributions (might be empty/locked):",
      error
    );
    return []; // Return empty array gracefully if permission denied or empty
  }
};

export const markGiftAsViewed = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      viewed: true,
      viewedAt: serverTimestamp(),
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
      setupStartedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error marking setup as started:", error);
    // Don't throw, just log. It's analytics.
  }
};
