/**
 * ENCRYPTION UTILITY MODULE - AES-256-GCM Symmetric Encryption
 * 
 * ==================== KEY MANAGEMENT EXPLANATION ====================
 * 
 * 1. KEY GENERATION:
 *    - Symmetric key (256-bit) is generated using crypto.randomBytes() when a room is created
 *    - Key is stored in memory (room object) for the session
 *    - Key is NOT permanently stored in database (security best practice)
 *    - In production: Use key management service (AWS KMS, HashiCorp Vault)
 * 
 * 2. KEY DISTRIBUTION:
 *    - When a user joins a room, the key is sent via secure Socket.io connection
 *    - LIMITATION: Currently sent in plaintext over the connection
 *    - IMPROVEMENT: Use Diffie-Hellman key exchange (see bonus section below)
 *    - In production: Use TLS/SSL encryption for transport security
 * 
 * 3. KEY STORAGE:
 *    - Keys stored ONLY in memory (activeKeys object)
 *    - Keys are NOT permanently persisted to MongoDB
 *    - WHY? Because if attackers access the database, they shouldn't get keys
 *    - TRADE-OFF: Keys are lost if server restarts (acceptable for demo)
 * 
 * 4. ENCRYPTION ALGORITHM: AES-256-GCM
 *    - AES (Advanced Encryption Standard) with 256-bit key
 *    - GCM (Galois/Counter Mode) provides authenticated encryption
 *    - Prevents tampering and ensures message integrity
 *    - IV (Initialization Vector): Random 16 bytes per message for security
 *    - Auth Tag: Added for authentication verification
 * 
 * ====================================================================
 */

const crypto = require('crypto');

// Store active room encryption keys in memory
// Structure: { roomId: keyBuffer }
// SECURITY CONSIDERATION: In production, use Redis or secure key vault
const activeKeys = {};

/**
 * Generates a secure symmetric key for a chat room
 * 
 * HOW IT WORKS:
 * 1. Uses crypto.randomBytes(32) to generate 256 random bits
 * 2. Each room gets a unique, cryptographically secure key
 * 3. Key is never generated twice for the same room
 * 
 * SECURITY LEVEL: ⭐⭐⭐⭐⭐ (Industry standard)
 * 
 * @returns {Buffer} - 256-bit encryption key
 */
function generateEncryptionKey() {
  // crypto.randomBytes() uses the system's cryptographically secure random source
  return crypto.randomBytes(32); // 256 bits for AES-256
}

/**
 * Stores the encryption key for a room in memory
 * 
 * SECURITY NOTES:
 * - Keys are stored in volatile memory (RAM)
 * - Lost on server restart (acceptable for chat demo)
 * - Not persisted to database (prevents key exposure if DB is breached)
 * - In production: Use Redis with expiration or AWS KMS
 * 
 * @param {string} roomId - Unique room identifier
 * @param {Buffer} key - Encryption key to store
 */
function storeRoomKey(roomId, key) {
  activeKeys[roomId] = key;
  console.log(`[SECURITY] Key stored in memory for room: ${roomId}`);
}

/**
 * Retrieves the encryption key for a room
 * 
 * @param {string} roomId - Room identifier
 * @returns {Buffer|null} - The encryption key or null if not found
 */
function getRoomKey(roomId) {
  return activeKeys[roomId] || null;
}

/**
 * Encrypts a message using AES-256-GCM
 * 
 * ENCRYPTION PROCESS:
 * 1. Generate random IV (Initialization Vector) for this message
 * 2. Create cipher using AES-256-GCM algorithm
 * 3. Encrypt the plaintext message
 * 4. Generate authentication tag (prevents tampering)
 * 5. Return: IV + AuthTag + EncryptedData (all as hex string)
 * 
 * WHY GCM? 
 * - Provides both confidentiality (encryption) AND authenticity (verification)
 * - Detects if message was altered in transit
 * 
 * @param {string} plaintext - Message to encrypt
 * @param {Buffer} key - Encryption key
 * @returns {string} - Encrypted data in format: iv:authTag:encryptedData (hex)
 */
function encryptMessage(plaintext, key) {
  try {
    // Step 1: Generate a random IV (Initialization Vector) for this specific message
    // Using different IV for each message is crucial for security
    // Even if two messages are identical, their encrypted forms will be different
    const iv = crypto.randomBytes(16); // 128-bit IV for GCM

    // Step 2: Create cipher instance
    // 'aes-256-gcm' uses 256-bit key and Galois/Counter Mode
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Step 3: Encrypt the message
    // Can be called multiple times for streaming data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');

    // Finalize encryption
    encrypted += cipher.final('hex');

    // Step 4: Get authentication tag
    // This tag verifies that the message hasn't been tampered with
    const authTag = cipher.getAuthTag();

    // Step 5: Return combined result
    // Format: base64_ENCODED(IV:AuthTag:EncryptedData) for safe transmission
    const result = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
    console.log(`[ENCRYPTION] Message encrypted successfully`);
    return result;
  } catch (error) {
    console.error('[ERROR] Encryption failed:', error.message);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Decrypts a message encrypted with AES-256-GCM
 * 
 * DECRYPTION PROCESS:
 * 1. Parse the encrypted data (extract IV, AuthTag, EncryptedData)
 * 2. Create decipher with same algorithm and key
 * 3. Set authentication tag (for verification)
 * 4. Decrypt the message
 * 5. Verify authenticity (automatic with GCM)
 * 
 * SECURITY:
 * - If auth tag doesn't match → message was tampered with
 * - Throws error if tampering detected
 * 
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:encrypted (hex)
 * @param {Buffer} key - Same encryption key used for encryption
 * @returns {string} - Decrypted plaintext message
 */
function decryptMessage(encryptedData, key) {
  try {
    // Step 1: Parse the encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    // Step 2: Create decipher instance with same algorithm and key
    // Must use exact same IV and key that were used for encryption
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);

    // Step 3: Set the authentication tag for verification
    // If the tag doesn't match, decryption will fail with an error
    decipher.setAuthTag(authTag);

    // Step 4: Decrypt the message
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');

    // Step 5: Finalize decryption (also verifies auth tag)
    decrypted += decipher.final('utf8');

    console.log(`[DECRYPTION] Message decrypted successfully`);
    return decrypted;
  } catch (error) {
    console.error('[ERROR] Decryption failed:', error.message);
    throw new Error('Failed to decrypt message: ' + error.message);
  }
}

/**
 * Deletes a room's encryption key from memory
 * 
 * Used when room is deleted or expires
 * 
 * @param {string} roomId - Room identifier
 */
function deleteRoomKey(roomId) {
  if (activeKeys[roomId]) {
    delete activeKeys[roomId];
    console.log(`[SECURITY] Key deleted from memory for room: ${roomId}`);
  }
}

/**
 * Gets key statistics (for demo purposes only)
 * 
 * @returns {Object} - Statistics about active keys
 */
function getKeyStats() {
  return {
    activeRooms: Object.keys(activeKeys).length,
    roomIds: Object.keys(activeKeys)
  };
}

/**
 * ==================== BONUS: DIFFIE-HELLMAN KEY EXCHANGE ====================
 * 
 * This would replace the basic "send key over Socket.io" approach
 * with a secure, proven key exchange mechanism
 * 
 * HOW IT WORKS:
 * 1. Server generates a large prime (p) and generator (g)
 * 2. Server picks secret number (a), calculates: A = g^a mod p
 * 3. Client picks secret number (b), calculates: B = g^b mod p
 * 4. Server sends A to client, client sends B to server
 * 5. Server computes: shared_key = B^a mod p
 * 6. Client computes: shared_key = A^b mod p
 * 7. Both arrive at the SAME shared_key without ever sending it!
 * 
 * SECURITY:
 * - Even if eavesdropper sees A and B, they cannot calculate shared_key
 * - Requires solving discrete logarithm problem (computationally infeasible)
 * 
 * IMPLEMENTATION NOTE:
 * Node.js has built-in ECDH (Elliptic Curve Diffie-Hellman) which is more secure
 * See example implementation below
 * 
 * =========================================================================
 */

/**
 * BONUS: Generate ECDH key pair for secure key exchange
 * 
 * ECDH (Elliptic Curve DH) is modern, more efficient version of Diffie-Hellman
 * 
 * @returns {Object} - { privateKey, publicKey }
 */
function generateECDHKeyPair() {
  const ecdh = crypto.createECDH('prime256v1');
  const publicKey = ecdh.generateKeys();
  return {
    privateKey: ecdh,
    publicKey: publicKey.toString('hex')
  };
}

/**
 * BONUS: Compute shared secret using ECDH
 * 
 * @param {Object} privateKey - Your private key from generateECDHKeyPair
 * @param {string} otherPublicKey - Other party's public key (hex string)
 * @returns {Buffer} - Shared secret that can be used as encryption key
 */
function computeECDHSharedSecret(privateKey, otherPublicKey) {
  const sharedSecret = privateKey.computeSecret(Buffer.from(otherPublicKey, 'hex'));
  // Derive a 256-bit key from the shared secret using PBKDF2
  return crypto.pbkdf2Sync(sharedSecret, 'salt', 100000, 32, 'sha256');
}

module.exports = {
  // Core functions
  generateEncryptionKey,
  storeRoomKey,
  getRoomKey,
  encryptMessage,
  decryptMessage,
  deleteRoomKey,
  getKeyStats,
  
  // Bonus: ECDH key exchange
  generateECDHKeyPair,
  computeECDHSharedSecret
};
