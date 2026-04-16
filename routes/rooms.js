/**
 * ROOM ROUTES
 * 
 * Handles:
 * - Creating new rooms
 * - Joining existing rooms
 * - Room listing
 * - Room deletion
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Message = require('../models/Message');
const { generateEncryptionKey, storeRoomKey } = require('../utils/encryption');

/**
 * GET / - Home page
 * Display form to create or join a room
 */
router.get('/', (req, res) => {
  res.render('home');
});

/**
 * POST /create-room
 * 
 * Creates a new chat room with encryption key
 * 
 * SECURITY PROCESS:
 * 1. Generate unique Room ID
 * 2. Generate symmetric encryption key for the room
 * 3. Store key in memory (NOT in database)
 * 4. Save room metadata to database
 * 5. Redirect to chatroom
 * 
 * @body {string} roomName - Name of the room
 * @body {string} username - Creator's username
 */
router.post('/create-room', async (req, res) => {
  try {
    const { roomName, username } = req.body;

    if (!roomName || !username) {
      return res.status(400).json({ error: 'Room name and username required' });
    }

    // Generate unique room ID (displayed to users for joining)
    const roomId = uuidv4().slice(0, 8).toUpperCase();

    // ===== KEY GENERATION =====
    // Generate a new 256-bit AES key for this room
    // Each room gets a unique key
    const encryptionKey = generateEncryptionKey();

    // ===== KEY STORAGE =====
    // Store the key in memory ONLY (volatile storage)
    // NOT persisted to MongoDB to prevent key exposure
    storeRoomKey(roomId, encryptionKey);

    // Create room document (metadata only, no key stored)
    const room = new Room({
      roomId,
      roomName,
      creator: username,
      users: [{
        username,
        joinedAt: new Date()
      }],
      isActive: true
    });

    await room.save();

    console.log(`[ROOM] Created: ${roomId} by ${username}`);
    console.log(`[SECURITY] Encryption key stored in memory for room ${roomId}`);

    // Send room ID and KEY to user (they share Room ID with others, keep key safe)
    res.json({
      success: true,
      roomId,
      message: 'Room created! Share this Room ID with others',
      encryptionKey: encryptionKey.toString('hex')  // SEND KEY TO CREATOR
    });

  } catch (error) {
    console.error('Error creating room:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create room: ' + error.message });
  }
});

/**
 * POST /join-room
 * 
 * Joins an existing room
 * 
 * SECURITY PROCESS:
 * 1. Find room by ID
 * 2. Check if room is full
 * 3. Check if user already exists
 * 4. Add user to room
 * 5. Retrieve the encryption key from memory
 * 6. Send key to user (will be sent via Socket.io)
 * 
 * @body {string} roomId - Room ID to join
 * @body {string} username - Username joining
 */
router.post('/join-room', async (req, res) => {
  try {
    const { roomId, username } = req.body;

    if (!roomId || !username) {
      return res.status(400).json({ error: 'Room ID and username required' });
    }

    // Find the room
    const room = await Room.findOne({ roomId, isActive: true });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is full
    if (room.users.length >= room.maxUsers) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if user already in room
    const userExists = room.users.some(u => u.username === username);
    if (userExists) {
      return res.status(400).json({ error: 'Username already in room' });
    }

    // Add user to room
    room.users.push({
      username,
      joinedAt: new Date()
    });

    await room.save();

    // ===== KEY DISTRIBUTION =====
    // Retrieve the encryption key from memory
    // This key is shared with all room members
    // LIMITATION: Currently sent in plaintext over Socket.io
    // IMPROVEMENT: Use ECDH key exchange (see encryption.js bonus section)
    const { getRoomKey } = require('../utils/encryption');
    const key = getRoomKey(roomId);

    if (!key) {
      console.error(`[SECURITY WARNING] Key not found for room ${roomId}`);
      return res.status(500).json({ error: 'Room encryption key not available' });
    }

    console.log(`[ROOM] User ${username} joined room ${roomId}`);
    console.log(`[SECURITY] Preparing to share encryption key with user ${username}`);

    res.json({
      success: true,
      roomId,
      username,
      message: 'Joined room successfully!',
      // The key is sent here - in production use TLS/SSL
      encryptionKey: key.toString('hex')
    });

  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

/**
 * GET /room/:roomId
 * 
 * Load the chat room interface with message history
 * 
 * @param {string} roomId - Room ID
 */
router.get('/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.query;

    if (!username) {
      return res.redirect('/');
    }

    // Find room
    const room = await Room.findOne({ roomId, isActive: true });

    if (!room) {
      return res.status(404).render('404', { message: 'Room not found' });
    }

    // ===== SECURITY: LOAD ALL MESSAGES =====
    // Load all messages in the room (both group and private)
    // 
    // SECURITY ARCHITECTURE:
    // - Front-end controls what users can READ (via authorization checks)
    // - Server loads all messages for transparency
    // - Clients filter which messages they can decrypt
    // 
    // Private messages:
    // - SENDER and RECEIVER get decrypted text
    // - OTHER USERS get encrypted text with lock indicator
    // - This provides privacy while maintaining transparency about message activity
    const messages = await Message.find({ roomId })
      .sort({ timestamp: 1 })
      .limit(100) // Increased limit to show more history
      .exec();

    // ===== KEY RETRIEVAL FOR ALL USERS =====
    // Get the encryption key from memory for all room users
    // Stored in sessionStorage on client side
    // If not in memory (server restart), re-request via socket event
    const { getRoomKey } = require('../utils/encryption');
    const roomKey = getRoomKey(roomId);
    const encryptionKeyHex = roomKey ? roomKey.toString('hex') : null;

    if (!encryptionKeyHex) {
      console.warn(`[WARNING] Encryption key not in memory for room ${roomId}`);
      console.warn('[INFO] Client must have key in sessionStorage to decrypt messages');
    }

    res.render('chatroom', {
      roomId,
      username,
      roomName: room.roomName,
      users: room.users.map(u => u.username),
      messages: messages.map(msg => ({
        _id: msg._id,
        sender: msg.sender,
        receiver: msg.receiver,
        encryptedText: msg.encryptedText,
        isPrivate: msg.isPrivate,
        timestamp: msg.timestamp,
        messageType: msg.messageType
      })),
      encryptionKeyHex  // Pass the key to the template (may be null)
    });

  } catch (error) {
    console.error('Error loading room:', error);
    res.status(500).render('error', { message: 'Failed to load room' });
  }
});

/**
 * POST /room/:roomId/delete
 * 
 * Delete a room (only creator can delete)
 * Also deletes the encryption key from memory
 */
router.post('/room/:roomId/delete', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { username } = req.body;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only creator can delete
    if (room.creator !== username) {
      return res.status(403).json({ error: 'Only creator can delete room' });
    }

    // Mark as deleted
    room.isActive = false;
    room.status = 'deleted';
    await room.save();

    // Delete the encryption key from memory
    const { deleteRoomKey } = require('../utils/encryption');
    deleteRoomKey(roomId);

    console.log(`[ROOM] Room ${roomId} deleted by ${username}`);
    console.log(`[SECURITY] Encryption key deleted from memory`);

    res.json({ success: true, message: 'Room deleted' });

  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

/**
 * GET /api/stats
 * 
 * Get encryption statistics (for demo/monitoring)
 * Shows which rooms have active keys in memory
 */
router.get('/api/stats', (req, res) => {
  const { getKeyStats } = require('../utils/encryption');
  const stats = getKeyStats();
  res.json(stats);
});

module.exports = router;
