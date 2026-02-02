/**
 * PIN Security Service
 * Server-side PIN hashing and verification via Cloud Functions
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

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
 * @returns {Promise<boolean>} - True if PIN matches
 */
export async function verifyGiftPin(giftId, pin) {
    try {
        const verifyGiftPinFunction = httpsCallable(functions, 'verifyGiftPin');
        const result = await verifyGiftPinFunction({ giftId, pin });
        return result.data.match;
    } catch (error) {
        console.error('Error verifying gift PIN:', error);
        return false;
    }
}
