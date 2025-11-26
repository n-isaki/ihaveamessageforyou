/**
 * @typedef {Object} Message
 * @property {string} id - Unique ID for the message
 * @property {string} author - Name of the message author
 * @property {'text' | 'video'} type - Type of the message
 * @property {string} content - Text content or Video URL
 */

/**
 * @typedef {Object} GiftOrder
 * @property {string} id - Auto-generated ID
 * @property {string} recipientName - Name of the recipient
 * @property {string} accessCode - PIN code
 * @property {string} customerName - Name of the buyer
 * @property {string} customerEmail - Email of the buyer
 * @property {boolean} viewed - Whether the gift has been viewed
 * @property {import('firebase/firestore').Timestamp | null} viewedAt - When it was viewed
 * @property {import('firebase/firestore').Timestamp} createdAt - Creation timestamp
 * @property {Message[]} messages - Array of messages
 */

export { };
