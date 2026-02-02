/**
 * Security Utilities
 * Input Sanitization, Rate Limiting, Validation
 * 
 * NOTE: PIN-Hashing sollte server-seitig in Cloud Functions implementiert werden.
 * Client-seitiges Hashing ist nicht ideal, da der Hash-Algorithmus exponiert ist.
 */

/**
 * Validate PIN code format
 * @param {string} pin - The PIN to validate
 * @returns {boolean} - True if valid format
 */
export function isValidPin(pin) {
    if (typeof pin !== 'string') return false;
    // PIN should be 4-8 alphanumeric characters
    return /^[A-Z0-9]{4,8}$/i.test(pin);
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - The input to sanitize
 * @param {number} maxLength - Maximum length (default: 1000)
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, maxLength = 1000) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove script tags and other dangerous HTML
    let sanitized = input
        .slice(0, maxLength)
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    
    return sanitized;
}

/**
 * Validate message content
 * @param {object} message - Message object
 * @returns {boolean} - True if valid
 */
export function isValidMessage(message) {
    if (!message || typeof message !== 'object') {
        return false;
    }
    
    // Check required fields
    if (!message.content || typeof message.content !== 'string') {
        return false;
    }
    
    // Check length
    if (message.content.length > 2000) {
        return false;
    }
    
    // Check author length
    if (message.author && message.author.length > 100) {
        return false;
    }
    
    return true;
}

/**
 * Rate Limiting (client-side, stored in localStorage)
 * For production, this should be server-side
 */
const RATE_LIMIT_KEY_PREFIX = 'rate_limit_';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 3600000; // 1 hour

/**
 * Check if rate limit is exceeded
 * @param {string} key - Unique key (e.g., gift ID)
 * @param {number} maxAttempts - Maximum attempts (default: 5)
 * @param {number} windowMs - Time window in milliseconds (default: 1 hour)
 * @returns {boolean} - True if rate limit exceeded
 */
export function checkRateLimit(key, maxAttempts = MAX_ATTEMPTS, windowMs = WINDOW_MS) {
    try {
        const storageKey = `${RATE_LIMIT_KEY_PREFIX}${key}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
            // First attempt
            localStorage.setItem(storageKey, JSON.stringify({
                attempts: 1,
                firstAttempt: Date.now()
            }));
            return false;
        }
        
        const data = JSON.parse(stored);
        const now = Date.now();
        const timeSinceFirst = now - data.firstAttempt;
        
        if (timeSinceFirst > windowMs) {
            // Window expired, reset
            localStorage.setItem(storageKey, JSON.stringify({
                attempts: 1,
                firstAttempt: now
            }));
            return false;
        }
        
        // Increment attempts
        data.attempts = (data.attempts || 0) + 1;
        localStorage.setItem(storageKey, JSON.stringify(data));
        
        return data.attempts > maxAttempts;
    } catch (error) {
        console.error('Error checking rate limit:', error);
        // On error, allow (fail open for UX)
        return false;
    }
}

/**
 * Reset rate limit for a key
 * @param {string} key - Unique key
 */
export function resetRateLimit(key) {
    try {
        const storageKey = `${RATE_LIMIT_KEY_PREFIX}${key}`;
        localStorage.removeItem(storageKey);
    } catch (error) {
        console.error('Error resetting rate limit:', error);
    }
}

/**
 * Get remaining attempts
 * @param {string} key - Unique key
 * @returns {number} - Remaining attempts
 */
export function getRemainingAttempts(key) {
    try {
        const storageKey = `${RATE_LIMIT_KEY_PREFIX}${key}`;
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
            return MAX_ATTEMPTS;
        }
        
        const data = JSON.parse(stored);
        const now = Date.now();
        const timeSinceFirst = now - data.firstAttempt;
        
        if (timeSinceFirst > WINDOW_MS) {
            return MAX_ATTEMPTS;
        }
        
        return Math.max(0, MAX_ATTEMPTS - (data.attempts || 0));
    } catch (error) {
        return MAX_ATTEMPTS;
    }
}
