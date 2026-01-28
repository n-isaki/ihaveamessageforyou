/**
 * Security Utilities
 * Input sanitization and validation
 */

/**
 * Sanitize user input to prevent XSS attacks
 * @param {string} input - User input
 * @param {number} maxLength - Maximum length allowed
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate PIN code format
 * @param {string} pin - PIN code
 * @returns {boolean} Is valid PIN
 */
export function isValidPin(pin) {
  if (typeof pin !== 'string') return false;
  // PIN should be 4-8 alphanumeric characters
  return /^[A-Z0-9]{4,8}$/i.test(pin);
}

/**
 * Validate message content
 * @param {object} message - Message object
 * @returns {boolean} Is valid message
 */
export function isValidMessage(message) {
  if (!message || typeof message !== 'object') return false;
  
  // Check required fields
  if (!message.type || !['text', 'image', 'video'].includes(message.type)) {
    return false;
  }
  
  // Validate content length
  if (message.content && typeof message.content === 'string') {
    const maxLength = message.type === 'text' ? 5000 : 1000; // URLs shorter
    if (message.content.length > maxLength) return false;
  }
  
  // Validate author
  if (message.author && typeof message.author === 'string') {
    if (message.author.length > 100) return false;
  }
  
  return true;
}

/**
 * Rate limiting helper (client-side, should be backed by server-side)
 * @param {string} key - Rate limit key (e.g., IP or user ID)
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} Is within rate limit
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 3600000) {
  const storageKey = `rate_limit_${key}`;
  const stored = localStorage.getItem(storageKey);
  
  if (!stored) {
    localStorage.setItem(storageKey, JSON.stringify({
      count: 1,
      resetAt: Date.now() + windowMs
    }));
    return true;
  }
  
  const data = JSON.parse(stored);
  
  if (Date.now() > data.resetAt) {
    // Reset window
    localStorage.setItem(storageKey, JSON.stringify({
      count: 1,
      resetAt: Date.now() + windowMs
    }));
    return true;
  }
  
  if (data.count >= maxAttempts) {
    return false; // Rate limit exceeded
  }
  
  // Increment count
  data.count++;
  localStorage.setItem(storageKey, JSON.stringify(data));
  return true;
}
