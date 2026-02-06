const { onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const bcrypt = require("bcrypt");

admin.initializeApp();
const db = admin.firestore();

// ... existing code ...

/**
 * Hash a PIN code securely (server-side only)
 * Callable Function
 * Data: { pin: string }
 * Returns: { hash: string }
 */
exports.hashPin = onCall({ cors: true }, async (request) => {
  try {
    const { pin } = request.data;

    if (!pin || typeof pin !== 'string' || pin.length < 4 || pin.length > 8) {
      throw new // Function error handling usually throws specific errors, but simple throw works for now
        Error('Invalid PIN format');
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(pin, saltRounds);

    return { hash };
  } catch (error) {
    console.error('Error hashing PIN:', error);
    throw new Error('Internal server error');
  }
});

/**
 * Compare a PIN with a hash (server-side only)
 * Callable Function
 * Data: { pin: string, hash: string }
 * Returns: { match: boolean }
 */
exports.comparePin = onCall({ cors: true }, async (request) => {
  try {
    const { pin, hash } = request.data;

    if (!pin || !hash || typeof pin !== 'string' || typeof hash !== 'string') {
      throw new Error('Invalid parameters');
    }

    const match = await bcrypt.compare(pin, hash);
    return { match };
  } catch (error) {
    console.error('Error comparing PIN:', error);
    throw new Error('Internal server error');
  }
});

/**
 * Verify PIN for a gift (convenience function)
 * Callable Function
 * Data: { giftId: string, pin: string }
 * Returns: { match: boolean, giftData: object | null }
 */
exports.verifyGiftPin = onCall({ cors: true }, async (request) => {
  try {
    // console.log('verifyGiftPin called with data:', request.data); // Clean up logs

    const { giftId, pin } = request.data;

    if (!giftId || giftId === '') {
      console.error('Missing giftId');
      return { match: false, giftData: null };
    }

    if (!pin || pin === '') {
      console.error('Missing pin');
      return { match: false, giftData: null };
    }

    if (typeof pin !== 'string') {
      console.error('Invalid pin type:', typeof pin);
      return { match: false, giftData: null };
    }

    // Get gift document
    const giftRef = db.collection('gift_orders').doc(giftId);
    const giftDoc = await giftRef.get();

    if (!giftDoc.exists) {
      return { match: false, giftData: null };
    }

    const giftData = giftDoc.data();

    // ============================================
    // TIME CAPSULE CHECK
    // ============================================
    // If unlockDate is set and in the future, DENY access
    if (giftData.unlockDate) {
      // Firestore Timestamp to millis
      const unlockTime = giftData.unlockDate.toMillis ? giftData.unlockDate.toMillis() : new Date(giftData.unlockDate).getTime();
      const now = Date.now();

      if (now < unlockTime) {
        console.warn(`Gift ${giftId} is time-locked until ${new Date(unlockTime).toISOString()}`);
        // Return specific time-locked status so client can show countdown (if they bypassed the lock screen check)
        return {
          match: false,
          giftData: null,
          isTimeLocked: true,
          unlockDate: unlockTime
        };
      }
    }

    const accessCodeHash = giftData.accessCodeHash;
    const accessCode = giftData.accessCode;

    let match = false;

    // If hash exists, compare with hash
    if (accessCodeHash) {
      match = await bcrypt.compare(pin, accessCodeHash);
    }
    // Fallback: Compare with plain text (backward compatibility)
    else if (accessCode) {
      match = (pin === accessCode);
    }

    if (match) {
      // Return full gift data on success, BUT SANITIZED
      // Remove sensitive fields so they don't leak to client memory
      const safeGiftData = { ...giftData, id: giftDoc.id };
      delete safeGiftData.accessCode;
      delete safeGiftData.accessCodeHash;
      delete safeGiftData.securityToken; // Also hide token if not needed

      // CONVERT TIMESTAMP TO MILLIS
      if (safeGiftData.unlockDate && typeof safeGiftData.unlockDate.toMillis === 'function') {
        safeGiftData.unlockDate = safeGiftData.unlockDate.toMillis();
      } else if (safeGiftData.unlockDate) {
        safeGiftData.unlockDate = new Date(safeGiftData.unlockDate).getTime();
      }

      return { match: true, giftData: safeGiftData };
    } else {
      // Invalid PIN
      return { match: false, giftData: null };
    }

  } catch (error) {
    console.error('Error verifying gift PIN:', error);
    throw new Error('Internal server error');
  }
});

/**
 * Get public metadata for a locked gift
 * Callable Function
 * Data: { giftId: string }
 * Returns: { exists: boolean, locked: boolean, publicData: object | null }
 */
exports.getPublicGiftData = onCall({ cors: true }, async (request) => {
  try {
    const { giftId } = request.data;

    if (!giftId) {
      return { exists: false };
    }

    const giftRef = db.collection('gift_orders').doc(giftId);
    const giftDoc = await giftRef.get();

    if (!giftDoc.exists) {
      return { exists: false };
    }

    const data = giftDoc.data();
    const isLocked = data.locked === true;

    // Define public fields that resemble the "Lock Screen"
    const publicFields = [
      'project',
      'productType',
      'headline',
      'subheadline',
      'openingAnimation',
      'engravingText', // Needed for bracelet lock screen
      'designImage', // Maybe needed for preview?
      'locked',
      // TIME CAPSULE FIELDS
      // 'unlockDate', // Handle manually below to convert to millis
      'timezone'   // Just in case we need it for display
    ];

    const publicData = {};
    publicFields.forEach(field => {
      if (data[field] !== undefined) {
        publicData[field] = data[field];
      }
    });

    // Handle unlockDate separately to convert to millis
    if (data.unlockDate) {
      publicData.unlockDate = data.unlockDate.toMillis ? data.unlockDate.toMillis() : new Date(data.unlockDate).getTime();
    }

    // Always include ID
    publicData.id = giftDoc.id;

    return {
      exists: true,
      locked: isLocked,
      publicData: publicData
    };

  } catch (error) {
    console.error('Error getting public gift data:', error);
    throw new Error('Internal server error');
  }
});
