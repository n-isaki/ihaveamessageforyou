import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";

const STORAGE_PREFIX = "audio-uploads";

/**
 * Get Storage path from Firebase download URL (for delete)
 * @param {string} url
 * @returns {string|null} path or null
 */
function getPathFromDownloadUrl(url) {
    if (
        !url ||
        typeof url !== "string" ||
        !url.includes("firebasestorage.googleapis.com")
    ) {
        return null;
    }
    try {
        const match = url.match(/\/o\/(.+?)(?:\?|$)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
    } catch {
        // ignore
    }
    return null;
}

/**
 * Upload an audio file directly to Storage.
 * @param {string} giftId
 * @param {File} file
 * @returns {Promise<{ url: string }>}
 */
export async function uploadAudioFile(giftId, file) {
    if (!giftId || !file) {
        throw new Error("Gift-ID und Audio-Datei erforderlich.");
    }

    // Basic validation
    if (!file.type.startsWith("audio/")) {
        throw new Error("Bitte wähle eine gültige Audio-Datei aus (z.B. MP3, WAV).");
    }

    // Max size: 50MB (arbitrary limit for audio)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        throw new Error("Die Audio-Datei darf maximal 50MB groß sein.");
    }

    const safeName = `audio_${Date.now()}_${(file.name || "audio").replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
    )}`;
    const path = `${STORAGE_PREFIX}/${giftId}/${safeName}`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, file, {
        contentType: file.type,
    });

    const url = await getDownloadURL(storageRef);
    return { url };
}

/**
 * Delete an audio file from Storage.
 * @param {string} url - Firebase Storage download URL
 */
export async function deleteAudioByUrl(url) {
    const path = getPathFromDownloadUrl(url);
    if (!path) return;
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (err) {
        console.warn("Could not delete audio from Storage:", url, err);
    }
}
