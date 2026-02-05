/**
 * PIN Security Service
 * Server-side PIN hashing and verification via Cloud Functions
 */

import { httpsCallable } from "firebase/functions";
import { getApps, getApp } from "firebase/app";
import { getFunctions } from "firebase/functions";

// Get the same app instance that firebase.js uses
const app = getApps().length > 0 ? getApp() : null;
if (!app) {
    throw new Error("Firebase app not initialized. Import firebase.js first.");
}
const functions = getFunctions(app);

/**
 * Hash a PIN code securely (server-side)
 * @param {string} pin - The PIN to hash
 * @returns {Promise<string>} - The hashed PIN
 */
export async function hashPin(pin) {
    try {
        const hashPinFunction = httpsCallable(functions, 'hashPin');
        const result = await hashPinFunction({ pin });
        return result.data.hash;
    } catch (error) {
        console.error('Error hashing PIN:', error);
        throw error;
    }
}

/**
 * Compare a PIN with a hash (server-side)
 * @param {string} pin - The PIN to check
 * @param {string} hash - The hashed PIN
 * @returns {Promise<boolean>} - True if PIN matches hash
 */
export async function comparePin(pin, hash) {
    try {
        const comparePinFunction = httpsCallable(functions, 'comparePin');
        const result = await comparePinFunction({ pin, hash });
        return result.data.match;
    } catch (error) {
        console.error('Error comparing PIN:', error);
        return false;
    }
}

/**
 * Verify PIN for a gift (convenience function)
 * @param {string} giftId - The gift ID
 * @param {string} pin - The PIN to verify
 * @returns {Promise<{match: boolean, giftData: object|null}>} - Result object
 */
export async function verifyGiftPin(giftId, pin) {
    try {
        if (!giftId || !pin) {
            console.error('verifyGiftPin: Missing giftId or pin', { giftId, pin });
            return { match: false, giftData: null };
        }

        console.log('verifyGiftPin: Calling Cloud Function with', { giftId, pinLength: pin.length });
        const verifyGiftPinFunction = httpsCallable(functions, 'verifyGiftPin');
        const result = await verifyGiftPinFunction({
            giftId: String(giftId),
            pin: String(pin)
        });

        console.log('verifyGiftPin: Result', result.data);
        // Return full structure: { match: boolean, giftData: ... }
        return result.data;
    } catch (error) {
        console.error('Error verifying gift PIN:', error);
        console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details
        });
        return { match: false, giftData: null };
    }
}

/**
 * Get public metadata for a locked gift
 * @param {string} giftId 
 * @returns {Promise<{exists: boolean, locked: boolean, publicData: object|null}>}
 */
export async function getPublicGiftData(giftId) {
    try {
        const getPublicDataFn = httpsCallable(functions, 'getPublicGiftData');
        const result = await getPublicDataFn({ giftId });
        return result.data;
    } catch (error) {
        console.error('Error fetching public gift data:', error);
        throw error;
    }
}
