/**
 * ROOM MODEL
 * 
 * Stores metadata about chat rooms in MongoDB
 * 
 * IMPORTANT: The actual encryption key is NOT stored here!
 * Keys are stored only in memory (see encryption.js)
 * This prevents key exposure if the database is compromised
 */

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // Unique identifier for the room (displayed to users for joining)
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Name of the chat room
  roomName: {
    type: String,
    required: true
  },

  // Creator of the room (username)
  creator: {
    type: String,
    required: true
  },

  // List of users currently in the room
  users: [{
    username: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Maximum users allowed in this room (3-5)
  maxUsers: {
    type: Number,
    default: 5,
    min: 3,
    max: 5
  },

  // Timestamp when room was created
  createdAt: {
    type: Date,
    default: Date.now,
    // Auto-delete room after 24 hours for demo purposes
    index: { expires: 86400 }
  },

  // Whether the room is still active
  isActive: {
    type: Boolean,
    default: true
  },

  // Room status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },

  // Store a hashed version of the key (for verification only)
  // NOT the actual key - this prevents key exposure
  keyHash: {
    type: String,
    // This is optional - we can verify key integrity without storing plaintext
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
