# 🔒 Secure Group Chat System with AES-256 Encryption

A full-stack web application demonstrating secure real-time group messaging with symmetric encryption, key management, and private messaging capabilities.

## 📌 Project Overview

**Language:** Node.js (Express)  
**Frontend:** EJS + CSS  
**Database:** MongoDB  
**Real-time Communication:** Socket.io  
**Encryption:** AES-256-GCM (Node.js `crypto` module)  
**Key Management:** In-memory storage with secure key generation and distribution

---

## 🎯 Features

### ✅ User Management
- Create new chat rooms (no login required for demo)
- Join existing rooms using Room ID
- Support for 3-5 users per room
- Real-time user presence display

### ✅ Messaging
- **Group Messages:** Broadcast to all users in room
- **Private Messages:** Encrypted messages between specific users
- **Real-time Updates:** Instant message delivery via Socket.io
- **Message History:** Persistent storage in MongoDB
- **Decryption:** Client-side decryption display

### ✅ Encryption & Security
- **AES-256-GCM:** Authenticated encryption algorithm
- **Symmetric Keys:** Unique 256-bit key per room
- **Message Integrity:** Prevents tampering with authentication tags
- **IV Randomization:** Unique initialization vector per message
- **Secure Key Management:** Keys stored in memory, not in database

### ✅ UI/UX
- Modern, responsive design
- Real-time typing indicators
- Message encryption status display
- Encrypted/decrypted toggle for educational purposes
- Mobile-friendly interface

---

## 🔐 Security Architecture

### 1. **Encryption Algorithm: AES-256-GCM**

```
AES (Advanced Encryption Standard)
├── Key Size: 256 bits (32 bytes)
├── Mode: GCM (Galois/Counter Mode)
├── IV: 128 bits per message (random)
├── Authentication Tag: 128 bits
└── Provides: Confidentiality + Authenticity
```

**Why GCM?**
- Provides authenticated encryption (encryption + authentication in one operation)
- Detects if message was tampered with in transit
- Industry standard (NIST-approved)
- Efficient and fast

### 2. **Key Generation**

```javascript
// In utils/encryption.js
function generateEncryptionKey() {
  return crypto.randomBytes(32); // 256 bits
}
```

**Security Level:** ⭐⭐⭐⭐⭐ (Cryptographically secure random)

**When Generated:**
- Once per room (on room creation)
- Unique for each room
- Never re-used

### 3. **Key Distribution**

**Current Implementation (Demo):**
```
User creates room → Key generated → Key sent via Socket.io to members
```

**Limitation:** Key sent in plaintext over Socket.io (acceptable for demo)

**Production Improvement:** Use ECDH key exchange
```
1. Server generates ECDH public/private keypair
2. Client generates ECDH public/private keypair
3. Exchange public keys (safe to transmit)
4. Both compute same shared secret independently
5. Use shared secret as encryption key
→ Key is never transmitted in plaintext!
```

### 4. **Key Storage**

**Where Keys Are Stored:**
```javascript
// In memory (volatile)
const activeKeys = {};
activeKeys[roomId] = encryptionKey; // Buffer
```

**Why Not in Database?**
1. **Database Breach Risk:** If MongoDB is compromised, plaintext keys are exposed
2. **Separation of Concerns:** Authentication data (DB) separate from encryption keys (memory)
3. **Compliance:** Follows security best practices (never store plaintext keys in database)

**Trade-off:**
- ✅ Better security
- ❌ Keys lost on server restart (acceptable for chat demo)

**Production Solution:** Use Redis with TTL or AWS KMS

### 5. **Message Encryption Flow**

```
Client sends plaintext message to server
↓
Server retrieves room key from memory
↓
Server encrypts using AES-256-GCM
  • Generates random IV (16 bytes)
  • Encrypts plaintext
  • Generates auth tag
  • Returns: iv:authTag:encryptedData (hex)
↓
Server stores ONLY encrypted text in MongoDB
↓
Server broadcasts encrypted message to room
↓
Recipient clients decrypt locally using stored key
```

### 6. **Private Message Encryption**

```
User sends message to specific user
↓
Server encrypts with room key
↓
Server identifies recipient socket
↓
Sends decrypted copy only to sender and recipient
↓
Other users see encrypted message (cannot decrypt)
```

---

## 📂 Project Structure

```
Secure Chat Room/
├── server.js                 # Main Express + Socket.io server
├── package.json              # Dependencies
├── .env                       # Environment variables
│
├── models/
│   ├── Room.js              # MongoDB Room schema
│   └── Message.js           # MongoDB Message schema
│
├── routes/
│   └── rooms.js             # Express routes for room operations
│
├── utils/
│   └── encryption.js        # Encryption/Decryption utilities
│                              # Key generation & management
│
├── views/
│   ├── home.ejs             # Create/Join room interface
│   ├── chatroom.ejs         # Chat interface with real-time messaging
│   ├── error.ejs            # Error page
│   └── 404.ejs              # Not found page
│
└── public/
    └── style.css            # Modern CSS styling
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or cloud instance)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Create `.env` File

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/secure-chat
```

For MongoDB Atlas (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secure-chat?retryWrites=true&w=majority
```

### 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will be running at: `http://localhost:3000`

### 4. MongoDB Setup (if using local MongoDB)

```bash
# Start MongoDB service
mongod

# Verify connection
mongo admin --eval "db.version()"
```

---

## 📖 Usage Guide

### Creating a Room

1. Go to http://localhost:3000
2. Enter username and room name
3. Click "Create Room"
4. Share the **Room ID** with others
5. Click "Enter Room" to join

### Joining a Room

1. Get the Room ID from room creator
2. Enter your username
3. Paste Room ID
4. Click "Join Room"

### Sending Messages

**Group Message:**
1. Select "📢 Group Message" from dropdown
2. Type your message
3. Click Send or press Ctrl+Enter

**Private Message:**
1. Select recipient from dropdown (🔒 Private: Username)
2. Type message (encryption handled automatically)
3. Only you and recipient will see the decrypted message

### Viewing Encrypted/Decrypted Messages

- **Default View:** Decrypted message (readable)
- **Toggle Option:** Click "Show Encrypted" to see the actual encrypted data
- **Format:** `iv:authTag:encryptedData` (all hexadecimal)

---

## 🔐 Technical Details

### Encryption Process (Server-Side)

```javascript
// utils/encryption.js - encryptMessage()

function encryptMessage(plaintext, key) {
  // 1. Generate random IV
  const iv = crypto.randomBytes(16);
  
  // 2. Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  // 3. Encrypt message
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 4. Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // 5. Return combined result
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

### Decryption Process (Client-Side)

```javascript
// views/chatroom.ejs - decryptMessageClient()

async function decryptMessageClient(encryptedData) {
  // 1. Parse encrypted data
  const [iv, authTag, encryptedBytes] = encryptedData.split(':').map(h => hexToBuffer(h));
  
  // 2. Combine ciphertext with tag
  const combinedData = new Uint8Array([...encryptedBytes, ...authTag]);
  
  // 3. Import key
  const key = await crypto.subtle.importKey('raw', keyBuffer, 
    { name: 'AES-GCM' }, false, ['decrypt']);
  
  // 4. Decrypt with authentication
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    combinedData
  );
  
  return new TextDecoder().decode(decrypted);
}
```

### Database Schema

**Room:**
```javascript
{
  roomId: "ABC12345",
  roomName: "Team Meeting",
  creator: "user1",
  users: [
    { username: "user1", joinedAt: Date },
    { username: "user2", joinedAt: Date }
  ],
  maxUsers: 5,
  isActive: true,
  createdAt: Date,
  updatedAt: Date
  // Note: encryptionKey NOT stored here!
}
```

**Message:**
```javascript
{
  roomId: "ABC12345",
  sender: "user1",
  receiver: null, // null for group, "user2" for private
  encryptedText: "a1b2c3d4:e5f6g7h8:i9j0k1l2m3n4o5p6...",
  isPrivate: false,
  messageType: "group",
  timestamp: Date,
  readBy: []
}
```

---

## 🔍 Key Management Explanation

### Question: Why not store keys in database?

**Scenario: Database is compromised**
- If keys are in DB → Attacker has all historical messages AND keys → Can decrypt everything
- If keys only in memory → Attacker has historical encrypted messages but NO keys → Cannot decrypt

### Question: What if server restarts?

**Trade-off for Demo:**
- Current: Keys lost on restart (acceptable for temporary chat)
- Production: Use Redis/AWS KMS with persistent key storage

### Question: How do new members get the key?

**Current Architecture:**
```
1. User joins room via /join-room (HTTP POST)
2. Server retrieves key from memory
3. Server sends key to client via response
4. Client stores key in sessionStorage
5. Client uses key for all future decryption
```

### Question: What about man-in-the-middle (MITM)?

**Current Vulnerability:**
- Key sent over plaintext Socket.io connection
- Attacker could intercept key during distribution

**Fix - Use ECDH Key Exchange:**
```javascript
// In utils/encryption.js - BONUS functions

// Server side:
const { privateKey: serverPrivate, publicKey: serverPublic } = generateECDHKeyPair();

// Client receives server public key, generates own pair
const { privateKey: clientPrivate, publicKey: clientPublic } = generateECDHKeyPair();

// Exchange public keys (safe, even if intercepted)
// serverPrivate + clientPublic → shared_secret (A)
// clientPrivate + serverPublic → shared_secret (A) [SAME!]

// Both derive encryption key from shared secret
const encryptionKey = crypto.pbkdf2Sync(shared_secret, 'salt', 100000, 32, 'sha256');
```

---

## 🧪 Testing the System

### Test Scenario 1: Basic Encryption

```bash
# Terminal 1: Start server
npm start

# Browser 1: Create room
- Go to http://localhost:3000
- Create room "Test"
- Share Room ID

# Browser 2: Join room
- Enter Room ID
- Send message: "Hello from User 2!"
- Click "Show Encrypted" to see encrypted format
- Should see: iv:authTag:encryptedData
```

### Test Scenario 2: Private Messages

```bash
# Same setup as above
# User 1 sends private message to User 2:
- Select "User 2" from dropdown
- Type: "Private message!"
- Send
# Only User 1 and User 2 see decrypted
# User 3+ see encrypted
```

### Test Scenario 3: Key Statistics

```bash
# In chatroom, click "📊 Key Stats" button
# Shows:
- Algorithm: AES-256-GCM
- Key Size: 256 bits
- IV Size: 128 bits per message
- Auth Tag Size: 128 bits
- Active rooms with keys
```

### Test Scenario 4: Message Integrity

```bash
# Attacker scenario: Modify encrypted message
# In browser dev console:
- Grab any message's encrypted text
- Modify one character
- Try to send (or manually decrypt)
# Should fail with: "Authentication tag verification failed"
# Proves: Tampering detected!
```

---

## 📊 Security Analysis

### Strengths

| Feature | Level | Details |
|---------|-------|---------|
| Encryption Algorithm | ⭐⭐⭐⭐⭐ | AES-256-GCM is NIST-approved, industry standard |
| Key Size | ⭐⭐⭐⭐⭐ | 256-bit keys (requires 2^256 operations to brute force) |
| Authenticated Encryption | ⭐⭐⭐⭐⭐ | Detects tampering with every message |
| Random IV | ⭐⭐⭐⭐⭐ | Unique per message prevents pattern analysis |
| Key Generation | ⭐⭐⭐⭐⭐ | Uses cryptographically secure randomness |

### Limitations

| Issue | Severity | Notes |
|-------|----------|-------|
| Key sent in plaintext over Socket.io | ⚠️ High | Fix: Use ECDH key exchange (provided in code) |
| Keys lost on server restart | ⚠️ Medium | Fix: Use Redis or AWS KMS in production |
| No user authentication | ℹ️ Info | Demo only - add JWT/OAuth in production |
| Single-pass encryption | ℹ️ Info | Should add key derivation (PBKDF2, bcrypt) |
| Browser-side decryption | ℹ️ Info | Key stored in sessionStorage (volatile) |

---

## 🚀 Production Deployment

### Security Hardening Checklist

```
✅ Use HTTPS/TLS for all connections
✅ Implement Diffie-Hellman key exchange (bonus code provided)
✅ Use Redis for key storage with TTL
✅ Add JWT authentication
✅ Implement rate limiting
✅ Add input validation & sanitization
✅ Enable CORS properly
✅ Use environment variables for secrets
✅ Add logging and monitoring
✅ Regular security audits
✅ Implement key rotation policy
```

### Deploy to Heroku

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Set environment variables
heroku config:set MONGODB_URI="your-mongo-uri"
heroku config:set NODE_ENV="production"

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail
```

### Deploy to AWS EC2

```bash
# 1. Connect to instance
ssh -i key.pem ec2-user@your-ip

# 2. Install Node & MongoDB
sudo yum install nodejs mongodb-org

# 3. Clone repo & install dependencies
git clone your-repo
npm install

# 4. Start with PM2
npm install -g pm2
pm2 start server.js
pm2 startup
pm2 save
```

---

## 🔬 Cryptography Bonus: ECDH Key Exchange

### Problem
- Keys must be shared between client and server
- Cannot send key over insecure channel
- Solution: Non-interactive key agreement

### How ECDH Works

```
ECDH (Elliptic Curve Diffie-Hellman)

1. Server:
   - Generates ECDH keypair (Server_Private, Server_Public)
   - Sends Server_Public to client

2. Client:
   - Generates ECDH keypair (Client_Private, Client_Public)
   - Sends Client_Public to server

3. Key Agreement:
   - Server computes: shared_secret = Server_Private × Client_Public
   - Client computes: shared_secret = Client_Private × Server_Public
   - Result: Both arrive at SAME shared_secret!

4. Derive Encryption Key:
   - shared_secret (256 bytes) → PBKDF2 → 32-byte AES key

SECURITY: Even if attacker has Server_Public and Client_Public,
they cannot compute shared_secret without the private keys
(equivalent to solving discrete logarithm problem).
```

### Implementation

```javascript
// In utils/encryption.js (already implemented!)

// Server side
const { privateKey: serverPrivate, publicKey: serverPublic } = generateECDHKeyPair();

// Client side
const { privateKey: clientPrivate, publicKey: clientPublic } = generateECDHKeyPair();

// Share public keys over insecure channel (safe!)
// Then compute shared secret:
const encryptionKey = computeECDHSharedSecret(serverPrivate, clientPublicKey);
```

---

## 📚 Learning Resources

### Cryptography Concepts
- [AES Encryption Explained](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
- [GCM Mode Authentication](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [Diffie-Hellman Key Exchange](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)

### Implementation References
- [NIST Cryptography Standards](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [Socket.io Security Best Practices](https://socket.io/docs/v4/security/)
- [MongoDB Data Security](https://docs.mongodb.com/manual/security/)

---

## 🐛 Troubleshooting

### Issue: `MongooseError: Cannot connect to MongoDB`

**Solution:**
```bash
# Check MongoDB is running
mongod --version

# Start MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB

# Verify MONGODB_URI in .env
```

### Issue: `Error: Port 3000 is already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Issue: `Socket.io connection timeout`

**Solution:**
```bash
# Check server is running
# Check firewall settings
# Verify Socket.io version matches client-side
# Check browser console for errors
```

### Issue: `Decryption fails with "Authentication tag verification failed"`

**Possible Causes:**
1. Wrong encryption key used
2. Encrypted data modified/corrupted
3. Wrong IV or auth tag

**Solution:**
- Verify key is same on client and server
- Check encrypted data format: `iv:authTag:encryptedData`
- Ensure no data corruption during transmission

---

## 📝 Code Comments & Documentation

All code files include detailed comments explaining:

✅ **Security Architecture**
- Why decisions were made
- Potential risks and mitigations

✅ **Encryption Logic**
- How AES-256-GCM works
- Why GCM mode was chosen

✅ **Key Management**
- Key generation process
- Distribution mechanism
- Storage strategy

✅ **API Endpoints**
- Request/response formats
- Authentication flows

✅ **Socket.io Events**
- Real-time messaging protocol
- Event handling

---

## 📄 License

MIT License - Feel free to use for educational purposes

---

## ❓ FAQ

**Q: Can I use this for production?**  
A: This is a demo for educational purposes. For production:
- Implement ECDH key exchange
- Use HTTPS/TLS
- Add user authentication (JWT)
- Implement key rotation
- Use AWS KMS or similar for key management

**Q: How do I improve security?**  
A: See "Production Deployment" section above. Also:
- Enable HSTS headers
- Implement CORS properly
- Add rate limiting
- Regular security audits

**Q: Can multiple rooms use the same key?**  
A: No - each room gets a unique 256-bit key during creation

**Q: Is end-to-end encryption supported?**  
A: Current version uses server-side encryption. For E2E:
- Client generates keys client-side
- Server never has plaintext
- Implement Signal Protocol or similar

**Q: How do I backup encryption keys?**  
A: Current demo stores keys in memory only. For production:
- Use AWS KMS with automatic backup
- Or MongoDB with encrypted key field
- Implement key escrow for recovery

---

## 📞 Support

For issues or questions, check:
1. Browser console for client-side errors
2. Server logs for backend errors
3. MongoDB connection string
4. Port availability
5. Node.js version compatibility

---

## ⭐ Highlights

- ✅ Complete working example of AES-256-GCM encryption
- ✅ Real-time messaging with Socket.io
- ✅ Proper key generation and management
- ✅ Educational comments throughout codebase
- ✅ Responsive, modern UI
- ✅ Production-ready code structure
- ✅ Bonus ECDH implementation for secure key exchange
- ✅ Tamper detection with authenticated encryption

---

**Built with ❤️ for learning cryptography and secure systems**
#   C n s - P r o j e c t - C h a t - M o d u l e  
 