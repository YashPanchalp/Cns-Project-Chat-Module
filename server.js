/**
 * SECURE GROUP CHAT SYSTEM
 * 
 * Main Server File
 * 
 * TECHNOLOGY STACK:
 * - Express.js: Web framework
 * - Socket.io: Real-time messaging
 * - MongoDB: Data persistence
 * - AES-256-GCM: Symmetric encryption
 * 
 * SECURITY FEATURES:
 * ✓ Symmetric encryption (AES-256-GCM)
 * ✓ Per-room encryption keys
 * ✓ Keys stored in memory (not in database)
 * ✓ Authenticated encryption (prevents tampering)
 * ✓ Private messaging between users
 * ✓ Message integrity verification
 */

require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');

// Models
const Room = require('./models/Room');
const Message = require('./models/Message');

// Encryption utilities
const {
  encryptMessage,
  decryptMessage,
  getRoomKey,
  getKeyStats
} = require('./utils/encryption');

// ===== SERVER SETUP =====
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-chat';

// ===== MIDDLEWARE =====
// Serve static files (CSS, images, client-side JS)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ===== ROUTES =====
app.use('/', require('./routes/rooms'));

// ===== DATABASE CONNECTION =====
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('✓ Connected to MongoDB');
    console.log(`✓ MongoDB URI: ${MONGODB_URI}`);
  })
  .catch(err => {
    console.error('✗ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ===== SOCKET.IO - REAL-TIME MESSAGING =====

// Store active connections: { socketId: { username, roomId } }
const activeConnections = {};

io.on('connection', (socket) => {
  console.log(`\n[CONNECTION] New user connected: ${socket.id}`);

  /**
   * JOIN_ROOM EVENT
   * 
   * User joins a room:
   * 1. Store connection info
   * 2. Join Socket.io room
   * 3. Notify other users
   * 4. Send key to new user
   */
  socket.on('join-room', async (data) => {
    const { roomId, username, encryptionKey } = data;

    console.log(`[SOCKET] ${username} joining room ${roomId}`);

    // Store connection info
    activeConnections[socket.id] = { username, roomId };

    // Join Socket.io room
    socket.join(roomId);

    // Notify others in room
    io.to(roomId).emit('user-joined', {
      username: username,
      message: `${username} joined the chat`,
      timestamp: new Date()
    });

    console.log(`[ROOM] Total users in ${roomId}: ${Object.values(activeConnections).filter(c => c.roomId === roomId).length}`);
  });

  /**
   * SEND_MESSAGE EVENT
   * 
   * User sends a message:
   * 
   * ENCRYPTION FLOW:
   * 1. Receive plaintext message and recipient info from client
   * 2. Get encryption key for the room
   * 3. Encrypt the plaintext on server side
   * 4. Store ONLY encrypted text in database
   * 5. Broadcast encrypted message to room
   * 
   * WHY ENCRYPT ON SERVER?
   * - Ensures message is encrypted even if client malfunction
   * - Server is trusted entity
   * - Client-side encryption is also possible (hybrid approach)
   * 
   * @param {string} roomId - Room identifier
   * @param {string} sender - Sender's username
   * @param {string} message - PLAINTEXT message to encrypt
   * @param {string} receiver - Optional: specific recipient for private message
   */
  socket.on('send-message', async (data) => {
    try {
      const { roomId, sender, message, receiver } = data;

      console.log(`[MESSAGE] ${sender} → ${receiver || 'GROUP'} in ${roomId}`);

      // ===== GET ENCRYPTION KEY =====
      // Retrieve the key stored in memory for this room
      const key = getRoomKey(roomId);

      if (!key) {
        console.error(`[ERROR] Encryption key not found for room ${roomId}`);
        socket.emit('error', { message: 'Encryption key not available' });
        return;
      }

      // ===== ENCRYPT MESSAGE =====
      // Plaintext message is encrypted using AES-256-GCM
      // Format of encrypted text: iv:authTag:encryptedData (all hex)
      let encryptedText;
      try {
        encryptedText = encryptMessage(message, key);
        console.log(`[ENCRYPTION] Message encrypted successfully`);
      } catch (encryptError) {
        console.error('[ERROR] Encryption failed:', encryptError.message);
        socket.emit('error', { message: 'Failed to encrypt message' });
        return;
      }

      // ===== SAVE TO DATABASE =====
      // Only the encrypted text is stored
      // Plaintext NEVER written to disk
      const messageDoc = new Message({
        roomId,
        sender,
        receiver: receiver || null,
        encryptedText,
        isPrivate: !!receiver,
        messageType: receiver ? 'private' : 'group',
        timestamp: new Date()
      });

      await messageDoc.save();
      console.log(`[DATABASE] Message saved to MongoDB (encrypted only)`);

      // ===== DESTINATION LOGIC =====
      // Determine who sees this message

      if (receiver) {
        // PRIVATE MESSAGE
        // Only sender and receiver can see this message
        // Others don't see this message at all

        console.log(`[PRIVATE] Sending to ${sender} and ${receiver} only`);

        // Find sockets for sender and receiver
        const senderSocket = Object.entries(activeConnections)
          .find(([_, conn]) => conn.username === sender);
        const receiverSocket = Object.entries(activeConnections)
          .find(([_, conn]) => conn.username === receiver && conn.roomId === roomId);

        if (senderSocket) {
          io.to(senderSocket[0]).emit('receive-message', {
            _id: messageDoc._id,
            sender,
            receiver,
            encryptedText,
            decryptedText: message, // Client already has plaintext
            isPrivate: true,
            canDecrypt: true,
            timestamp: messageDoc.timestamp
          });
        }

        if (receiverSocket) {
          io.to(receiverSocket[0]).emit('receive-message', {
            _id: messageDoc._id,
            sender,
            receiver,
            encryptedText,
            decryptedText: message, // Recipient can decrypt
            isPrivate: true,
            canDecrypt: true,
            timestamp: messageDoc.timestamp
          });
        } else {
          // Receiver not online, send notification if implemented
          console.log(`[OFFLINE] ${receiver} is offline`);
        }

      } else {
        // GROUP MESSAGE
        // Broadcast to all users in the room
        console.log(`[GROUP] Broadcasting to room ${roomId}`);

        // Send encrypted message to all users in the room
        // Each client will decrypt using their stored key
        io.to(roomId).emit('receive-message', {
          _id: messageDoc._id,
          sender,
          receiver: null,
          encryptedText,
          isPrivate: false,
          timestamp: messageDoc.timestamp
          // Note: decryptedText NOT sent - clients decrypt themselves
          // This is good security practice - server doesn't send plaintext
        });
      }

      // Emit confirmation to sender
      socket.emit('message-sent', {
        _id: messageDoc._id,
        status: 'delivered'
      });

    } catch (error) {
      console.error('[ERROR] Failed to process message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  /**
   * DISCONNECT EVENT
   * 
   * User disconnects from chat:
   * 1. Remove from active connections
   * 2. Notify others in room
   */
  socket.on('disconnect', () => {
    const connection = activeConnections[socket.id];

    if (connection) {
      const { username, roomId } = connection;

      console.log(`[DISCONNECT] ${username} left room ${roomId}`);

      // Notify others
      io.to(roomId).emit('user-left', {
        username,
        message: `${username} left the chat`,
        timestamp: new Date()
      });

      delete activeConnections[socket.id];
    }
  });

  /**
   * TYPING EVENT (optional)
   * Show when someone is typing
   */
  socket.on('user-typing', (data) => {
    const { roomId, username, isTyping } = data;
    socket.to(roomId).emit('user-typing', {
      username,
      isTyping,
      timestamp: new Date()
    });
  });

  /**
   * REQUEST_KEY EVENT (alternative key distribution)
   * 
   * If a user needs the key again (e.g., page refresh)
   * They can request it from the server
   * 
   * SECURITY NOTE:
   * - This is less secure than Diffie-Hellman key exchange
   * - For production: Implement ECDH (see encryption.js)
   */
  socket.on('request-key', (data) => {
    const { roomId } = data;
    const connection = activeConnections[socket.id];

    if (!connection) {
      socket.emit('error', { message: 'Not connected to room' });
      return;
    }

    const key = getRoomKey(roomId);

    if (!key) {
      socket.emit('error', { message: 'Key not available' });
      return;
    }

    console.log(`[SECURITY] Key requested by ${connection.username} for room ${roomId}`);

    // Send key back to requestor
    socket.emit('key-response', {
      roomId,
      encryptionKey: key.toString('hex')
    });
  });
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).render('error', {
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🔒 SECURE CHAT SYSTEM STARTED');
  console.log('========================================');
  console.log(`✓ Server running on: http://localhost:${PORT}`);
  console.log(`✓ WebSocket ready for real-time messaging`);
  console.log(`✓ Encryption: AES-256-GCM`);
  console.log(`✓ Database: ${MONGODB_URI}`);
  console.log('========================================\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[SHUTDOWN] Shutting down gracefully...');
  await mongoose.disconnect();
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
});

module.exports = app;
