/**
 * Album image upload: validate, compress, upload to Storage.
 * Security: file type/size validated client-side and enforced by Storage rules; rate limit per gift.
 */
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { storage } from "@/firebase";
import {
  validateAlbumFile,
  checkAlbumUploadRateLimit,
  getRemainingAlbumUploads,
  ALBUM_MAX_FILES,
} from "@/utils/security";

const STORAGE_PREFIX = "gift-images";

const compressionOptions = {
  maxSizeMB: 1.2,
  maxWidthOrHeight: 1600,
  useWebWorker: true,
  initialQuality: 0.85,
  fileType: undefined, // keep original (jpeg/png/webp)
};

/**
 * Compress image before upload (reduces size, keeps quality)
 * @param {File} file
 * @returns {Promise<File>}
 */
async function compressImage(file) {
  try {
    return await imageCompression(file, compressionOptions);
  } catch (err) {
    console.warn("Compression failed, uploading original:", err);
    return file;
  }
}

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
 * Upload one image to album. Validates, rate-limits, compresses, uploads.
 * @param {string} giftId
 * @param {File} file
 * @param {string[]} currentUrls - current albumImages array (length must be < ALBUM_MAX_FILES)
 * @returns {Promise<{ url: string }>}
 */
export async function uploadAlbumImage(giftId, file, currentUrls = []) {
  if (!giftId || !file) {
    throw new Error("Gift-ID und Datei erforderlich.");
  }
  if (currentUrls.length >= ALBUM_MAX_FILES) {
    throw new Error(`Maximal ${ALBUM_MAX_FILES} Bilder erlaubt.`);
  }

  const validation = validateAlbumFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (checkAlbumUploadRateLimit(giftId)) {
    const remaining = getRemainingAlbumUploads(giftId);
    throw new Error(
      `Zu viele Uploads. Bitte später erneut versuchen. (${remaining} Uploads in dieser Stunde übrig)`
    );
  }

  const compressed = await compressImage(file);
  const safeName = `${Date.now()}_${(file.name || "image").replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  )}`;
  const path = `${STORAGE_PREFIX}/${giftId}/${safeName}`;
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, compressed, {
    contentType: file.type,
  });
  const url = await getDownloadURL(storageRef);
  return { url };
}

/**
 * Delete one image from Storage (by URL). Call this when removing from album or when deleting gift.
 * @param {string} url - Firebase Storage download URL
 */
export async function deleteAlbumImageByUrl(url) {
  const path = getPathFromDownloadUrl(url);
  if (!path) return;
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Could not delete album image from Storage:", url, err);
  }
}

/**
 * Delete all album images for a gift (e.g. when gift is deleted)
 * @param {string[]} urls - albumImages array
 */
export async function deleteAllAlbumImages(urls) {
  if (!urls || !Array.isArray(urls)) return;
  await Promise.allSettled(urls.map((url) => deleteAlbumImageByUrl(url)));
}
