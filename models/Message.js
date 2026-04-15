/**
 * MESSAGE MODEL
 * 
 * Stores encrypted messages in MongoDB
 * 
 * IMPORTANT SECURITY NOTES:
 * - Only ENCRYPTED text is stored in database
 * - Plaintext messages are NEVER written to disk
 * - Decryption happens only on client-side or for intended recipients
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Reference to the room where message was sent
  roomId: {
    type: String,
    required: true,
    index: true
  },

  // Username of who sent the message
  sender: {
    type: String,
    required: true
  },

  // Username of intended recipient (for private/direct messages)
  // If null, it's a group message visible to all in room
  receiver: {
    type: String,
    default: null
  },

  // ENCRYPTED MESSAGE TEXT
  // Format: iv:authTag:encryptedData (hex encoded)
  // See encryption.js for how this is created and decrypted
  encryptedText: {
    type: String,
    required: true
  },

  // Message type indicator (helps UI know how to display)
  messageType: {
    type: String,
    enum: ['group', 'private'],
    default: 'group'
  },

  // Is this a private message (between two users)
  isPrivate: {
    type: Boolean,
    default: false
  },

  // Display status indicators
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },

  // Timestamp when message was sent
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // How many users have read this message (for receipts)
  readBy: [{
    username: String,
    readAt: Date
  }]
}, { timestamps: true });

// Index for efficient querying by room and time
messageSchema.index({ roomId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
